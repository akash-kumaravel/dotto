import React from 'react';
import { X, Download, RotateCcw, Check, Video } from 'lucide-react';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
}

export const VideoModal: React.FC<VideoModalProps> = ({ isOpen, onClose, videoUrl }) => {
  if (!isOpen || !videoUrl) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `tee-studio-3d-video-${Date.now()}.webm`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#181724] border border-black/10 dark:border-white/10 shadow-2xl p-6 text-neutral-900 dark:text-white">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-rose-500 to-purple-600 text-white shadow-md shadow-purple-500/30">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black">Your 3D Video is Ready!</h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              High-definition animated cloth simulation video
            </p>
          </div>
        </div>

        {/* Video Player */}
        <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black/10 dark:bg-black/40 border border-black/10 dark:border-white/10 mb-5 flex items-center justify-center shadow-inner">
          <video
            src={videoUrl}
            autoPlay
            loop
            muted
            controls
            playsInline
            className="w-full h-full object-contain"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-extrabold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 active:scale-98 shadow-lg shadow-purple-500/25 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download Video File (.webm)</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-3 rounded-2xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 text-xs font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
