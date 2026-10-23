import React from 'react';
import { MessageSquareText } from 'lucide-react';
import { sound } from '../utils/audio';

interface HelpBubbleProps {
  onClick: () => void;
}

export const HelpBubble: React.FC<HelpBubbleProps> = ({ onClick }) => {
  return (
    <button
      onClick={() => {
        sound.playClick();
        onClick();
      }}
      className="fixed bottom-5 right-5 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#181724] text-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all select-none cursor-pointer group"
      title="Tips & Studio Guide"
    >
      <MessageSquareText className="w-5 h-5 text-white/90 group-hover:text-white transition-colors" />
    </button>
  );
};
