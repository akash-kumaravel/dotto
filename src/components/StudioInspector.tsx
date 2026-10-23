import React, { useState } from 'react';
import {
  Upload,
  Layers,
  Plus,
  ChevronRight,
  ChevronLeft,
  Sliders,
  RotateCcw,
  FlipHorizontal,
  Trash2,
  Type,
  Sparkles,
  Wind,
  Check,
  Video,
  X,
} from 'lucide-react';
import { ShirtConfig, TeePart, FabricType, BlendMode } from '../types';
import { GRAPHIC_PRESETS } from '../utils/presets';
import { sound } from '../utils/audio';
import { StudioTab } from './StudioNavRail';

interface StudioInspectorProps {
  activeTab: StudioTab;
  config: ShirtConfig;
  onConfigChange: (updates: Partial<ShirtConfig>) => void;
  onBackdropAssetUpload: (file: File, kind: 'image' | 'pattern') => void;
  onPartConfigChange: (part: TeePart, updates: Record<string, unknown>) => void;
  onDesignChange: (part: 'front' | 'back' | 'sleeveLeft' | 'sleeveRight', updates: Record<string, unknown>) => void;
  onFileUpload: (file: File) => void;
  onPartSelect: (part: TeePart) => void;
  onStartVideoRecord: (durationSeconds: number, transparentBackground: boolean) => void;
  isRecordingVideo: boolean;
  recordingProgress: number;
  onTriggerGust: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const StudioInspector: React.FC<StudioInspectorProps> = ({
  activeTab,
  config,
  onConfigChange,
  onBackdropAssetUpload,
  onPartConfigChange,
  onDesignChange,
  onFileUpload,
  onPartSelect,
  onStartVideoRecord,
  isRecordingVideo,
  recordingProgress,
  onTriggerGust,
  isOpen = true,
  onClose,
}) => {
  const [isMaterialOpen, setIsMaterialOpen] = useState<boolean>(false);
  const [isPartsOpen, setIsPartsOpen] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<'upload' | 'presets' | 'text'>('upload');
  const [backgroundMode, setBackgroundMode] = useState<'color' | 'image' | 'pattern'>(() =>
    config.backdropImage ? 'image' : config.backdropPattern ? 'pattern' : 'color'
  );
  const [videoDuration, setVideoDuration] = useState<number>(4);
  const [transparentVideoBackground, setTransparentVideoBackground] = useState<boolean>(false);

  const activePart = config.activePart;
  const isAll = activePart === 'all';
  const currentPartKey = isAll ? 'front' : (activePart === 'collar' ? 'front' : activePart);
  const currentPartConfig = config.parts[currentPartKey];
  const currentDesign = currentPartConfig?.design;
  const currentText = currentPartConfig?.text;
  const designItems = ([
    ['front', 'Front'],
    ['back', 'Back'],
    ['sleeveLeft', 'Left sleeve'],
    ['sleeveRight', 'Right sleeve'],
  ] as const).flatMap(([part, label]) => {
    const design = config.parts[part].design;
    return design.img ? [{ part, label, design }] : [];
  });

  const getDesignPreview = (image: HTMLImageElement | HTMLCanvasElement) =>
    'src' in image ? image.src : image.toDataURL();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

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

  const currentColor =
    activePart === 'collar'
      ? config.parts.collar.color
      : (currentPartConfig?.color || config.parts.front.color);

  const partsList: { id: TeePart; label: string }[] = [
    { id: 'front', label: 'Front' },
    { id: 'back', label: 'Back' },
    { id: 'collar', label: 'Collar' },
    { id: 'sleeveLeft', label: 'Left Sleeve' },
    { id: 'sleeveRight', label: 'Right Sleeve' },
    { id: 'all', label: 'All 5 Parts' },
  ];

  const fabricsList: { id: FabricType; label: string }[] = [
    { id: 'cotton', label: 'Cotton base' },
    { id: 'heavy', label: 'Heavyweight raw' },
    { id: 'washed', label: 'Vintage washed' },
    { id: 'smooth', label: 'Fine knit' },
  ];

  const currentFabricLabel =
    fabricsList.find((f) => f.id === config.fabric)?.label || 'Cotton base';

  const currentPartLabel =
    activePart === 'all'
      ? 'All 5 Parts'
      : partsList.find((p) => p.id === activePart)?.label || 'Front';

  // Swatches matching reference image
  const colorSwatches = [
    '#7c3aed', // purple
    '#9ca3af', // silver grey
    '#18181b', // charcoal / black
    '#dc2626', // deep red
    '#e9d5ff', // lavender
    '#fbcfe8', // soft pale pink
    '#ffffff', // crisp white
    '#1e293b', // midnight navy
  ];

  return (
    <aside
      className={`fixed left-[78px] sm:left-[86px] top-4 bottom-4 z-20 w-[330px] sm:w-[350px] max-w-[calc(100vw-96px)] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col p-4.5 overflow-hidden select-none transition-all duration-300 ease-out ${
        isOpen
          ? 'translate-x-0 opacity-100 pointer-events-auto'
          : '-translate-x-[115%] opacity-0 pointer-events-none'
      }`}
    >
      {/* Side Dock Collapse Button */}
      {onClose && (
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-white border border-gray-200/90 shadow-md rounded-r-xl items-center justify-center text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-all z-30 cursor-pointer"
          title="Collapse Panel"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      )}

      {/* TAB: EDIT (Default - Exact match to user screenshot) */}
      {activeTab === 'edit' && (
        <div className="flex-1 flex flex-col overflow-y-auto pr-1 no-scrollbar space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">
              Upload images
            </h2>
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg text-[11px] font-bold">
                <button
                  onClick={() => setEditMode('upload')}
                  className={`px-2 py-0.5 rounded-md transition-all ${
                    editMode === 'upload' ? 'bg-white shadow-xs text-purple-600' : 'text-gray-500'
                  }`}
                >
                  Upload
                </button>
                <button
                  onClick={() => setEditMode('presets')}
                  className={`px-2 py-0.5 rounded-md transition-all ${
                    editMode === 'presets' ? 'bg-white shadow-xs text-purple-600' : 'text-gray-500'
                  }`}
                >
                  Presets
                </button>
                <button
                  onClick={() => setEditMode('text')}
                  className={`px-2 py-0.5 rounded-md transition-all ${
                    editMode === 'text' ? 'bg-white shadow-xs text-purple-600' : 'text-gray-500'
                  }`}
                >
                  Text
                </button>
              </div>
              {onClose && (
                <button
                  onClick={() => {
                    sound.playClick();
                    onClose();
                  }}
                  className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-all"
                  title="Collapse panel"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* MAIN UPLOAD CARD (Exact Pacdora style dashed purple card) */}
          {editMode === 'upload' && (
            <div className="border-2 border-dashed border-purple-300 bg-gradient-to-b from-purple-50 to-white rounded-2xl p-5 flex flex-col items-center justify-center text-center relative transition-all hover:border-purple-400 hover:from-purple-100/70">
              {/* Image Icon */}
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-purple-600 mb-2">
                <Layers className="w-8 h-8 stroke-[1.6]" />
              </div>

              {/* Upload Purple Button */}
              <label
                tabIndex={0}
                className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-purple-600 hover:bg-purple-700 active:scale-95 cursor-pointer shadow-md shadow-purple-500/20 transition-all mb-2"
              >
                <Upload className="w-4 h-4" />
                <span>Upload</span>
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>

              {/* Resolution Info */}
              <span className="text-xs font-semibold text-[#8b5cf6]">
                317 x 448 px
              </span>
            </div>
          )}

          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-gray-900">Your designs</h3>
                <p className="mt-0.5 text-[10px] text-gray-500">Artwork placed on your garment</p>
              </div>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">
                {designItems.length}
              </span>
            </div>
            {designItems.length ? (
              <div className="grid grid-cols-2 gap-2">
                {designItems.map(({ part, label, design }) => (
                  <div
                    key={part}
                    className={`relative flex min-w-0 items-center gap-2 rounded-xl border p-2 pr-8 text-left transition-all ${
                      activePart === part
                        ? 'border-purple-300 bg-purple-50 ring-1 ring-purple-200'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onPartSelect(part)}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      title={`Select ${design.name || label} on ${label}`}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                        <img
                          src={getDesignPreview(design.img!)}
                          alt={design.name || 'Uploaded design'}
                          className="h-full w-full object-contain"
                        />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[11px] font-bold text-gray-800">
                          {design.name || 'Untitled design'}
                        </span>
                        <span className="mt-0.5 block text-[10px] text-gray-500">{label}</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-label={`Remove ${design.name || 'design'} from ${label}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        onDesignChange(part, { img: null, name: '' });
                      }}
                      className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-rose-100 hover:text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-300"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/70 px-3 py-3 text-center text-[10px] text-gray-400">
                Uploaded artwork will appear here
              </div>
            )}
          </section>

          {/* PRESETS GALLERY */}
          {editMode === 'presets' && (
            <div className="p-3 bg-[#f8f5ff] border border-purple-200 rounded-2xl space-y-2">
              <div className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Curated Vector Graphics
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {GRAPHIC_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      sound.playClick();
                      const canvas = p.generate();
                      const targetPart = isAll ? 'front' : (activePart === 'collar' ? 'front' : activePart);
                      onDesignChange(targetPart, {
                        img: canvas,
                        name: p.name,
                        w: 380,
                        h: 380,
                        sc: 1.0,
                        rot: 0,
                      });
                    }}
                    className="p-2 rounded-xl text-left bg-white border border-purple-100 hover:border-purple-400 text-xs font-bold shadow-2xs transition-all"
                  >
                    <div className="truncate text-gray-900">{p.name}</div>
                    <div className="text-[10px] text-gray-400 font-medium">{p.category}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TEXT / SLOGAN STUDIO */}
          {editMode === 'text' && (
            <div className="p-3.5 bg-gray-50 border border-gray-100 rounded-2xl space-y-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-800">
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
                <span>Enable Typography Slogan</span>
              </label>

              {currentText?.enabled && (
                <div className="space-y-2 pt-1">
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
                    className="w-full px-3 py-1.5 rounded-xl text-xs font-semibold border border-gray-200 bg-white outline-none"
                  />

                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        const targetPart = isAll ? 'front' : (activePart === 'collar' ? 'front' : activePart);
                        onPartConfigChange(targetPart, {
                          text: { ...currentText, curved: false },
                        });
                      }}
                      className={`flex-1 py-1 rounded-lg text-xs font-bold ${
                        !currentText.curved ? 'bg-purple-600 text-white' : 'bg-white border text-gray-700'
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
                        currentText.curved ? 'bg-purple-600 text-white' : 'bg-white border text-gray-700'
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

          {/* COLOR SECTION (Matches reference image with + button and swatches) */}
          <div className="bg-[#f9f9fb] border border-gray-100 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-medium text-gray-500">
              <span>Color</span>
              <span className="font-mono text-[11px] text-gray-400 uppercase">{currentColor}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Plus button with color picker input */}
              <label
                className="w-7 h-7 rounded-full border border-gray-300 bg-white flex items-center justify-center cursor-pointer shadow-xs hover:scale-105 active:scale-95 transition-all"
                title="Custom Color"
              >
                <Plus className="w-3.5 h-3.5 text-gray-600" />
                <input
                  type="color"
                  value={currentColor}
                  onChange={(e) => handleColorSelect(e.target.value)}
                  className="hidden"
                />
              </label>

              {/* Predefined circle swatches */}
              {colorSwatches.map((hex) => {
                const isSelected = currentColor.toLowerCase() === hex.toLowerCase();
                return (
                  <button
                    key={hex}
                    onClick={() => handleColorSelect(hex)}
                    className={`w-7 h-7 rounded-full border transition-all ${
                      isSelected
                        ? 'border-purple-600 scale-110 shadow-sm ring-2 ring-purple-500/30'
                        : 'border-black/10 hover:scale-105'
                    }`}
                    style={{ backgroundColor: hex }}
                    aria-label={hex}
                  />
                );
              })}
            </div>
          </div>

          {/* CUSTOM MATERIAL CARD (Matches reference image "Custom material > Cotton base") */}
          <div className="bg-[#f9f9fb] border border-gray-100 rounded-2xl p-3.5 transition-all">
            <button
              onClick={() => setIsMaterialOpen(!isMaterialOpen)}
              className="w-full flex items-center justify-between text-left"
            >
              <div>
                <div className="text-[11px] text-gray-400 font-medium">Custom material</div>
                <div className="text-xs font-bold text-gray-800">{currentFabricLabel}</div>
              </div>
              <ChevronRight
                className={`w-4 h-4 text-gray-400 transition-transform ${isMaterialOpen ? 'rotate-90' : ''}`}
              />
            </button>

            {isMaterialOpen && (
              <div className="grid grid-cols-2 gap-1.5 pt-3 border-t border-gray-200/60 mt-2.5">
                {fabricsList.map((m) => {
                  const isSelected = config.fabric === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        sound.playClick();
                        onConfigChange({ fabric: m.id });
                      }}
                      className={`p-2 rounded-xl text-left border text-xs font-bold transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-purple-600 bg-purple-50 text-purple-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="truncate">{m.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-purple-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* CUSTOM PART CARD (Matches reference image "Custom part > 5 Parts") */}
          <div className="bg-[#f9f9fb] border border-gray-100 rounded-2xl p-3.5 transition-all">
            <button
              onClick={() => setIsPartsOpen(!isPartsOpen)}
              className="w-full flex items-center justify-between text-left"
            >
              <div>
                <div className="text-[11px] text-gray-400 font-medium">Custom part</div>
                <div className="text-xs font-bold text-gray-800">
                  {currentPartLabel} <span className="text-purple-600 font-normal">({partsList.length - 1} Parts)</span>
                </div>
              </div>
              <ChevronRight
                className={`w-4 h-4 text-gray-400 transition-transform ${isPartsOpen ? 'rotate-90' : ''}`}
              />
            </button>

            {isPartsOpen && (
              <div className="grid grid-cols-2 gap-1.5 pt-3 border-t border-gray-200/60 mt-2.5">
                {partsList.map((p) => {
                  const isSelected = activePart === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        sound.playFlip();
                        onPartSelect(p.id);
                      }}
                      className={`p-2 rounded-xl text-left border text-xs font-bold transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-purple-600 bg-purple-600 text-white shadow-xs'
                          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="truncate">{p.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ARTWORK TRANSFORM CONTROLS (Active when design exists) */}
          {currentDesign?.img && (
            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5 text-gray-800">
                  <Sliders className="w-3.5 h-3.5 text-purple-600" />
                  Adjust Design Placement
                </span>
                <button
                  onClick={() => {
                    const targetPart = isAll ? 'front' : (activePart === 'collar' ? 'front' : activePart);
                    onDesignChange(targetPart, { img: null });
                  }}
                  className="text-[11px] font-bold text-rose-500 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Remove
                </button>
              </div>

              {/* Scale Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-gray-500 font-medium">
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
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>

              {/* Rotation Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-gray-500 font-medium">
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
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>

              {/* Quick Actions */}
              <div className="flex gap-1.5 pt-1">
                <button
                  onClick={() => {
                    const targetPart = isAll ? 'front' : (activePart === 'collar' ? 'front' : activePart);
                    onDesignChange(targetPart, { rot: 0 });
                  }}
                  className="flex-1 py-1 rounded-lg bg-white border border-gray-200 text-[10px] font-bold text-gray-700 shadow-2xs flex items-center justify-center gap-1"
                >
                  <RotateCcw className="w-2.5 h-2.5" /> 0°
                </button>
                <button
                  onClick={() => {
                    const targetPart = isAll ? 'front' : (activePart === 'collar' ? 'front' : activePart);
                    onDesignChange(targetPart, { flipX: !currentDesign.flipX });
                  }}
                  className="flex-1 py-1 rounded-lg bg-white border border-gray-200 text-[10px] font-bold text-gray-700 shadow-2xs flex items-center justify-center gap-1"
                >
                  <FlipHorizontal className="w-2.5 h-2.5" /> Flip
                </button>
                <button
                  onClick={() => {
                    const targetPart = isAll ? 'front' : (activePart === 'collar' ? 'front' : activePart);
                    onDesignChange(targetPart, { x: 512, y: 530 });
                  }}
                  className="flex-1 py-1 rounded-lg bg-white border border-gray-200 text-[10px] font-bold text-gray-700 shadow-2xs"
                >
                  Center
                </button>
              </div>
            </div>
          )}

          <section className="rounded-2xl border border-gray-200 bg-gray-50/70 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-gray-900">Background</h3>
                <p className="mt-0.5 text-[10px] text-gray-500">Customize your studio backdrop</p>
              </div>
              <span
                className="h-7 w-7 rounded-lg border border-black/10 shadow-inner"
                style={{
                  backgroundColor: config.backdropColor,
                  backgroundImage: config.backdropImage ? `url("${config.backdropImage}")` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
                aria-hidden="true"
              />
            </div>
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-gray-200/70 p-1">
              {([
                ['color', 'Color'],
                ['image', 'Image'],
                ['pattern', 'Pattern'],
              ] as const).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    setBackgroundMode(mode);
                    if (mode === 'color') {
                      onConfigChange({ theme: 'custom', backdropImage: null, backdropPattern: null });
                    } else if (mode === 'image') {
                      onConfigChange({ theme: 'custom', backdropPattern: null });
                    } else {
                      onConfigChange({ theme: 'custom', backdropImage: null });
                    }
                  }}
                  className={`rounded-lg px-2 py-1.5 text-[11px] font-bold transition-all ${
                    backgroundMode === mode
                      ? 'bg-white text-purple-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {backgroundMode === 'color' ? (
              <label className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700">
                <span>Studio color</span>
                <input
                  type="color"
                  value={config.backdropColor}
                  onChange={(event) =>
                    onConfigChange({
                      theme: 'custom',
                      backdropColor: event.target.value,
                      backdropImage: null,
                      backdropPattern: null,
                    })
                  }
                  className="h-7 w-9 cursor-pointer rounded-md border-0 bg-transparent p-0"
                  aria-label="Choose background color"
                />
              </label>
            ) : (
              <div className="space-y-2">
                <p className="text-[10px] leading-relaxed text-gray-500">
                  {backgroundMode === 'image'
                    ? 'Use a photo or image as the studio backdrop.'
                    : 'Repeat a logo or image across the studio backdrop.'}
                </p>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-purple-300 bg-white px-3 py-2.5 text-[11px] font-bold text-purple-700 transition-colors hover:bg-purple-50">
                  <Upload className="h-3.5 w-3.5" />
                  {backgroundMode === 'image' ? 'Choose background image' : 'Choose logo pattern'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) onBackdropAssetUpload(file, backgroundMode);
                      event.target.value = '';
                    }}
                  />
                </label>
                {(backgroundMode === 'image' ? config.backdropImage : config.backdropPattern) && (
                  <button
                    type="button"
                    onClick={() =>
                      onConfigChange(
                        backgroundMode === 'image'
                          ? { backdropImage: null }
                          : { backdropPattern: null }
                      )
                    }
                    className="w-full rounded-lg py-1.5 text-[10px] font-semibold text-gray-500 hover:bg-white hover:text-gray-800"
                  >
                    Remove {backgroundMode === 'image' ? 'image' : 'pattern'}
                  </button>
                )}
              </div>
            )}
          </section>
        </div>
      )}

      {/* TAB: MODELS & FIT */}
      {activeTab === 'models' && (
        <div className="flex-1 flex flex-col overflow-y-auto pr-1 no-scrollbar space-y-4">
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">Garment Models</h2>
          <div className="space-y-2">
            {[
              { id: 'oversized', title: 'Heavyweight Boxy Tee', desc: 'Drop-shoulder street cut, 280 GSM' },
              { id: 'regular', title: 'Regular Fit Crewneck', desc: 'Classic everyday silhouette, 200 GSM' },
              { id: 'relaxed', title: 'Relaxed Vintage Wash', desc: 'Pre-shrunk vintage wash drape' },
            ].map((model, idx) => (
              <div
                key={model.id}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  idx === 0
                    ? 'border-purple-600 bg-purple-50 text-purple-900'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <div className="text-xs font-bold">{model.title}</div>
                <div className="text-[11px] text-gray-500 font-medium">{model.desc}</div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-gray-100 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-gray-700">
              <span className="flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5 text-sky-500" /> Cloth Wave Flutter
              </span>
              <button
                onClick={onTriggerGust}
                className="px-2 py-1 rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100 text-[10px] font-bold"
              >
                Trigger Gust
              </button>
            </div>
            <input
              type="range"
              min="0"
              max="150"
              value={Math.round(config.windIntensity * 100)}
              onChange={(e) => onConfigChange({ windIntensity: Number(e.target.value) / 100 })}
              className="w-full accent-sky-500 cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* TAB: VIDEO TURNTABLE EXPORT */}
      {activeTab === 'video' && (
        <div className="flex-1 flex flex-col overflow-y-auto pr-1 no-scrollbar space-y-4">
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">Save 3D Video</h2>
          <p className="text-xs text-gray-500">
            Record a smooth 60 FPS turntable video in 1080p HD. Background image, color, and logo pattern are included unless transparency is enabled.
          </p>

          <div className="space-y-2">
            <div className="text-xs font-bold text-gray-700">Spin Duration:</div>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { sec: 3, label: '3s Loop' },
                { sec: 5, label: '5s Spin' },
                { sec: 8, label: '8s Reel' },
              ].map((d) => (
                <button
                  key={d.sec}
                  onClick={() => setVideoDuration(d.sec)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    videoDuration === d.sec
                      ? 'border-purple-600 bg-purple-600 text-white'
                      : 'border-gray-200 bg-white text-gray-700'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-3 text-xs font-semibold text-gray-700">
            <input
              type="checkbox"
              checked={transparentVideoBackground}
              onChange={(event) => setTransparentVideoBackground(event.target.checked)}
              className="h-4 w-4 accent-purple-600"
            />
            Transparent video background
          </label>

          {isRecordingVideo ? (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col items-center justify-center text-center animate-pulse">
              <span className="text-sm font-black text-rose-600">Recording Video {recordingProgress}%</span>
              <span className="text-xs text-rose-500">Rendering 3D frames at 60 FPS...</span>
            </div>
          ) : (
            <button
              onClick={() => onStartVideoRecord(videoDuration, transparentVideoBackground)}
              className="w-full py-3 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-105 active:scale-95 shadow-md shadow-purple-500/25 transition-all flex items-center justify-center gap-2"
            >
              <Video className="w-4 h-4" />
              <span>Record & Save Video</span>
            </button>
          )}
        </div>
      )}

    </aside>
  );
};
