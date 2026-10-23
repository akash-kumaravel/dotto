// Client-side WebGL canvas video recording engine

export interface RecordOptions {
  durationSeconds: number;
  transparentBackground?: boolean;
  backgroundColor?: string;
  backgroundImage?: string | null;
  backgroundPattern?: string | null;
  onProgress?: (progress: number) => void;
  onComplete?: (blobUrl: string, blob: Blob) => void;
  onError?: (err: Error) => void;
}

export class VideoRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private progressInterval: number | null = null;
  private drawFrameId: number | null = null;
  private activeStream: MediaStream | null = null;
  public isRecording = false;

  startRecording(canvas: HTMLCanvasElement, options: RecordOptions) {
    if (this.isRecording) return;

    this.isRecording = true;
    this.recordedChunks = [];

    try {
      if (!canvas.captureStream || typeof MediaRecorder === 'undefined') {
        throw new Error('Canvas stream capture not supported by browser.');
      }

      const compositeCanvas = document.createElement('canvas');
      compositeCanvas.width = 1920;
      compositeCanvas.height = 1080;
      const context = compositeCanvas.getContext('2d');
      if (!context) {
        throw new Error('Could not create the video compositing canvas.');
      }

      const loadImage = (src: string | null | undefined): Promise<HTMLImageElement | null> => {
        if (!src) return Promise.resolve(null);
        return new Promise((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = () => reject(new Error('Could not load a background image for recording.'));
          image.src = src;
        });
      };

      const start = async () => {
        const [backgroundImage, backgroundPattern] = await Promise.all([
          options.transparentBackground ? null : loadImage(options.backgroundImage),
          options.transparentBackground ? null : loadImage(options.backgroundPattern),
        ]);
        if (!this.isRecording) return;

        let pattern: CanvasPattern | null = null;
        if (backgroundPattern) {
          const tile = document.createElement('canvas');
          tile.width = 128;
          tile.height = 128;
          const tileContext = tile.getContext('2d');
          if (!tileContext) {
            throw new Error('Could not prepare the logo background pattern.');
          }
          const scale = Math.min(112 / backgroundPattern.width, 112 / backgroundPattern.height);
          const width = backgroundPattern.width * scale;
          const height = backgroundPattern.height * scale;
          tileContext.drawImage(backgroundPattern, (128 - width) / 2, (128 - height) / 2, width, height);
          pattern = context.createPattern(tile, 'repeat');
        }
        const drawFrame = () => {
          if (!this.isRecording) return;

          if (!options.transparentBackground) {
            context.fillStyle = options.backgroundColor || '#ececf0';
            context.fillRect(0, 0, compositeCanvas.width, compositeCanvas.height);

            if (backgroundImage) {
              const scale = Math.max(
                compositeCanvas.width / backgroundImage.width,
                compositeCanvas.height / backgroundImage.height
              );
              const width = backgroundImage.width * scale;
              const height = backgroundImage.height * scale;
              context.drawImage(
                backgroundImage,
                (compositeCanvas.width - width) / 2,
                (compositeCanvas.height - height) / 2,
                width,
                height
              );
            }

            if (pattern) {
              context.save();
              context.globalAlpha = 0.2;
              context.fillStyle = pattern;
              context.fillRect(0, 0, compositeCanvas.width, compositeCanvas.height);
              context.restore();
            }
          } else {
            context.clearRect(0, 0, compositeCanvas.width, compositeCanvas.height);
          }

          const scale = Math.min(
            compositeCanvas.width / canvas.width,
            compositeCanvas.height / canvas.height
          );
          const width = canvas.width * scale;
          const height = canvas.height * scale;
          context.drawImage(
            canvas,
            (compositeCanvas.width - width) / 2,
            (compositeCanvas.height - height) / 2,
            width,
            height
          );
          this.drawFrameId = requestAnimationFrame(drawFrame);
        };

        drawFrame();
        const stream = compositeCanvas.captureStream(60);
        this.activeStream = stream;

        const vp9MimeType = 'video/webm;codecs=vp9';
        if (options.transparentBackground && !MediaRecorder.isTypeSupported(vp9MimeType)) {
          throw new Error('Transparent video requires browser support for VP9 WebM recording.');
        }
        const mimeType = (options.transparentBackground
          ? [vp9MimeType]
          : [vp9MimeType, 'video/webm;codecs=vp8', 'video/webm']
        ).find((type) => MediaRecorder.isTypeSupported(type));
        const recorder = new MediaRecorder(stream, {
          ...(mimeType ? { mimeType } : {}),
          videoBitsPerSecond: 12_000_000,
        });
        this.mediaRecorder = recorder;

        let recordingFailed = false;
        const cleanUp = () => {
          this.clearProgressInterval();
          this.stopDrawingFrames();
          this.activeStream?.getTracks().forEach((track) => track.stop());
          this.activeStream = null;
          this.isRecording = false;
        };

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) this.recordedChunks.push(event.data);
        };

        recorder.onerror = (event) => {
          recordingFailed = true;
          cleanUp();
          options.onError?.(new Error(`Video recording failed: ${event.type}`));
        };

        recorder.onstop = () => {
          cleanUp();
          if (recordingFailed) return;
          const blob = new Blob(this.recordedChunks, {
            type: recorder.mimeType || 'video/webm',
          });
          options.onComplete?.(URL.createObjectURL(blob), blob);
        };

        const startTime = Date.now();
        const totalMs = options.durationSeconds * 1000;
        this.progressInterval = window.setInterval(() => {
          if (!this.isRecording) {
            this.clearProgressInterval();
            return;
          }

          const elapsed = Date.now() - startTime;
          options.onProgress?.(Math.min(100, Math.round((elapsed / totalMs) * 100)));
          if (elapsed >= totalMs) this.stopRecording();
        }, 50);

        recorder.start(250);
      };

      void start().catch((err: unknown) => {
        this.clearProgressInterval();
        this.stopDrawingFrames();
        this.activeStream?.getTracks().forEach((track) => track.stop());
        this.activeStream = null;
        this.isRecording = false;
        options.onError?.(err instanceof Error ? err : new Error(String(err)));
      });
    } catch (err) {
      this.clearProgressInterval();
      this.stopDrawingFrames();
      this.activeStream?.getTracks().forEach((track) => track.stop());
      this.activeStream = null;
      this.isRecording = false;
      options.onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }

  stopRecording() {
    this.clearProgressInterval();
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      this.isRecording = false;
      this.stopDrawingFrames();
      return;
    }

    this.activeStream?.getTracks().forEach((track) => track.stop());
    this.activeStream = null;
    this.isRecording = false;
    this.stopDrawingFrames();
  }

  private clearProgressInterval() {
    if (this.progressInterval !== null) {
      window.clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  private stopDrawingFrames() {
    if (this.drawFrameId !== null) {
      cancelAnimationFrame(this.drawFrameId);
      this.drawFrameId = null;
    }
  }
}

export const videoRecorder = new VideoRecorder();
