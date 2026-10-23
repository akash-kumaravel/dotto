import React from 'react';
import { X, MousePointer, Move, ZoomIn, Wind, Upload, Eye, Video, Palette } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const items = [
    {
      icon: <Palette className="w-4 h-4 text-purple-600" />,
      title: 'Multi-Part Garment Customization',
      desc: 'Select individual parts (Front, Back, Collar, Left/Right Sleeves) to apply unique colors, fabrics, and custom graphics independently.',
    },
    {
      icon: <Video className="w-4 h-4 text-rose-500" />,
      title: 'Save as Video (360° Showcase)',
      desc: 'Click "Save Video" to record a high-definition video of the 3D waving t-shirt spinning 360° with realistic cloth physics.',
    },
    {
      icon: <Move className="w-4 h-4 text-sky-500" />,
      title: 'Direct Artwork Dragging',
      desc: 'Click and drag directly on any graphic on the 3D shirt surface to reposition it in real-time.',
    },
    {
      icon: <ZoomIn className="w-4 h-4 text-emerald-500" />,
      title: 'Scale & Resize',
      desc: 'Scroll your mouse wheel over the shirt or use the scale slider to size your artwork up or down.',
    },
    {
      icon: <Wind className="w-4 h-4 text-cyan-500" />,
      title: 'Realistic Waving Physics',
      desc: 'Click "Wind Breeze" or move your mouse rapidly to induce natural fabric wave flutters through the cloth.',
    },
    {
      icon: <Upload className="w-4 h-4 text-indigo-500" />,
      title: 'Drag & Drop Images',
      desc: 'Drop any PNG, JPEG, or SVG file anywhere onto the browser window to instantly place it on the active part.',
    },
    {
      icon: <Eye className="w-4 h-4 text-amber-500" />,
      title: 'Clean View / Shortcuts',
      desc: 'Press "H" on your keyboard to toggle the left design panel for a full-screen cinematic showcase.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#181724] p-6 shadow-2xl border border-black/10 dark:border-white/10 text-neutral-900 dark:text-white max-h-[90vh] overflow-y-auto no-scrollbar">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5 text-neutral-500" />
        </button>

        <h2 className="text-lg font-black mb-1">3D Studio Guide</h2>
        <p className="text-xs text-neutral-500 mb-5">
          Master the professional 3D apparel mockup & video studio
        </p>

        <div className="space-y-3 mb-6">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 rounded-2xl bg-black/5 dark:bg-white/5">
              <div className="p-2 rounded-xl bg-white dark:bg-neutral-800 shadow-xs shrink-0 mt-0.5">
                {item.icon}
              </div>
              <div>
                <div className="text-xs font-bold mb-0.5">{item.title}</div>
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-2xl text-xs font-bold text-neutral-800 dark:text-white bg-black/5 dark:bg-white/10 hover:bg-black/10 transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
};
