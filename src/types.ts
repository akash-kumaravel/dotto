export type BlendMode = 'source-over' | 'multiply' | 'screen' | 'overlay';

export type TeePart = 'front' | 'back' | 'collar' | 'sleeveLeft' | 'sleeveRight' | 'all';

export interface ShirtDesign {
  img: HTMLImageElement | HTMLCanvasElement | null;
  name: string;
  x: number; // 0 to 1024, default 512
  y: number; // 0 to 1024, default 530
  w: number;
  h: number;
  rot: number; // radians
  sc: number; // scale factor
  opacity: number;
  blendMode: BlendMode;
  flipX: boolean;
  flipY: boolean;
}

export interface TextLayer {
  enabled: boolean;
  text: string;
  font: string;
  size: number;
  color: string;
  curved: boolean;
  curveRadius: number;
  x: number;
  y: number;
  rot: number;
  letterSpacing: number;
  weight: string;
}

export interface PartConfig {
  color: string;
  design: ShirtDesign;
  text: TextLayer;
}

export type FabricType = 'cotton' | 'heavy' | 'washed' | 'smooth';
export type StudioTheme = 'studio' | 'pure-white' | 'dark-editorial' | 'sunset' | 'custom';

export interface ShirtConfig {
  activePart: TeePart;
  parts: {
    front: PartConfig;
    back: PartConfig;
    collar: { color: string };
    sleeveLeft: PartConfig;
    sleeveRight: PartConfig;
  };
  fabric: FabricType;
  windIntensity: number; // 0 to 3
  windGust: number;
  theme: StudioTheme;
  backdropColor: string;
  backdropImage: string | null;
  backdropPattern: string | null;
  showStitches: boolean;
  autoRotate: boolean;
}

export interface ColorPreset {
  id: string;
  name: string;
  hex: string;
  textColor: string;
}

export interface GraphicPreset {
  id: string;
  name: string;
  category: string;
  generate: () => HTMLCanvasElement;
}
