import React from 'react';
import { Minus, Plus, Box, Layers } from 'lucide-react';
import { sound } from '../utils/audio';

interface BottomToolbarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onToggleWireframe: () => void;
  onOpenExport?: () => void;
  isWireframe?: boolean;
}

export const BottomToolbar: React.FC<BottomToolbarProps> = ({
  onZoomIn,
  onZoomOut,
  onResetView,
  onToggleWireframe,
  isWireframe = false,
}) => {
  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 select-none pointer-events-auto">
      {/* CAMERA NAVIGATION CONTROLS PILL */}
      <div className="h-11 px-3 bg-white rounded-2xl shadow-xl border border-gray-100 flex items-center gap-3.5 text-gray-700">
        {/* Zoom Out (-) */}
        <button
          onClick={() => {
            sound.playClick();
            onZoomOut();
          }}
          className="p-1 hover:text-black hover:scale-110 active:scale-95 transition-all text-gray-600"
          title="Zoom Out"
        >
          <Minus className="w-4 h-4 stroke-[2.2]" />
        </button>

        {/* Zoom In (+) */}
        <button
          onClick={() => {
            sound.playClick();
            onZoomIn();
          }}
          className="p-1 hover:text-black hover:scale-110 active:scale-95 transition-all text-gray-600"
          title="Zoom In"
        >
          <Plus className="w-4 h-4 stroke-[2.2]" />
        </button>

        {/* Separator line */}
        <div className="w-px h-5 bg-gray-200" />

        {/* Reset 3D View (Cube icon) */}
        <button
          onClick={() => {
            sound.playClick();
            onResetView();
          }}
          className="p-1 hover:text-purple-600 hover:scale-110 active:scale-95 transition-all text-gray-600"
          title="Reset Camera & Angle"
        >
          <Box className="w-4 h-4 stroke-[2]" />
        </button>

        {/* Toggle Wireframe / Perspective Mode */}
        <button
          onClick={() => {
            sound.playClick();
            onToggleWireframe();
          }}
          className={`p-1 hover:scale-110 active:scale-95 transition-all ${
            isWireframe ? 'text-purple-600' : 'text-gray-600 hover:text-black'
          }`}
          title="Toggle Mesh Wireframe"
        >
          <Layers className="w-4 h-4 stroke-[2]" />
        </button>
      </div>
    </div>
  );
};

