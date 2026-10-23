import { ColorPreset, GraphicPreset } from '../types';

// Original Retro Synth Sun from the demo
export function createRetroSunCanvas(): HTMLCanvasElement {
  const art = document.createElement('canvas');
  art.width = 600;
  art.height = 600;
  const c = art.getContext('2d');
  if (!c) return art;

  // Gradient sun circle
  const g = c.createLinearGradient(0, 60, 0, 540);
  g.addColorStop(0, '#ffe14f');
  g.addColorStop(0.5, '#ff4f8b');
  g.addColorStop(1, '#7a3dff');

  c.fillStyle = g;
  c.beginPath();
  c.arc(300, 300, 210, 0, Math.PI * 2);
  c.fill();

  // Laser slice cuts
  c.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 7; i++) {
    c.fillRect(80, 310 + i * 34, 440, 5 + i * 3.4);
  }

  // Neon orbital rings
  c.globalCompositeOperation = 'source-over';
  c.strokeStyle = '#4fd8ff';
  c.lineWidth = 10;
  c.beginPath();
  c.arc(300, 300, 252, 0, Math.PI * 2);
  c.stroke();

  c.lineWidth = 3;
  c.beginPath();
  c.arc(300, 300, 275, 0, Math.PI * 2);
  c.stroke();

  return art;
}

// Tokyo Cyber Sigil
export function createTokyoKanjiCanvas(): HTMLCanvasElement {
  const art = document.createElement('canvas');
  art.width = 600;
  art.height = 600;
  const c = art.getContext('2d');
  if (!c) return art;

  // Dark framed cyber badge
  c.fillStyle = '#0f0e17';
  c.beginPath();
  c.roundRect(50, 50, 500, 500, 40);
  c.fill();

  // Outer neon edge
  c.strokeStyle = '#ff3366';
  c.lineWidth = 8;
  c.stroke();

  // Inner decorative border
  c.strokeStyle = '#33ccff';
  c.lineWidth = 3;
  c.beginPath();
  c.roundRect(70, 70, 460, 460, 24);
  c.stroke();

  // Center Kanji / Geometric Cyber Sigil
  c.fillStyle = '#ffffff';
  c.font = 'bold 160px "Syne", "Noto Sans JP", sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('東京', 300, 280);

  // Subtext
  c.fillStyle = '#ff3366';
  c.font = '700 28px "Space Grotesk", sans-serif';
  c.letterSpacing = '12px';
  c.fillText('CYBER DIVISION', 300, 410);

  // Cyber barcode
  c.fillStyle = '#33ccff';
  for (let x = 180; x < 420; x += 14) {
    const w = (x % 3 === 0) ? 7 : 3;
    c.fillRect(x, 445, w, 28);
  }

  return art;
}

// Acid Botanical Lotus
export function createBotanicalCanvas(): HTMLCanvasElement {
  const art = document.createElement('canvas');
  art.width = 600;
  art.height = 600;
  const c = art.getContext('2d');
  if (!c) return art;

  // Radial soft glow
  const rg = c.createRadialGradient(300, 300, 40, 300, 300, 260);
  rg.addColorStop(0, 'rgba(31, 201, 138, 0.25)');
  rg.addColorStop(1, 'rgba(0, 0, 0, 0)');
  c.fillStyle = rg;
  c.beginPath();
  c.arc(300, 300, 260, 0, Math.PI * 2);
  c.fill();

  // Elegant botanical petals
  c.save();
  c.translate(300, 300);
  const petals = 12;
  for (let i = 0; i < petals; i++) {
    c.rotate((Math.PI * 2) / petals);
    c.beginPath();
    c.moveTo(0, 0);
    c.quadraticCurveTo(45, -90, 0, -210);
    c.quadraticCurveTo(-45, -90, 0, 0);
    c.fillStyle = i % 2 === 0 ? '#1fc98a' : '#17a26c';
    c.globalAlpha = 0.85;
    c.fill();
    c.strokeStyle = '#ffffff';
    c.lineWidth = 2;
    c.stroke();
  }
  c.restore();

  // Center orb
  c.fillStyle = '#ffde59';
  c.beginPath();
  c.arc(300, 300, 38, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = '#17151f';
  c.lineWidth = 5;
  c.stroke();

  return art;
}

// Bauhaus Geometric Wave
export function createBauhausCanvas(): HTMLCanvasElement {
  const art = document.createElement('canvas');
  art.width = 600;
  art.height = 600;
  const c = art.getContext('2d');
  if (!c) return art;

  // Solid background circle
  c.fillStyle = '#f26419';
  c.beginPath();
  c.arc(300, 300, 240, 0, Math.PI * 2);
  c.fill();

  // Half moon cutout
  c.fillStyle = '#33658a';
  c.beginPath();
  c.arc(300, 300, 240, Math.PI * 0.5, Math.PI * 1.5);
  c.fill();

  // Overlapping arched pill
  c.fillStyle = '#f6ae2d';
  c.beginPath();
  c.roundRect(220, 160, 160, 280, 80);
  c.fill();
  c.strokeStyle = '#17151f';
  c.lineWidth = 8;
  c.stroke();

  // Black accent dot
  c.fillStyle = '#17151f';
  c.beginPath();
  c.arc(300, 240, 32, 0, Math.PI * 2);
  c.fill();

  // Parallel lines
  c.strokeStyle = '#ffffff';
  c.lineWidth = 6;
  for (let y = 330; y <= 400; y += 18) {
    c.beginPath();
    c.moveTo(250, y);
    c.lineTo(350, y);
    c.stroke();
  }

  return art;
}

// Acid Street Smiley
export function createSmileyCanvas(): HTMLCanvasElement {
  const art = document.createElement('canvas');
  art.width = 600;
  art.height = 600;
  const c = art.getContext('2d');
  if (!c) return art;

  // Melted aura
  c.fillStyle = '#ff007f';
  c.beginPath();
  c.arc(300, 300, 250, 0, Math.PI * 2);
  c.fill();

  c.fillStyle = '#00f0ff';
  c.beginPath();
  c.arc(300, 300, 220, 0, Math.PI * 2);
  c.fill();

  c.fillStyle = '#ffe600';
  c.beginPath();
  c.arc(300, 300, 190, 0, Math.PI * 2);
  c.fill();

  // Distorted wavy eyes
  c.fillStyle = '#17151f';
  // Left eye
  c.beginPath();
  c.ellipse(230, 250, 24, 42, -0.2, 0, Math.PI * 2);
  c.fill();
  // Right eye (wink / cross or melted)
  c.beginPath();
  c.ellipse(370, 250, 24, 42, 0.2, 0, Math.PI * 2);
  c.fill();

  // Dripping wavy smile
  c.strokeStyle = '#17151f';
  c.lineWidth = 18;
  c.lineCap = 'round';
  c.beginPath();
  c.arc(300, 310, 100, 0.2 * Math.PI, 0.8 * Math.PI);
  c.stroke();

  return art;
}

export const GRAPHIC_PRESETS: GraphicPreset[] = [
  {
    id: 'retro-sun',
    name: 'Synth Sun',
    category: 'Retro',
    generate: createRetroSunCanvas,
  },
  {
    id: 'tokyo-kanji',
    name: 'Neo Tokyo',
    category: 'Streetwear',
    generate: createTokyoKanjiCanvas,
  },
  {
    id: 'acid-botanical',
    name: 'Acid Lotus',
    category: 'Organic',
    generate: createBotanicalCanvas,
  },
  {
    id: 'bauhaus-wave',
    name: 'Bauhaus Arch',
    category: 'Modernist',
    generate: createBauhausCanvas,
  },
  {
    id: 'street-smiley',
    name: 'Acid Smile',
    category: 'Y2K',
    generate: createSmileyCanvas,
  },
];

export const COLOR_PRESETS: ColorPreset[] = [
  { id: 'chalk', name: 'Chalk White', hex: '#f4f4f6', textColor: '#17151f' },
  { id: 'phantom', name: 'Phantom Black', hex: '#15151b', textColor: '#ffffff' },
  { id: 'heather', name: 'Heather Grey', hex: '#9c9ca3', textColor: '#ffffff' },
  { id: 'crimson', name: 'Crimson Red', hex: '#e8334a', textColor: '#ffffff' },
  { id: 'cobalt', name: 'Cobalt Royal', hex: '#2f6bff', textColor: '#ffffff' },
  { id: 'emerald', name: 'Emerald Jade', hex: '#1fc98a', textColor: '#ffffff' },
  { id: 'lavender', name: 'Lavender Lilac', hex: '#9b72cf', textColor: '#ffffff' },
  { id: 'terracotta', name: 'Terracotta Clay', hex: '#d96b43', textColor: '#ffffff' },
  { id: 'mustard', name: 'Mustard Ochre', hex: '#e5a93b', textColor: '#17151f' },
  { id: 'olive', name: 'Olive Green', hex: '#3e4f3a', textColor: '#ffffff' },
  { id: 'cocoa', name: 'Cocoa Brown', hex: '#382b24', textColor: '#ffffff' },
  { id: 'pastel-sky', name: 'Pastel Sky', hex: '#9cd6ff', textColor: '#17151f' },
];
