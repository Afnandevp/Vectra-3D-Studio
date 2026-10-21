import { create } from 'zustand';
import type { 
  EnvironmentType, 
  VideoBackgroundType, 
  ExportProgress, 
  MaterialStylePreset,
  PresetSVG 
} from '../types';
import { PRESET_SVGS, MATERIAL_PRESETS } from '../constants/presets';

interface LogoStoreState {
  // Geometry
  depth: number;
  roundedEdge: number;
  curveSegments: number;
  
  // Material
  chrome: number;
  color: string;
  roughness: number;
  metalness: number;
  
  // Lighting
  environment: EnvironmentType;
  envIntensity: number;
  lightIntensity: number;
  
  // Animation & Motion
  spinDuration: number;
  isSpinning: boolean;
  
  // Scene Background
  videoBackground: VideoBackgroundType;
  
  // SVG Asset
  svgContent: string;
  svgName: string;
  selectedSvgPresetId: string;
  selectedMaterialPresetId: string;
  hasCustomSvg: boolean;

  // Export State
  exportProgress: ExportProgress;
  isExportModalOpen: boolean;

  // Token Gate Session Verification (resets on page refresh / revisit)
  isSessionVerified: boolean;
  setIsSessionVerified: (verified: boolean) => void;

  // Camera & Canvas Controls
  cameraResetKey: number;

  // Actions
  setDepth: (depth: number) => void;
  setRoundedEdge: (roundedEdge: number) => void;
  setCurveSegments: (segments: number) => void;
  
  setChrome: (chrome: number) => void;
  setColor: (color: string) => void;
  
  setEnvironment: (env: EnvironmentType) => void;
  setEnvIntensity: (intensity: number) => void;
  setLightIntensity: (intensity: number) => void;
  
  setSpinDuration: (duration: number) => void;
  setIsSpinning: (spinning: boolean) => void;
  toggleSpinning: () => void;
  
  setVideoBackground: (bg: VideoBackgroundType) => void;
  
  setSvgContent: (content: string, name?: string) => void;
  selectSvgPreset: (preset: PresetSVG) => void;
  applyMaterialPreset: (preset: MaterialStylePreset) => void;
  clearSvg: () => void;
  
  setExportProgress: (progress: Partial<ExportProgress>) => void;
  setIsExportModalOpen: (open: boolean) => void;
  resetCamera: () => void;
}

export const useLogoStore = create<LogoStoreState>((set) => ({
  // Geometry defaults
  depth: 35,
  roundedEdge: 35,
  curveSegments: 32,

  // Material defaults (Ultra high-end Liquid Chrome)
  chrome: 92,
  color: '#ffffff',
  roughness: 0.08,
  metalness: 0.95,
  
  // Lighting defaults
  environment: 'studio',
  envIntensity: 1.8,
  lightIntensity: 1.4,
  
  // Animation defaults
  spinDuration: 6, // 6s per loop
  isSpinning: true,
  
  // Scene Background
  videoBackground: 'black',
  
  // SVG defaults
  svgContent: PRESET_SVGS[0].svg,
  svgName: `${PRESET_SVGS[0].id}.svg`,
  selectedSvgPresetId: PRESET_SVGS[0].id,
  selectedMaterialPresetId: MATERIAL_PRESETS[0].id,
  hasCustomSvg: false,

  // Export State
  exportProgress: {
    isExporting: false,
    format: null,
    progress: 0,
    statusText: '',
  },
  isExportModalOpen: false,

  // Token Gate Session Verification (starts false on every refresh / revisit)
  isSessionVerified: false,

  cameraResetKey: 0,

  // Setters
  setDepth: (depth) => set({ depth }),
  setRoundedEdge: (roundedEdge) => set({ roundedEdge }),
  setCurveSegments: (curveSegments) => set({ curveSegments }),
  
  setChrome: (chrome) => {
    // Chrome slider directly controls metalness and roughness
    const normalized = Math.max(0, Math.min(100, chrome)) / 100;
    set({
      chrome,
      metalness: 0.2 + 0.8 * normalized,
      roughness: Math.max(0.02, (1 - normalized) * 0.85),
    });
  },
  setColor: (color) => set({ color }),
  
  setEnvironment: (environment) => set({ environment }),
  setEnvIntensity: (envIntensity) => set({ envIntensity }),
  setLightIntensity: (lightIntensity) => set({ lightIntensity }),
  
  setSpinDuration: (spinDuration) => set({ spinDuration }),
  setIsSpinning: (isSpinning) => set({ isSpinning }),
  toggleSpinning: () => set((state) => ({ isSpinning: !state.isSpinning })),
  
  setVideoBackground: (videoBackground) => set({ videoBackground }),
  
  setSvgContent: (svgContent, name = 'custom-logo.svg') => 
    set({ 
      svgContent, 
      svgName: name, 
      hasCustomSvg: true,
      selectedSvgPresetId: 'custom'
    }),
    
  selectSvgPreset: (preset) => 
    set({ 
      svgContent: preset.svg, 
      svgName: `${preset.id}.svg`,
      selectedSvgPresetId: preset.id,
      hasCustomSvg: false
    }),

  clearSvg: () =>
    set({
      svgContent: '',
      svgName: '',
      selectedSvgPresetId: '',
      hasCustomSvg: false,
    }),
    
  applyMaterialPreset: (preset) => 
    set({
      selectedMaterialPresetId: preset.id,
      chrome: preset.chrome,
      color: preset.color,
      depth: preset.depth,
      roundedEdge: preset.roundedEdge,
      environment: preset.environment,
      metalness: 0.2 + 0.8 * (preset.chrome / 100),
      roughness: preset.roughness !== undefined ? preset.roughness : Math.max(0.02, (1 - (preset.chrome / 100)) * 0.85),
    }),
    
  setExportProgress: (newProgress) => 
    set((state) => ({ 
      exportProgress: { ...state.exportProgress, ...newProgress } 
    })),
    
  setIsExportModalOpen: (isExportModalOpen) => set({ isExportModalOpen }),

  setIsSessionVerified: (isSessionVerified) => set({ isSessionVerified }),
  
  resetCamera: () => set((state) => ({ cameraResetKey: state.cameraResetKey + 1 })),
}));
