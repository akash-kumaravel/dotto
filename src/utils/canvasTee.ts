import { ShirtConfig, TextLayer, FabricType } from '../types';

export const CANVAS_SIZE = 1024;
const S = CANVAS_SIZE;

// Procedural Fabric Weave Patterns for realistic textile surface feel
const weavePatterns: Record<FabricType, HTMLCanvasElement> = {
  cotton: (() => {
    const p = document.createElement('canvas');
    p.width = p.height = 4;
    const c = p.getContext('2d')!;
    c.fillStyle = 'rgba(255,255,255,.07)';
    c.fillRect(0, 0, 2, 2);
    c.fillRect(2, 2, 2, 2);
    c.fillStyle = 'rgba(0,0,0,.10)';
    c.fillRect(2, 0, 2, 2);
    c.fillRect(0, 2, 2, 2);
    return p;
  })(),
  heavy: (() => {
    const p = document.createElement('canvas');
    p.width = p.height = 6;
    const c = p.getContext('2d')!;
    c.fillStyle = 'rgba(255,255,255,.12)';
    c.fillRect(0, 0, 3, 3);
    c.fillRect(3, 3, 3, 3);
    c.fillStyle = 'rgba(0,0,0,.16)';
    c.fillRect(3, 0, 3, 3);
    c.fillRect(0, 3, 3, 3);
    return p;
  })(),
  washed: (() => {
    const p = document.createElement('canvas');
    p.width = p.height = 8;
    const c = p.getContext('2d')!;
    c.fillStyle = 'rgba(255,255,255,.09)';
    c.fillRect(1, 1, 3, 3);
    c.fillRect(5, 5, 2, 2);
    c.fillStyle = 'rgba(0,0,0,.12)';
    c.fillRect(4, 1, 3, 2);
    c.fillRect(1, 5, 3, 2);
    return p;
  })(),
  smooth: (() => {
    const p = document.createElement('canvas');
    p.width = p.height = 2;
    const c = p.getContext('2d')!;
    c.fillStyle = 'rgba(255,255,255,.04)';
    c.fillRect(0, 0, 1, 1);
    c.fillStyle = 'rgba(0,0,0,.06)';
    c.fillRect(1, 1, 1, 1);
    return p;
  })(),
};

// Render Curved or Straight Text on Shirt
function renderTextLayer(c: CanvasRenderingContext2D, textLayer: TextLayer) {
  if (!textLayer.enabled || !textLayer.text.trim()) return;

  c.save();
  c.fillStyle = textLayer.color;
  c.font = `${textLayer.weight || '700'} ${textLayer.size}px "${textLayer.font}", sans-serif`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';

  const text = textLayer.text;

  if (textLayer.curved) {
    const radius = textLayer.curveRadius || 260;
    const angleStep = (textLayer.size * 0.75 + textLayer.letterSpacing * 4) / radius;
    const totalAngle = angleStep * (text.length - 1);
    const startAngle = -Math.PI / 2 - totalAngle / 2;

    c.translate(textLayer.x, textLayer.y + radius);
    c.rotate(textLayer.rot);

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const charAngle = startAngle + i * angleStep;

      c.save();
      c.rotate(charAngle + Math.PI / 2);
      c.translate(0, -radius);
      c.fillText(char, 0, 0);
      c.restore();
    }
  } else {
    c.translate(textLayer.x, textLayer.y);
    c.rotate(textLayer.rot);

    if (textLayer.letterSpacing > 0 && 'letterSpacing' in c) {
      c.letterSpacing = `${textLayer.letterSpacing}px`;
    }
    c.fillText(text, 0, 0);
  }

  c.restore();
}

// Main Texture Painter for any Part (front, back, sleeves)
export function paintPartTexture(
  cv: HTMLCanvasElement,
  part: 'front' | 'back' | 'sleeveLeft' | 'sleeveRight',
  config: ShirtConfig,
  hideHandles = false
) {
  const c = cv.getContext('2d');
  if (!c) return;

  c.clearRect(0, 0, S, S);
  c.save();

  const partConfig = config.parts[part];
  const color = partConfig?.color || config.parts.front.color;

  // 1. Base Fabric Color Fill
  c.fillStyle = color;
  c.fillRect(0, 0, S, S);

  // 2. Graphic Artwork
  const design = partConfig?.design;
  if (design && design.img) {
    c.save();
    c.translate(design.x, design.y);
    c.rotate(design.rot);

    if (design.flipX || design.flipY) {
      c.scale(design.flipX ? -1 : 1, design.flipY ? -1 : 1);
    }

    c.globalAlpha = Math.max(0.1, Math.min(1.0, design.opacity));
    c.globalCompositeOperation = design.blendMode || 'source-over';

    const drawW = design.w * design.sc;
    const drawH = design.h * design.sc;
    c.drawImage(design.img, -drawW / 2, -drawH / 2, drawW, drawH);
    c.restore();
  } else if (!hideHandles) {
    // Elegant upload placeholder matching Pacdora / reference image
    c.save();
    c.textAlign = 'center';
    c.textBaseline = 'middle';

    const partLabels: Record<string, string> = {
      front: 'Front Design',
      back: 'Back Design',
      sleeveLeft: 'Left Sleeve',
      sleeveRight: 'Right Sleeve',
    };
    const partTitle = partLabels[part] || 'Design Area';

    // Dashed frame in subtle violet / grey
    c.strokeStyle = 'rgba(139, 92, 246, 0.40)';
    c.lineWidth = 2.5;
    c.setLineDash([10, 8]);
    const boxW = S * 0.48;
    const boxH = S * 0.50;
    const boxX = (S - boxW) / 2;
    const boxY = (S - boxH) / 2;
    c.strokeRect(boxX, boxY, boxW, boxH);

    // Upload circle icon
    c.beginPath();
    c.arc(S / 2, S / 2 - 32, 26, 0, Math.PI * 2);
    c.fillStyle = 'rgba(139, 92, 246, 0.12)';
    c.fill();
    c.lineWidth = 2;
    c.strokeStyle = '#8b5cf6';
    c.stroke();

    // Plus sign
    c.fillStyle = '#7c3aed';
    c.font = '700 28px sans-serif';
    c.fillText('+', S / 2, S / 2 - 31);

    // Typography
    c.fillStyle = 'rgba(30, 41, 59, 0.85)';
    c.font = '700 26px "Space Grotesk", sans-serif';
    c.fillText(`Upload ${partTitle}`, S / 2, S / 2 + 16);

    c.fillStyle = 'rgba(100, 116, 139, 0.80)';
    c.font = '600 18px "Space Grotesk", sans-serif';
    c.fillText('Click part to choose file', S / 2, S / 2 + 48);

    c.restore();
  }

  // 3. Custom Typography Text Layer
  if (partConfig?.text) {
    renderTextLayer(c, partConfig.text);
  }

  // 4. Procedural Textile Weave Micro-Texture
  const weaveCanvas = weavePatterns[config.fabric] || weavePatterns.cotton;
  const pattern = c.createPattern(weaveCanvas, 'repeat');
  if (pattern) {
    c.fillStyle = pattern;
    c.fillRect(0, 0, S, S);
  }

  // 5. Fabric Realistic Shading Drape Gradient
  const drapeGrad = c.createLinearGradient(0, 0, 0, S);
  drapeGrad.addColorStop(0, 'rgba(255, 255, 255, 0.07)');
  drapeGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
  drapeGrad.addColorStop(1, 'rgba(0, 0, 0, 0.20)');
  c.fillStyle = drapeGrad;
  c.fillRect(0, 0, S, S);

  // 6. Interactive Visual Selection Bounding Box & Corner Resize Handles
  // Rendered directly on active part's design when in interactive edit mode
  if (!hideHandles && config.activePart === part && design && design.img) {
    c.save();
    c.translate(design.x, design.y);
    c.rotate(design.rot);

    const drawW = design.w * design.sc;
    const drawH = design.h * design.sc;
    const pad = 10;
    const hw = drawW / 2 + pad;
    const hh = drawH / 2 + pad;

    // Glowing subtle outer shadow
    c.shadowColor = 'rgba(124, 58, 237, 0.35)';
    c.shadowBlur = 10;

    // Dashed bounding box in vivid violet
    c.strokeStyle = '#8b5cf6';
    c.lineWidth = 2.8;
    c.setLineDash([8, 6]);
    c.strokeRect(-hw, -hh, hw * 2, hh * 2);

    // Clear shadow for crisp handles
    c.shadowColor = 'transparent';

    // Rotation connector line to top handle
    c.beginPath();
    c.strokeStyle = '#8b5cf6';
    c.lineWidth = 2.2;
    c.setLineDash([]);
    c.moveTo(0, -hh);
    c.lineTo(0, -hh - 34);
    c.stroke();

    // Top Rotation Handle Node (circle with rotation arrow)
    c.beginPath();
    c.arc(0, -hh - 34, 12, 0, Math.PI * 2);
    c.fillStyle = '#7c3aed';
    c.fill();
    c.lineWidth = 2.5;
    c.strokeStyle = '#ffffff';
    c.stroke();

    // 4 Corner Resize Nodes (white pill with purple border & inner dot)
    const cornerNodes: [number, number][] = [
      [-hw, -hh], // Top-Left
      [hw, -hh],  // Top-Right
      [-hw, hh],  // Bottom-Left
      [hw, hh],   // Bottom-Right
    ];

    cornerNodes.forEach(([cx, cy]) => {
      // Outer drop shadow for handle
      c.save();
      c.shadowColor = 'rgba(0, 0, 0, 0.25)';
      c.shadowBlur = 6;
      c.shadowOffsetY = 2;

      c.beginPath();
      c.arc(cx, cy, 14, 0, Math.PI * 2);
      c.fillStyle = '#ffffff';
      c.fill();
      c.lineWidth = 3;
      c.strokeStyle = '#7c3aed';
      c.stroke();
      c.restore();

      // Inner violet dot
      c.beginPath();
      c.arc(cx, cy, 4.5, 0, Math.PI * 2);
      c.fillStyle = '#7c3aed';
      c.fill();
    });

    // Scale percentage badge at bottom center
    const badgeText = `${Math.round(design.sc * 100)}%`;
    c.font = '700 18px "Space Grotesk", sans-serif';
    const textMetrics = c.measureText(badgeText);
    const badgeW = textMetrics.width + 24;
    const badgeH = 26;
    const badgeY = hh + 18;

    c.fillStyle = 'rgba(15, 23, 42, 0.90)';
    if (typeof c.roundRect === 'function') {
      c.beginPath();
      c.roundRect(-badgeW / 2, badgeY, badgeW, badgeH, 6);
      c.fill();
    } else {
      c.fillRect(-badgeW / 2, badgeY, badgeW, badgeH);
    }

    c.fillStyle = '#ffffff';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(badgeText, 0, badgeY + badgeH / 2);

    c.restore();
  }

  c.restore();
}
