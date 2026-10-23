import React, { useState } from 'react';
import {
  Upload,
  RotateCcw,
  Sparkles,
  Type,
  Palette,
  Layers,
  ChevronLeft,
  ChevronRight,
  FlipHorizontal,
  Scissors,
  Check,
  Plus,
  Trash2,
  Sliders,
  Maximize2,
} from 'lucide-react';
import { ShirtConfig, TeePart, FabricType, BlendMode } from '../types';
import { COLOR_PRESETS, GRAPHIC_PRESETS } from '../utils/presets';
import { sound } from '../utils/audio';

interface SidebarProps {
  config: ShirtConfig;
  onConfigChange: (updates: Partial<ShirtConfig>) => void;
  onPartConfigChange: (part: TeePart, updates: Record<string, unknown>) => void;
  onDesignChange: (part: 'front' | 'back' | 'sleeveLeft' | 'sleeveRight', updates: Record<string, unknown>) => void;
  onFileUpload: (file: File) => void;
  onPartSelect: (part: TeePart) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  config,
  onConfigChange,
  onPartConfigChange,
  onDesignChange,
  onFileUpload,
  onPartSelect,
  isCollapsed,
  onToggleCollapse,
}) => {
  const [subTab, setSubTab] = useState<'upload' | 'text' | 'presets'>('upload');

  const activePart = config.activePart;
  const isAll = activePart === 'all';
  const currentPartKey = isAll ? 'front' : (activePart === 'collar' ? 'front' : activePart);
  const currentPartConfig = config.parts[currentPartKey];
  const currentDesign = currentPartConfig?.design;
  const currentText = currentPartConfig?.text;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  const handlePresetSelect = (presetId: string) => {
    const preset = GRAPHIC_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    sound.playClick();
    const canvas = preset.generate();
    const targetPart = isAll ? 'front' : (activePart === 'collar' ? 'front' : activePart);
    onDesignChange(targetPart, {
      img: canvas,
      name: preset.name,
      w: 380,
      h: 380,
      sc: 1.0,
      rot: 0,
      opacity: 0.96,
      blendMode: 'source-over' as BlendMode,
    });
  };

  // Color selection
  const handleColorSelect = (hex: string) => {
    sound.playClick();
    if (isAll) {
      onConfigChange({
        parts: {
          front: { ...config.parts.front, color: hex },
          back: { ...config.parts.back, color: hex },
          collar: { color: hex },
          sleeveLeft: { ...config.parts.sleeveLeft, color: hex },
          sleeveRight: { ...config.parts.sleeveRight, color: hex },
        },
      });
    } else if (activePart === 'collar') {
      onConfigChange({
        parts: {
          ...config.parts,
          collar: { color: hex },
        },
      });
    } else {
      onPartConfigChange(activePart, { color: hex });
    }
  };

  const partsList: { id: TeePart; label: string }[] = [
    { id: 'front', label: 'Front' },
    { id: 'back', label: 'Back' },
    { id: 'collar', label: 'Collar' },
    { id: 'sleeveLeft', label: 'Left Sleeve' },
    { id: 'sleeveRight', label: 'Right Sleeve' },
    { id: 'all', label: 'All Parts' },
  ];

  return (
    <aside className="fixed left-4 top-20 bottom-6 z-30 flex items-start pointer-events-none transition-all duration-300">
      {/* COLLAPSED BAR */}
      {isCollapsed ? (
        <div className="pointer-events-auto flex flex-col items-center gap-2.5 p-2 rounded-2xl bg-white/90 dark:bg-[#1a1926]/90 border border-black/10 dark:border-white/10 shadow-xl backdrop-blur-xl">
          <button
            onClick={onToggleCollapse}
            className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 transition-all hover:scale-105 active:scale-95"
            title="Open Design Panel"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <label
            tabIndex={0}
            className="p-2.5 rounded-xl bg-purple-600 text-white cursor-pointer transition-all hover:scale-110 active:scale-95 shadow-md shadow-purple-500/30"
            title="Upload Design"
          >
            <Upload className="w-4 h-4" />
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </label>
        </div>
      ) : (
        /* EXPANDED MODERN DESIGN PANEL (Pacdora/CLO Inspired) */
        <div className="pointer-events-auto w-[330px] sm:w-[350px] max-w-[calc(100vw-32px)] max-h-[calc(100vh-110px)] flex flex-col rounded-3xl bg-white dark:bg-[#181724] border border-black/10 dark:border-white/10 shadow-2xl p-4.5 overflow-hidden backdrop-blur-xl">
          {/* Header & Collapse */}
          <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10">
            <div>
              <h2 className="text-base font-extrabold text-neutral-900 dark:text-white">
                Customize 3D Tee
              </h2>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Independent part editing & artwork placement
              </p>
            </div>
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-neutral-500 transition-colors"
              title="Collapse Panel"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          {/* Part Selection Pills */}
          <div className="py-2.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1.5">
              Select Garment Part
            </div>
            <div className="flex flex-wrap gap-1">
              {partsList.map((part) => {
                const isSelected = activePart === part.id;
                return (
                  <button
                    key={part.id}
                    onClick={() => {
                      sound.playFlip();
                      onPartSelect(part.id);
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/30'
                        : 'bg-black/5 dark:bg-white/5 text-neutral-600 dark:text-neutral-300 hover:bg-black/10 dark:hover:bg-white/10'
                    }`}
                  >
                    {part.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scrollable Customization Content */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-4 no-scrollbar">
            {/* SUB-TABS: Upload | Presets | Typography */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-black/5 dark:bg-white/5 text-xs font-bold">
              <button
                onClick={() => setSubTab('upload')}
                className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  subTab === 'upload'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload</span>
              </button>
              <button
                onClick={() => setSubTab('presets')}
                className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  subTab === 'presets'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                <span>Presets</span>
              </button>
              <button
                onClick={() => setSubTab('text')}
                className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  subTab === 'text'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                <Type className="w-3.5 h-3.5 text-sky-500" />
                <span>Text</span>
              </button>
            </div>

            {/* TAB 1: UPLOAD DESIGN CARD (Exact Match to User Reference Image) */}
            {subTab === 'upload' && (
              <div className="space-y-3">
                <div className="rounded-2xl border-2 border-dashed border-purple-400 dark:border-purple-500/60 bg-purple-50/50 dark:bg-purple-950/20 p-5 flex flex-col items-center justify-center text-center transition-all hover:bg-purple-50 dark:hover:bg-purple-950/30">
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-3 shadow-inner">
                    <Layers className="w-6 h-6 stroke-[1.8]" />
                  </div>

                  <label
                    tabIndex={0}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-purple-600 hover:bg-purple-700 active:scale-95 cursor-pointer shadow-md shadow-purple-500/30 transition-all mb-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload</span>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>

                  <span className="text-[11px] font-semibold text-purple-500/90 dark:text-purple-400">
                    287 × 445 px print area
                  </span>
                </div>

                {/* Transform Controls for active artwork */}
                {currentDesign?.img && (
                  <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-1">
                        <Sliders className="w-3.5 h-3.5 text-purple-500" />
                        Artwork Transform
                      </span>
                      <button
                        onClick={() => {
                          const targetPart = isAll ? 'front' : (activePart === 'collar' ? 'front' : activePart);
                          onDesignChange(targetPart, { img: null });
                        }}
                        className="text-[10px] font-bold text-rose-500 hover:underline flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-neutral-500">
                        <span>Scale</span>
                        <span className="font-mono">{Math.round((currentDesign.sc || 1) * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="30"
                        max="220"
                        value={Math.round((currentDesign.sc || 1) * 100)}
                        onChange={(e) => {
                          const targetPart = isAll ? 'front' : (activePart === 'collar' ? 'front' : activePart);
                          onDesignChange(targetPart, { sc: Number(e.target.value) / 100 });
                        }}
                        className="w-full accent-purple-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-neutral-500">
                        <span>Rotation</span>
                        <span className="font-mono">{Math.round(((currentDesign.rot || 0) * 180) / Math.PI)}°</span>
                      </div>
                      <input
                        type="range"
                        min="-180"
                        max="180"
                        value={Math.round(((currentDesign.rot || 0) * 180) / Math.PI)}
                        onChange={(e) => {
                          const targetPart = isAll ? 'front' : (activePart === 'collar' ? 'front' : activePart);
                          onDesignChange(targetPart, { rot: (Number(e.target.value) * Math.PI) / 180 });
                        }}
                        className="w-full accent-purple-600"
                      />
                    </div>

                    <div className="flex gap-1.5 pt-1">
                      <button
                        onClick={() => {
                          const targetPart = isAll ? 'front' : (activePart === 'collar' ? 'front' : activePart);
                          onDesignChange(targetPart, { rot: 0 });
                        }}
                        className="flex-1 py-1 rounded bg-white dark:bg-neutral-800 text-[10px] font-bold shadow-xs flex items-center justify-center gap-1"
                      >
                        <RotateCcw className="w-2.5 h-2.5" /> 0°
                      </button>
                      <button
                        onClick={() => {
                          const targetPart = isAll ? 'front' : (activePart === 'collar' ? 'front' : activePart);
                          onDesignChange(targetPart, { flipX: !currentDesign.flipX });
                        }}
                        className="flex-1 py-1 rounded bg-white dark:bg-neutral-800 text-[10px] font-bold shadow-xs flex items-center justify-center gap-1"
                      >
                        <FlipHorizontal className="w-2.5 h-2.5" /> Flip
                      </button>
                      <button
                        onClick={() => {
                          const targetPart = isAll ? 'front' : (activePart === 'collar' ? 'front' : activePart);
                          onDesignChange(targetPart, { x: 512, y: 530 });
                        }}
                        className="flex-1 py-1 rounded bg-white dark:bg-neutral-800 text-[10px] font-bold shadow-xs"
                      >
                        Center
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: PRESETS GALLERY */}
            {subTab === 'presets' && (
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-neutral-500">Curated Graphics</div>
                <div className="grid grid-cols-2 gap-2">
                  {GRAPHIC_PRESETS.map((p) => {
                    const isActive = currentDesign?.name === p.name;
                    return (
                      <button
                        key={p.id}
                        onClick={() => handlePresetSelect(p.id)}
                        className={`p-2.5 rounded-2xl text-left border text-xs font-bold transition-all ${
                          isActive
                            ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500/20'
                            : 'border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:border-black/20 text-current'
                        }`}
                      >
                        <div className="truncate font-extrabold">{p.name}</div>
                        <div className="text-[10px] opacity-60 font-medium">{p.category}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: TEXT STUDIO */}
            {subTab === 'text' && (
              <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                  <input
                    type="checkbox"
                    checked={currentText?.enabled || false}
                    onChange={(e) => {
                      const targetPart = isAll ? 'front' : (activePart === 'collar' ? 'front' : activePart);
                      onPartConfigChange(targetPart, {
                        text: { ...currentText, enabled: e.target.checked },
                      });
                    }}
                    className="w-4 h-4 rounded accent-purple-600"
                  />
                  <span>Enable Slogan / Typography</span>
                </label>

                {currentText?.enabled && (
                  <div className="space-y-2.5 pt-1">
                    <input
                      type="text"
                      value={currentText.text}
                      onChange={(e) => {
                        const targetPart = isAll ? 'front' : (activePart === 'collar' ? 'front' : activePart);
                        onPartConfigChange(targetPart, {
                          text: { ...currentText, text: e.target.value },
                        });
                      }}
                      placeholder="e.g. STUDIO PARIS"
                      className="w-full px-3 py-1.5 rounded-xl text-xs font-semibold border bg-white dark:bg-neutral-800 border-black/10 dark:border-white/10 outline-none"
                    />

                    <select
                      value={currentText.font}
                      onChange={(e) => {
                        const targetPart = isAll ? 'front' : (activePart === 'collar' ? 'front' : activePart);
                        onPartConfigChange(targetPart, {
                          text: { ...currentText, font: e.target.value },
                        });
                      }}
                      className="w-full px-3 py-1.5 rounded-xl text-xs font-semibold border bg-white dark:bg-neutral-800 border-black/10 dark:border-white/10 outline-none"
                    >
                      <option value="Syne">Syne (Modern Heavy)</option>
                      <option value="Space Grotesk">Space Grotesk (Tech)</option>
                      <option value="Bebas Neue">Bebas Neue (Athletic)</option>
                      <option value="Playfair Display">Playfair (Serif)</option>
                    </select>

                    <div className="flex gap-1.5">
                      <button
                        onClick={() => {
                          const targetPart = isAll ? 'front' : (activePart === 'collar' ? 'front' : activePart);
                          onPartConfigChange(targetPart, {
                            text: { ...currentText, curved: false },
                          });
                        }}
                        className={`flex-1 py-1 rounded-lg text-xs font-bold ${
                          !currentText.curved
                            ? 'bg-purple-600 text-white'
                            : 'bg-white dark:bg-neutral-800'
                        }`}
                      >
                        Straight
                      </button>
                      <button
                        onClick={() => {
                          const targetPart = isAll ? 'front' : (activePart === 'collar' ? 'front' : activePart);
                          onPartConfigChange(targetPart, {
                            text: { ...currentText, curved: true },
                          });
                        }}
                        className={`flex-1 py-1 rounded-lg text-xs font-bold ${
                          currentText.curved
                            ? 'bg-purple-600 text-white'
                            : 'bg-white dark:bg-neutral-800'
                        }`}
                      >
                        Arc Curved
                      </button>
                      <input
                        type="color"
                        value={currentText.color}
                        onChange={(e) => {
                          const targetPart = isAll ? 'front' : (activePart === 'collar' ? 'front' : activePart);
                          onPartConfigChange(targetPart, {
                            text: { ...currentText, color: e.target.value },
                          });
                        }}
                        className="w-8 h-7 rounded-lg cursor-pointer border-0 p-0"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* COLOR PALETTE (Exact Match to User Reference Image) */}
            <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-neutral-700 dark:text-neutral-200">Color</span>
                <span className="text-[11px] font-mono text-neutral-400">
                  {currentPartConfig?.color || config.parts.front.color}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Custom Color Plus Button */}
                <label
                  className="w-7 h-7 rounded-full border border-purple-500/40 bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-purple-600 dark:text-purple-400 cursor-pointer hover:scale-110 active:scale-95 transition-all shadow-xs"
                  title="Custom Color"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <input
                    type="color"
                    value={currentPartConfig?.color || config.parts.front.color}
                    onChange={(e) => handleColorSelect(e.target.value)}
                    className="hidden"
                  />
                </label>

                {/* Swatches matching Pacdora reference */}
                {[
                  '#ffffff',
                  '#e9d5ff',
                  '#9ca3af',
                  '#18181b',
                  '#dc2626',
                  '#2563eb',
                  '#fef08a',
                  '#10b981',
                  '#d97706',
                ].map((hex) => {
                  const isSelected =
                    (currentPartConfig?.color || config.parts.front.color).toLowerCase() ===
                    hex.toLowerCase();
                  return (
                    <button
                      key={hex}
                      onClick={() => handleColorSelect(hex)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        isSelected
                          ? 'border-purple-600 scale-125 shadow-md ring-2 ring-purple-500/30'
                          : 'border-black/10 dark:border-white/20 hover:scale-110'
                      }`}
                      style={{ backgroundColor: hex }}
                      aria-label={hex}
                    />
                  );
                })}
              </div>
            </div>

            {/* CUSTOM MATERIAL SECTION (Matches User Reference Image) */}
            <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 space-y-2">
              <div className="text-xs font-bold text-neutral-700 dark:text-neutral-200">
                Custom Material
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'cotton', label: 'Cotton base' },
                  { id: 'heavy', label: 'Heavyweight raw' },
                  { id: 'washed', label: 'Vintage washed' },
                  { id: 'smooth', label: 'Fine knit' },
                ].map((mat) => {
                  const isSelected = config.fabric === mat.id;
                  return (
                    <button
                      key={mat.id}
                      onClick={() => onConfigChange({ fabric: mat.id as FabricType })}
                      className={`p-2 rounded-xl text-left border text-xs font-bold transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300'
                          : 'border-black/5 dark:border-white/10 bg-white/60 dark:bg-neutral-800/60 hover:bg-white text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      <span className="truncate">{mat.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
