import type { PresetSVG, MaterialStylePreset, EnvironmentType } from '../types';

export const ENVIRONMENT_OPTIONS: { id: EnvironmentType; label: string; description: string }[] = [
  { id: 'studio', label: 'Clean Studio', description: 'Neutral high-contrast commercial studio' },
  { id: 'apartment', label: 'Softbox', description: 'Diffused studio softbox with balanced rim lighting' },
  { id: 'city', label: 'Bright Daylight', description: 'Sharp crisp outdoor highlights' },
  { id: 'warehouse', label: 'Photo Studio', description: 'Moody industrial reflection maps' },
  { id: 'night', label: 'Cyber Night', description: 'Deep dark contrast with neon reflections' },
  { id: 'dawn', label: 'Golden Dawn', description: 'Warm metallic golden hour specular tones' },
  { id: 'sunset', label: 'Sunset Glow', description: 'High chromatic gradient reflections' },
];

export const MATERIAL_PRESETS: MaterialStylePreset[] = [
  {
    id: 'liquid-chrome',
    name: 'Liquid Chrome',
    badge: 'Mirror',
    chrome: 100,
    color: '#ffffff',
    depth: 35,
    roundedEdge: 45,
    environment: 'studio',
  },
  {
    id: 'cyber-gold',
    name: 'Cyber 24K Gold',
    badge: 'Luxury',
    chrome: 95,
    color: '#ffc83b',
    depth: 40,
    roundedEdge: 50,
    environment: 'sunset',
  },
  {
    id: 'obsidian-titanium',
    name: 'Obsidian Noir',
    badge: 'Stealth',
    chrome: 85,
    color: '#1a1d24',
    depth: 30,
    roundedEdge: 30,
    environment: 'warehouse',
  },
  {
    id: 'rose-iridescent',
    name: 'Rose Platinum',
    badge: 'Premium',
    chrome: 90,
    color: '#ff7eb6',
    depth: 35,
    roundedEdge: 40,
    environment: 'dawn',
  },
  {
    id: 'deep-emerald',
    name: 'Emerald Core',
    badge: 'Exotic',
    chrome: 92,
    color: '#00f2aa',
    depth: 45,
    roundedEdge: 35,
    environment: 'night',
  },
  {
    id: 'matte-minimal',
    name: 'Matte Ceramic',
    badge: 'Modern',
    chrome: 15,
    color: '#e5e7eb',
    depth: 30,
    roundedEdge: 25,
    environment: 'apartment',
  },
];

export const PRESET_SVGS: PresetSVG[] = [
  {
    id: 'cyber-starburst',
    name: 'Nova Star',
    category: 'Emblem',
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <path d="M 100,10 L 118,65 L 175,45 L 138,90 L 190,100 L 138,110 L 175,155 L 118,135 L 100,190 L 82,135 L 25,155 L 62,110 L 10,100 L 62,90 L 25,45 L 82,65 Z M 100,60 L 90,85 L 65,100 L 90,115 L 100,140 L 110,115 L 135,100 L 110,85 Z" fill="#ffffff" fill-rule="evenodd"/>
</svg>`,
  },
  {
    id: 'cyber-monogram',
    name: 'Apex Monogram',
    category: 'Brandmark',
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <path d="M 100,20 L 180,160 L 140,160 L 125,130 L 75,130 L 60,160 L 20,160 Z M 100,65 L 85,110 L 115,110 Z" fill="#ffffff" fill-rule="evenodd"/>
</svg>`,
  },
  {
    id: 'prism-crystal',
    name: 'Prism Diamond',
    category: 'Luxury',
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <path d="M 50,40 L 150,40 L 185,85 L 100,175 L 15,85 Z M 65,55 L 35,85 L 90,85 Z M 135,55 L 110,85 L 165,85 Z M 75,55 L 100,85 L 125,55 Z M 45,95 L 95,150 L 95,95 Z M 155,95 L 105,95 L 105,150 Z" fill="#ffffff" fill-rule="evenodd"/>
</svg>`,
  }
];
