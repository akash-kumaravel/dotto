import React from 'react';
import {
  Wand2,
  Box,
  Video,
} from 'lucide-react';

export type StudioTab = 'edit' | 'models' | 'video';

interface StudioNavRailProps {
  activeTab: StudioTab;
  onTabChange: (tab: StudioTab) => void;
}

export const StudioNavRail: React.FC<StudioNavRailProps> = ({
  activeTab,
  onTabChange,
}) => {
  const navItems: { id: StudioTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'edit', label: 'Edit', icon: Wand2 },
    { id: 'models', label: 'Models', icon: Box },
    { id: 'video', label: 'Video', icon: Video },
  ];

  return (
    <nav className="fixed left-0 top-0 bottom-0 z-30 w-[72px] sm:w-[76px] bg-white border-r border-[#e5e5ea] flex flex-col items-center py-4 select-none shadow-xs">
      {/* Top Logo / Pro Icon */}
      <div className="mb-4">
        <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-purple-500/25">
          👕
        </div>
      </div>

      {/* Main Nav Items */}
      <div className="flex-1 flex flex-col items-center gap-1.5 w-full px-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full py-2.5 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
                isActive
                  ? 'bg-purple-50 text-purple-600 font-bold'
                  : 'text-[#64646e] hover:text-[#18181b] hover:bg-gray-100/70 font-medium'
              }`}
              title={item.label}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-purple-600' : 'text-[#64646e]'}`} />
              <span className="text-[10px] leading-tight tracking-tight text-center truncate max-w-full">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
