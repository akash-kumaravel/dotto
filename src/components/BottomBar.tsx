import React, { useState } from 'react';
import {
  Video,
  Download,
  Rotate3d,
  Wind,
  Compass,
  FileText,
  Play,
  Square,
  Sparkles,
} from 'lucide-react';
import { ShirtConfig, TeePart } from '../types';
import { sound } from '../utils/audio';

interface BottomBarProps {
  config: ShirtConfig;
  onRotateAngle: (angleRad: number) => void;
  onTriggerGust: () => void;
  onToggleAutoRotate: () => void;
  onStartVideoRecord: (durationSeconds: number) => void;
  isRecordingVideo: boolean;
  recordingProgress: number;
  onOpenExport: () => void;
  onPartSelect: (part: TeePart) => void;
}

export const BottomBar: React.FC<BottomBarProps> = ({
  config,
  onRotateAngle,
  onTriggerGust,
  onToggleAutoRotate,
  onStartVideoRecord,
  isRecordingVideo,
  recordingProgress,
  onOpenExport,
  onPartSelect,
}) => {
  const [videoDuration, setVideoDuration] = useState<number>(4);

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 pointer-events-auto max-w-[calc(100vw-24px)] overflow-x-auto no-scrollbar p-1.5 rounded-2xl bg-white/90 dark:bg-[#181724]/90 border border-black/10 dark:border-white/10 shadow-2xl backdrop-blur-xl text-neutral-800 dark:text-white">
      {/* View Angle Quick Selectors */}
      <div className="flex items-center gap-1 pr-1.5 border-r border-black/10 dark:border-white/10">
        <button
          onClick={() => {
            sound.playFlip();
            onPartSelect('front');
            onRotateAngle(0);
          }}
          className="px-2.5 py-1.5 rounded-xl text-xs font-bold hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          title="Front View"
        >
          Front
        </button>
        <button
          onClick={() => {
            sound.playFlip();
            onPartSelect('back');
            onRotateAngle(Math.PI);
          }}
          className="px-2.5 py-1.5 rounded-xl text-xs font-bold hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          title="Back View"
        >
          Back
        </button>
        <button
          onClick={() => {
            sound.playFlip();
            onPartSelect('sleeveLeft');
            onRotateAngle(-Math.PI / 2);
          }}
          className="px-2.5 py-1.5 rounded-xl text-xs font-bold hover:bg-black/5 dark:hover:bg-white/10 transition-colors hidden sm:block"
          title="Left Profile"
        >
          Left
        </button>
        <button
          onClick={() => {
            sound.playFlip();
            onPartSelect('sleeveRight');
            onRotateAngle(Math.PI / 2);
          }}
          className="px-2.5 py-1.5 rounded-xl text-xs font-bold hover:bg-black/5 dark:hover:bg-white/10 transition-colors hidden sm:block"
          title="Right Profile"
        >
          Right
        </button>
        <button
          onClick={() => {
            sound.playClick();
            onRotateAngle(-0.45);
          }}
          className="p-1.5 rounded-xl text-xs font-bold hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          title="3/4 Perspective Angle"
        >
          <Compass className="w-4 h-4" />
        </button>
      </div>

      {/* Auto Rotate 360 Spin */}
      <button
        onClick={() => {
          sound.playClick();
          onToggleAutoRotate();
        }}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
          config.autoRotate
            ? 'bg-purple-600 text-white shadow-xs'
            : 'hover:bg-black/5 dark:hover:bg-white/10'
        }`}
        title="Toggle 360 Turntable Spin"
      >
        <Rotate3d className="w-4 h-4" />
        <span className="hidden sm:inline">360° Spin</span>
      </button>

      {/* Wind Wave Trigger */}
      <button
        onClick={() => {
          sound.playGust();
          onTriggerGust();
        }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 active:scale-95 transition-all"
        title="Realistic Wind Flutter Impulse"
      >
        <Wind className="w-4 h-4" />
        <span className="hidden sm:inline">Wind Breeze</span>
      </button>

      <div className="w-px h-6 bg-black/10 dark:border-white/10 my-auto" />

      {/* RECORD VIDEO BUTTON */}
      {isRecordingVideo ? (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-black animate-pulse">
          <Square className="w-3.5 h-3.5 fill-white" />
          <span>Recording {recordingProgress}%</span>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <select
            value={videoDuration}
            onChange={(e) => setVideoDuration(Number(e.target.value))}
            className="px-1.5 py-1 rounded-lg text-xs font-bold bg-black/5 dark:bg-white/10 border-0 outline-none cursor-pointer"
            title="Video Length"
          >
            <option value={3}>3s loop</option>
            <option value={5}>5s spin</option>
            <option value={8}>8s showcase</option>
          </select>

          <button
            onClick={() => onStartVideoRecord(videoDuration)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-rose-500 to-purple-600 hover:brightness-110 active:scale-95 shadow-md shadow-purple-500/25 transition-all"
            title="Save 3D Waving T-Shirt as Video"
          >
            <Video className="w-3.5 h-3.5" />
            <span>Save Video</span>
          </button>
        </div>
      )}

      {/* EXPORT IMAGE / TECH PACK */}
      <button
        onClick={onOpenExport}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold text-white bg-neutral-900 dark:bg-white dark:text-neutral-900 hover:brightness-110 active:scale-95 shadow-sm transition-all"
        title="Export High-Res Render"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Export</span>
      </button>
    </div>
  );
};
