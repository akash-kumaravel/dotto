import React, { useState } from 'react';
import { X, Download, FileText, Check, Sparkles } from 'lucide-react';
import { ShirtConfig } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ShirtConfig;
  onExportImage: (transparent: boolean) => string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  config,
  onExportImage,
}) => {
  const [format, setFormat] = useState<'studio' | 'transparent'>('studio');
  const [downloaded, setDownloaded] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    const dataUrl = onExportImage(format === 'transparent');
    if (!dataUrl) return;

    const link = document.createElement('a');
    link.download = `tee-studio-3d-mockup-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2400);
  };

  const handleDownloadTechPack = () => {
    const spec = {
      apparel: {
        model: 'Heavyweight Unisex 3D T-Shirt',
        fabricKnit: config.fabric,
        colors: {
          front: config.parts.front.color,
          back: config.parts.back.color,
          collar: config.parts.collar.color,
          sleeveLeft: config.parts.sleeveLeft.color,
          sleeveRight: config.parts.sleeveRight.color,
        },
      },
      frontDesign: {
        artwork: config.parts.front.design.name || 'Custom Upload',
        scale: `${Math.round(config.parts.front.design.sc * 100)}%`,
        rotation: `${Math.round((config.parts.front.design.rot * 180) / Math.PI)}°`,
        coordinates: { x: config.parts.front.design.x, y: config.parts.front.design.y },
        text: config.parts.front.text.enabled ? config.parts.front.text : null,
      },
      backDesign: {
        artwork: config.parts.back.design.name || 'None',
        scale: `${Math.round(config.parts.back.design.sc * 100)}%`,
        rotation: `${Math.round((config.parts.back.design.rot * 180) / Math.PI)}°`,
        coordinates: { x: config.parts.back.design.x, y: config.parts.back.design.y },
        text: config.parts.back.text.enabled ? config.parts.back.text : null,
      },
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(spec, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `tee-studio-techpack-${Date.now()}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#181724] p-6 shadow-2xl border border-black/10 dark:border-white/10 text-neutral-900 dark:text-white">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5 text-neutral-500" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black">Export Presentation Renders</h2>
            <p className="text-xs text-neutral-500">
              High-resolution 3D garment renders & tech pack specification
            </p>
          </div>
        </div>

        {/* Format Selector */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <button
            onClick={() => setFormat('studio')}
            className={`p-3 rounded-2xl border text-left text-xs font-bold transition-all ${
              format === 'studio'
                ? 'border-purple-600 ring-2 ring-purple-500/20 bg-purple-50 dark:bg-purple-950/30'
                : 'border-black/10 dark:border-white/10 opacity-70 hover:opacity-100'
            }`}
          >
            <div className="font-extrabold text-sm mb-0.5">Studio Atmosphere</div>
            <div className="text-[11px] font-normal text-neutral-500">
              With ambient backdrop and floor contact shadow
            </div>
          </button>

          <button
            onClick={() => setFormat('transparent')}
            className={`p-3 rounded-2xl border text-left text-xs font-bold transition-all ${
              format === 'transparent'
                ? 'border-purple-600 ring-2 ring-purple-500/20 bg-purple-50 dark:bg-purple-950/30'
                : 'border-black/10 dark:border-white/10 opacity-70 hover:opacity-100'
            }`}
          >
            <div className="font-extrabold text-sm mb-0.5">Transparent Cutout</div>
            <div className="text-[11px] font-normal text-neutral-500">
              Isolated 3D shirt cutout for stores and mockups
            </div>
          </button>
        </div>

        {/* Multi-Part Color Overview */}
        <div className="rounded-2xl p-4 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 mb-6 text-xs space-y-2">
          <div className="font-bold text-neutral-500 uppercase tracking-wider text-[11px]">
            Garment Part Specifications
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: config.parts.front.color }} />
              <span className="truncate">Front: {config.parts.front.color}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: config.parts.back.color }} />
              <span className="truncate">Back: {config.parts.back.color}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: config.parts.collar.color }} />
              <span className="truncate">Collar: {config.parts.collar.color}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: config.parts.sleeveLeft.color }} />
              <span className="truncate">L Sleeve: {config.parts.sleeveLeft.color}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: config.parts.sleeveRight.color }} />
              <span className="truncate">R Sleeve: {config.parts.sleeveRight.color}</span>
            </div>
            <div className="truncate">Knit: {config.fabric}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-extrabold text-white bg-purple-600 hover:bg-purple-700 active:scale-98 shadow-lg shadow-purple-500/25 transition-all"
          >
            {downloaded ? (
              <>
                <Check className="w-4 h-4" />
                <span>Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download High-Res PNG</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadTechPack}
            className="p-3 rounded-2xl border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            title="Download Tech Pack JSON"
          >
            <FileText className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
          </button>
        </div>
      </div>
    </div>
  );
};
