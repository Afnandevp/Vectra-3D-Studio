export type EnvironmentType = 
  | 'studio' 
  | 'city' 
  | 'sunset' 
  | 'dawn' 
  | 'warehouse' 
  | 'apartment' 
  | 'night' 
  | 'park';

export type VideoBackgroundType = 'black' | 'white';

export interface LogoSettings {
  // Geometry
  depth: number; // 0 - 100
  roundedEdge: number; // 0 - 100 (bevel size & thickness)
  curveSegments: number; // 16 - 64
  
  // Material
  chrome: number; // 0 - 100 (metalness/roughness)
  color: string; // hex
  roughness: number; // fine-tune 0 - 1
  metalness: number; // fine-tune 0 - 1
  
  // Lighting
  environment: EnvironmentType;
  envIntensity: number;
  lightIntensity: number;
  
  // Animation
  spinDuration: number; // 2s - 20s
  isSpinning: boolean;
  
  // Background
  videoBackground: VideoBackgroundType;
}

export interface PresetSVG {
  id: string;
  name: string;
  category: string;
  svg: string;
}

export interface MaterialStylePreset {
  id: string;
  name: string;
  badge: string;
  chrome: number;
  color: string;
  depth: number;
  roundedEdge: number;
  environment: EnvironmentType;
  roughness?: number;
}

export type ExportFormat = 'glb' | 'mp4' | 'gif' | 'png';

export interface ExportProgress {
  isExporting: boolean;
  format: ExportFormat | null;
  progress: number; // 0 to 100
  statusText: string;
  downloadUrl?: string;
  fileName?: string;
}
