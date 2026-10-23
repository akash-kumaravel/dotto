/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, Plus, Minus, RotateCw, Upload, Trash2, Sliders } from 'lucide-react';
import { ShirtConfig, StudioTheme, ShirtDesign, TextLayer, TeePart } from './types';
import { sound } from './utils/audio';
import { videoRecorder } from './utils/videoRecorder';
import { ThreeCanvas, ThreeCanvasHandle } from './components/ThreeCanvas';
import { StudioNavRail, StudioTab } from './components/StudioNavRail';
import { StudioInspector } from './components/StudioInspector';
import { BottomToolbar } from './components/BottomToolbar';
import { VideoModal } from './components/VideoModal';
import { ExportModal } from './components/ExportModal';

const emptyDesign: ShirtDesign = {
  img: null,
  name: '',
  x: 512,
  y: 530,
  w: 380,
  h: 380,
  rot: 0,
  sc: 1.0,
  opacity: 0.96,
  blendMode: 'source-over',
  flipX: false,
  flipY: false,
};

const defaultText: TextLayer = {
  enabled: false,
  text: 'TEE STUDIO',
  font: 'Space Grotesk',
  size: 38,
  color: '#18181b',
  curved: false,
  curveRadius: 260,
  x: 512,
  y: 720,
  rot: 0,
  letterSpacing: 4,
  weight: '700',
};

const createInitialConfig = (): ShirtConfig => ({
  activePart: 'front',
  parts: {
    front: {
      color: '#ffffff',
      design: { ...emptyDesign },
      text: { ...defaultText },
    },
    back: {
      color: '#ffffff',
      design: { ...emptyDesign },
      text: { ...defaultText },
    },
    collar: {
      color: '#ffffff',
    },
    sleeveLeft: {
      color: '#ffffff',
      design: { ...emptyDesign },
      text: { ...defaultText },
    },
    sleeveRight: {
      color: '#ffffff',
      design: { ...emptyDesign },
      text: { ...defaultText },
    },
  },
  fabric: 'cotton',
  windIntensity: 0.22,
  windGust: 0,
  theme: 'studio',
  backdropColor: '#ececf0',
  backdropImage: null,
  backdropPattern: null,
  showStitches: true,
  autoRotate: false,
});

export default function App() {
  const [config, setConfig] = useState<ShirtConfig>(createInitialConfig);
  const [activeTab, setActiveTab] = useState<StudioTab>('edit');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [isWireframe, setIsWireframe] = useState<boolean>(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(true);
  const [hoveredPart, setHoveredPart] = useState<TeePart | null>(null);

  // Modals
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  // Video recording
  const [isRecordingVideo, setIsRecordingVideo] = useState<boolean>(false);
  const [recordingProgress, setRecordingProgress] = useState<number>(0);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string>('');
  const [isVideoModalOpen, setIsVideoModalOpen] = useState<boolean>(false);

  // Undo / Redo history
  const [undoStack, setUndoStack] = useState<ShirtConfig[]>([]);
  const [redoStack, setRedoStack] = useState<ShirtConfig[]>([]);

  const threeRef = useRef<ThreeCanvasHandle | null>(null);
  const directFileInputRef = useRef<HTMLInputElement | null>(null);
  const targetUploadPartRef = useRef<TeePart>('front');

  // Helper to commit config with undo history
  const pushConfigChange = useCallback((newConfigOrFn: ShirtConfig | ((prev: ShirtConfig) => ShirtConfig)) => {
    setConfig((prev) => {
      const next = typeof newConfigOrFn === 'function' ? newConfigOrFn(prev) : newConfigOrFn;
      setUndoStack((u) => [...u.slice(-20), prev]);
      setRedoStack([]);
      return next;
    });
  }, []);

  const handleUndo = useCallback(() => {
    setUndoStack((prevUndo) => {
      if (prevUndo.length === 0) return prevUndo;
      const prev = prevUndo[prevUndo.length - 1];
      const newUndo = prevUndo.slice(0, -1);
      setRedoStack((r) => [...r, config]);
      setConfig(prev);
      threeRef.current?.repaintNow();
      return newUndo;
    });
  }, [config]);

  const handleRedo = useCallback(() => {
    setRedoStack((prevRedo) => {
      if (prevRedo.length === 0) return prevRedo;
      const next = prevRedo[prevRedo.length - 1];
      const newRedo = prevRedo.slice(0, -1);
      setUndoStack((u) => [...u, config]);
      setConfig(next);
      threeRef.current?.repaintNow();
      return newRedo;
    });
  }, [config]);

  // Update specific part design
  const handleDesignChange = useCallback(
    (part: 'front' | 'back' | 'sleeveLeft' | 'sleeveRight', updates: Record<string, unknown>) => {
      pushConfigChange((prev) => {
        const currentPart = prev.parts[part];
        if (!currentPart) return prev;
        return {
          ...prev,
          parts: {
            ...prev.parts,
            [part]: {
              ...currentPart,
              design: {
                ...currentPart.design,
                ...updates,
              },
            },
          },
        };
      });
    },
    [pushConfigChange]
  );

  // Update specific part configuration (color, text, etc)
  const handlePartConfigChange = useCallback(
    (part: TeePart, updates: Record<string, unknown>) => {
      if (part === 'all') {
        pushConfigChange((prev) => {
          const newColor = updates.color as string;
          if (newColor) {
            return {
              ...prev,
              parts: {
                front: { ...prev.parts.front, color: newColor },
                back: { ...prev.parts.back, color: newColor },
                collar: { color: newColor },
                sleeveLeft: { ...prev.parts.sleeveLeft, color: newColor },
                sleeveRight: { ...prev.parts.sleeveRight, color: newColor },
              },
            };
          }
          return prev;
        });
        return;
      }

      if (part === 'collar') {
        pushConfigChange((prev) => ({
          ...prev,
          parts: {
            ...prev.parts,
            collar: { ...prev.parts.collar, ...updates },
          },
        }));
        return;
      }

      pushConfigChange((prev) => {
        const currentPart = prev.parts[part];
        if (!currentPart) return prev;
        return {
          ...prev,
          parts: {
            ...prev.parts,
            [part]: {
              ...currentPart,
              ...updates,
            },
          },
        };
      });
    },
    [pushConfigChange]
  );

  const handleConfigChange = (updates: Partial<ShirtConfig>) => {
    pushConfigChange((prev) => ({ ...prev, ...updates }));
  };

  // Part selection & camera smooth rotation
  const handlePartSelect = (part: TeePart) => {
    setConfig((prev) => ({ ...prev, activePart: part }));

    if (part === 'front' || part === 'collar') {
      threeRef.current?.rotateTo(0);
    } else if (part === 'back') {
      threeRef.current?.rotateTo(Math.PI);
    } else if (part === 'sleeveLeft') {
      threeRef.current?.rotateTo(-Math.PI / 2);
    } else if (part === 'sleeveRight') {
      threeRef.current?.rotateTo(Math.PI / 2);
    } else if (part === 'all') {
      threeRef.current?.rotateTo(-0.45);
    }
  };

  const handleTriggerGust = () => {
    sound.playGust();
    threeRef.current?.triggerGust();
  };

  // Trigger file upload for specific part from 3D canvas interaction
  const handleTriggerPartUpload = useCallback((part: TeePart) => {
    targetUploadPartRef.current = part;
    handlePartSelect(part);
    directFileInputRef.current?.click();
  }, []);

  // File Upload
  const handleFileUpload = (file: File, specificPart?: TeePart) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxSize = 380;
        const scaleFactor = maxSize / Math.max(img.width, img.height);
        const drawW = img.width * scaleFactor;
        const drawH = img.height * scaleFactor;

        sound.playClick();
        const designatedPart = specificPart || targetUploadPartRef.current || config.activePart;
        const targetPart =
          designatedPart === 'all' || designatedPart === 'collar'
            ? 'front'
            : (designatedPart as 'front' | 'back' | 'sleeveLeft' | 'sleeveRight');

        handleDesignChange(targetPart, {
          img,
          name: file.name,
          w: drawW,
          h: drawH,
          x: 512,
          y: 530,
          sc: 1.0,
          rot: 0,
        });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Start Video Recording
  const handleBackdropAssetUpload = (file: File, kind: 'image' | 'pattern') => {
    if (!file.type.startsWith('image/')) {
      window.alert('Please choose an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        window.alert('The selected image could not be read.');
        return;
      }
      const image = new Image();
      image.onload = () => {
        handleConfigChange(
          kind === 'image'
            ? { theme: 'custom', backdropImage: reader.result as string, backdropPattern: null }
            : { theme: 'custom', backdropImage: null, backdropPattern: reader.result as string }
        );
      };
      image.onerror = () => window.alert('The selected image could not be loaded.');
      image.src = reader.result;
    };
    reader.onerror = () => window.alert('The selected image could not be read.');
    reader.readAsDataURL(file);
  };

  const handleStartVideoRecord = (durationSeconds: number, transparentBackground: boolean) => {
    const canvas = threeRef.current?.getCanvas();
    if (!canvas) return;

    sound.playClick();
    setIsRecordingVideo(true);
    setRecordingProgress(0);

    threeRef.current?.setRecordingQuality(true);
    threeRef.current?.setAutoRotate(true);

    videoRecorder.startRecording(canvas, {
      durationSeconds,
      transparentBackground,
      backgroundColor: config.backdropColor,
      backgroundImage: config.backdropImage,
      backgroundPattern: config.backdropPattern,
      onProgress: (p) => setRecordingProgress(p),
      onComplete: (url) => {
        setIsRecordingVideo(false);
        setRecordingProgress(100);
        setRecordedVideoUrl(url);
        setIsVideoModalOpen(true);
        threeRef.current?.setRecordingQuality(false);
        threeRef.current?.setAutoRotate(config.autoRotate);
      },
      onError: (err) => {
        console.error('Recording error:', err);
        window.alert(`Could not record video: ${err.message}`);
        setIsRecordingVideo(false);
        threeRef.current?.setRecordingQuality(false);
        threeRef.current?.setAutoRotate(config.autoRotate);
      },
    });
  };

  // Window drag and drop listeners
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsDragOver(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      if (!e.relatedTarget) {
        setIsDragOver(false);
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer && e.dataTransfer.files.length > 0) {
        handleFileUpload(e.dataTransfer.files[0]);
      }
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, [config.activePart]);

  // Keyboard shortcuts: Ctrl+Z (Undo), Ctrl+Y (Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  const themeClass =
    config.theme === 'dark-editorial'
      ? 'theme-dark'
      : config.theme === 'sunset'
      ? 'theme-sunset'
      : '';

  const partNames: Record<string, string> = {
    front: 'Front Panel',
    back: 'Back Panel',
    collar: 'Collar Ribbing',
    sleeveLeft: 'Left Sleeve',
    sleeveRight: 'Right Sleeve',
    all: 'All 5 Parts',
  };

  const activePartKey =
    config.activePart !== 'collar' && config.activePart !== 'all'
      ? (config.activePart as 'front' | 'back' | 'sleeveLeft' | 'sleeveRight')
      : null;
  const activeDesign = activePartKey ? config.parts[activePartKey]?.design : null;

  return (
    <div
      className={`relative w-screen h-screen overflow-hidden select-none ${themeClass}`}
      style={config.theme === 'custom' ? { background: config.backdropColor } : undefined}
    >
      {config.backdropImage && (
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: `url("${config.backdropImage}")`,
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
          }}
        />
      )}
      {config.backdropPattern && (
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none z-0 opacity-20"
          style={{
            backgroundImage: `url("${config.backdropPattern}")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '128px 128px',
          }}
        />
      )}
      {/* Background ambient lighting */}
      <div className="blob b1" />
      <div className="blob b2" />
      <div className="blob b3" />

      {/* Hidden input for direct part click-to-upload */}
      <input
        ref={directFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0], targetUploadPartRef.current);
            e.target.value = '';
          }
        }}
      />

      {/* Mobile Switcher Pill (View 3D / Edit & Upload) */}
      <div className="sm:hidden fixed top-3 left-1/2 -translate-x-1/2 z-40 bg-white/95 backdrop-blur-md p-1 rounded-2xl shadow-xl border border-purple-100 flex items-center gap-1 text-xs font-bold">
        <button
          onClick={() => {
            sound.playClick();
            setIsInspectorOpen(false);
          }}
          className={`px-3 py-1.5 rounded-xl transition-all ${
            !isInspectorOpen ? 'bg-purple-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          👕 View 3D
        </button>
        <button
          onClick={() => {
            sound.playClick();
            setIsInspectorOpen(true);
          }}
          className={`px-3 py-1.5 rounded-xl transition-all ${
            isInspectorOpen ? 'bg-purple-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          🎨 Edit & Upload
        </button>
      </div>

      {/* 3D Model Viewport Area (starts AFTER the upload image container, placing 3D model squarely on the right side) */}
      <main
        className={`absolute top-0 bottom-0 right-0 transition-all duration-300 ease-out overflow-hidden flex flex-col items-center justify-center ${
          isInspectorOpen
            ? 'left-0 sm:left-[424px] md:left-[442px] lg:left-[452px]'
            : 'left-[72px] sm:left-[76px]'
        }`}
      >
        {/* Contact floor shadow aligned directly under the 3D t-shirt */}
        <div id="floor" style={{ left: '50%', transform: 'translateX(-50%)' }} />

        {/* 3D WebGL Canvas */}
        <ThreeCanvas
          ref={threeRef}
          config={config}
          onDesignChange={handleDesignChange}
          onPartSelect={handlePartSelect}
          onHoverPartChange={setHoveredPart}
          onTriggerUpload={handleTriggerPartUpload}
          sidebarOpen={isInspectorOpen}
        />

        {/* Hover HUD Pill Indicator centered directly above the 3D shirt */}
        {hoveredPart && (
          <div className="absolute top-5 left-1/2 -translate-x-1/2 z-20 pointer-events-none transition-all duration-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-900/85 backdrop-blur-md border border-purple-500/40 shadow-xl shadow-purple-950/20 text-white text-xs font-semibold tracking-wide">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse shadow-sm shadow-purple-300" />
              <span className="text-purple-300 font-bold uppercase tracking-wider text-[11px]">
                {partNames[hoveredPart] || hoveredPart}
              </span>
              <span className="text-gray-300 font-normal">
                {hoveredPart === 'collar' ? 'Click to change color' : 'Click to upload & resize'}
              </span>
            </div>
          </div>
        )}

        {/* Bottom Center Toolbar centered beneath the 3D shirt */}
        <BottomToolbar
          onZoomIn={() => threeRef.current?.zoomIn()}
          onZoomOut={() => threeRef.current?.zoomOut()}
          onResetView={() => threeRef.current?.resetView()}
          onToggleWireframe={() => {
            const nextWf = threeRef.current?.toggleWireframe() ?? false;
            setIsWireframe(nextWf);
          }}
          onOpenExport={() => setIsExportOpen(true)}
          isWireframe={isWireframe}
        />
      </main>

      {/* Floating Visual Design Controls (When active part has design) */}
      {activePartKey && activeDesign?.img && (
        <div className="absolute top-5 right-20 z-20 flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/95 backdrop-blur-md border border-purple-100 shadow-xl text-xs select-none">
          <span className="font-bold text-gray-800 flex items-center gap-1.5 pl-1">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            {partNames[config.activePart] || 'Design'}
          </span>
          <div className="h-4 w-px bg-gray-200 mx-1" />
          <span className="text-gray-500 font-medium">Resize:</span>
          <button
            onClick={() => {
              sound.playClick();
              handleDesignChange(activePartKey, { sc: Math.max(0.25, Number((activeDesign.sc - 0.1).toFixed(2))) });
            }}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-purple-50 text-gray-700 font-bold active:scale-95 transition-all"
            title="Scale Down"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="font-bold text-purple-700 min-w-10 text-center text-xs">
            {Math.round(activeDesign.sc * 100)}%
          </span>
          <button
            onClick={() => {
              sound.playClick();
              handleDesignChange(activePartKey, { sc: Math.min(3.2, Number((activeDesign.sc + 0.1).toFixed(2))) });
            }}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-purple-50 text-gray-700 font-bold active:scale-95 transition-all"
            title="Scale Up"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <div className="h-4 w-px bg-gray-200 mx-1" />
          <button
            onClick={() => {
              sound.playClick();
              handleDesignChange(activePartKey, { rot: (activeDesign.rot + Math.PI / 4) % (Math.PI * 2) });
            }}
            className="px-2 py-1 flex items-center gap-1 rounded-lg hover:bg-purple-50 text-gray-700 font-medium active:scale-95 transition-all"
            title="Rotate 45°"
          >
            <RotateCw className="w-3.5 h-3.5 text-purple-600" />
            <span>Rotate</span>
          </button>
          <button
            onClick={() => handleTriggerPartUpload(config.activePart)}
            className="px-2 py-1 flex items-center gap-1 rounded-lg hover:bg-purple-50 text-purple-600 font-bold active:scale-95 transition-all"
            title="Upload new image"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Replace</span>
          </button>
          <button
            onClick={() => {
              sound.playClick();
              handleDesignChange(activePartKey, { img: null, name: '' });
            }}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-500 active:scale-95 transition-all"
            title="Remove design"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 1. Left Navigation Rail (Exact Pacdora style) */}
      <StudioNavRail
        activeTab={activeTab}
        onTabChange={(tab) => {
          sound.playClick();
          setActiveTab(tab);
          setIsInspectorOpen(true);
        }}
      />

      {/* 2. Left Floating Inspector Panel (Upload, Color, Material, Parts) */}
      <StudioInspector
        activeTab={activeTab}
        config={config}
        onConfigChange={handleConfigChange}
        onBackdropAssetUpload={handleBackdropAssetUpload}
        onPartConfigChange={handlePartConfigChange}
        onDesignChange={handleDesignChange}
        onFileUpload={handleFileUpload}
        onPartSelect={handlePartSelect}
        onStartVideoRecord={handleStartVideoRecord}
        isRecordingVideo={isRecordingVideo}
        recordingProgress={recordingProgress}
        onTriggerGust={handleTriggerGust}
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
      />

      {/* Reopen Inspector Button (When collapsed) */}
      {!isInspectorOpen && (
        <button
          onClick={() => {
            sound.playClick();
            setIsInspectorOpen(true);
          }}
          className="fixed left-[84px] sm:left-[92px] top-5 z-20 px-3.5 py-2 bg-white/95 backdrop-blur-md border border-purple-200/90 shadow-xl rounded-2xl flex items-center gap-2 text-xs font-bold text-purple-700 hover:bg-purple-50 active:scale-95 transition-all cursor-pointer"
          title="Open Design Editor"
        >
          <Sliders className="w-4 h-4 text-purple-600" />
          <span>Edit & Upload</span>
        </button>
      )}


      {/* Drag & Drop Visual Overlay */}
      {isDragOver && (
        <div id="drop-overlay" className="animate-pulse">
          <div className="flex flex-col items-center gap-2">
            <span className="text-3xl sm:text-4xl">👕 Drop your design</span>
            <span className="text-sm font-semibold opacity-70">PNG, JPG, or SVG accepted</span>
          </div>
        </div>
      )}

      {/* Video Preview & Download Modal */}
      <VideoModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        videoUrl={recordedVideoUrl}
      />

      {/* Export & Tech Pack Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        config={config}
        onExportImage={(transparent) => threeRef.current?.exportImage(transparent) || ''}
      />

    </div>
  );
}
