import React from 'react';
import { Volume2, VolumeX, RotateCcw, HelpCircle, Sun, Moon, Sunset } from 'lucide-react';
import { ShirtConfig, StudioTheme } from '../types';

interface HeaderProps {
  config: ShirtConfig;
  onThemeChange: (theme: StudioTheme) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onReset: () => void;
  onOpenHelp: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  onThemeChange,
  soundEnabled,
  onToggleSound,
  onReset,
  onOpenHelp,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-5 sm:px-8 py-4 pointer-events-none">
      {/* Brand Logo */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-purple-500/25 font-black text-sm">
            3D
          </div>
          <h1 className="text-lg sm:text-xl font-black tracking-tight select-none">
            <span className="text-neutral-900 dark:text-white">Tee</span>
            <span className="text-purple-600 dark:text-purple-400">Studio</span>
          </h1>
        </div>

        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-300 hidden sm:inline">
          Pro 3D Mockup
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
        {/* Environment Theme Selector */}
        <div className="flex items-center p-1 rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#181724]/80 shadow-xs backdrop-blur-md">
          <button
            onClick={() => onThemeChange('studio')}
            className={`p-1.5 rounded-xl transition-all ${
              config.theme === 'studio'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
            }`}
            title="Studio Ambient Theme"
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onThemeChange('pure-white')}
            className={`p-1.5 rounded-xl transition-all ${
              config.theme === 'pure-white'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
            }`}
            title="Pure White Seamless"
          >
            <span className="text-[10px] font-black px-0.5">W</span>
          </button>
          <button
            onClick={() => onThemeChange('dark-editorial')}
            className={`p-1.5 rounded-xl transition-all ${
              config.theme === 'dark-editorial'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
            }`}
            title="Dark Editorial Theme"
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onThemeChange('sunset')}
            className={`p-1.5 rounded-xl transition-all ${
              config.theme === 'sunset'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
            }`}
            title="Warm Sunset Theme"
          >
            <Sunset className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Audio Toggle */}
        <button
          onClick={onToggleSound}
          className="p-2 rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#181724]/80 text-neutral-700 dark:text-neutral-300 hover:bg-white transition-all shadow-xs"
          title={soundEnabled ? 'Mute' : 'Enable Audio'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-neutral-400" />}
        </button>

        {/* Reset */}
        <button
          onClick={onReset}
          className="p-2 rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#181724]/80 text-neutral-700 dark:text-neutral-300 hover:bg-white transition-all shadow-xs"
          title="Reset Garment"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Help */}
        <button
          onClick={onOpenHelp}
          className="p-2 rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#181724]/80 text-neutral-700 dark:text-neutral-300 hover:bg-white transition-all shadow-xs"
          title="Interactive Guide"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
