import React from 'react';
import { 
  Lock, 
  Sliders, 
  Layers, 
  Sparkles, 
  Download, 
  FileCode, 
  Video, 
  Image as ImageIcon 
} from 'lucide-react';
import { UploadDropzone } from './UploadDropzone';

export interface EmptyStateUploadProps {
  /** Optional callback invoked when a valid SVG file is dropped or selected */
  onUpload?: (svgContent: string, fileName: string) => void;
}

export const EmptyStateUpload: React.FC<EmptyStateUploadProps> = ({ onUpload }) => {
  return (
    <div className="flex flex-row h-screen w-full overflow-hidden bg-black text-white/90 font-sans select-none antialiased">
      {/* 1. Main Canvas (Left - flex-1): Solid black container acting as the primary dropzone */}
      <main className="relative flex-1 h-full bg-black flex flex-col items-center justify-center p-8 overflow-hidden min-w-0 min-h-0">
        {/* Subtle radial ambient background glow */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.03) 0%, transparent 70%)'
          }}
        />

        {/* Center Rectangular Dropzone Container */}
        <UploadDropzone onSvgLoaded={onUpload} />
      </main>

      {/* 2. Right Sidebar (w-[380px]): Dark mode control panel with disabled placeholder controls */}
      <aside className="w-[380px] h-full flex-shrink-0 flex flex-col bg-[#0A0A0A] border-l border-white/5 z-20 text-white/80">
        {/* Top Header */}
        <div className="h-[48px] px-5 border-b border-white/5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-white/40" />
            <h3 className="text-[11px] font-semibold tracking-[0.12em] text-white/90 uppercase">
              Controls & Tuning
            </h3>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/[0.03] border border-white/5 text-[10px] font-mono text-white/40">
            <Lock className="w-2.5 h-2.5" />
            <span>LOCKED</span>
          </div>
        </div>

        {/* Disabled Controls Scrollable Region */}
        <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-6 opacity-40 pointer-events-none select-none">
          {/* Placeholder Segmented Tabs */}
          <div className="flex p-0.5 rounded-lg bg-white/[0.03] border border-white/5">
            <div className="flex-1 py-1.5 text-center text-[11px] font-medium rounded-md bg-white/10 text-white shadow-sm flex items-center justify-center gap-1.5">
              <Layers className="w-3 h-3 text-white/70" />
              <span>Geometry</span>
            </div>
            <div className="flex-1 py-1.5 text-center text-[11px] font-medium rounded-md text-white/40 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3 h-3 text-white/40" />
              <span>Material</span>
            </div>
          </div>

          {/* Section: Geometry Placeholders */}
          <div className="flex flex-col gap-5">
            <span className="text-[10px] tracking-[0.15em] uppercase text-white/50 font-semibold">
              Geometry & Volume
            </span>

            {/* Slider 1: Extrusion Depth */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-white/60">Extrusion Depth</span>
                <span className="font-mono text-white/40 text-[11px]">—</span>
              </div>
              <div className="relative h-1 w-full rounded-full bg-white/10">
                <div className="absolute left-0 top-0 h-full w-[35%] rounded-full bg-white/30" />
                <div className="absolute left-[35%] top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white/50 border border-black/50" />
              </div>
            </div>

            {/* Slider 2: Bevel & Corner Radius */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-white/60">Bevel & Softening</span>
                <span className="font-mono text-white/40 text-[11px]">—</span>
              </div>
              <div className="relative h-1 w-full rounded-full bg-white/10">
                <div className="absolute left-0 top-0 h-full w-[25%] rounded-full bg-white/30" />
                <div className="absolute left-[25%] top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white/50 border border-black/50" />
              </div>
            </div>

            {/* Slider 3: Curve Segments */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-white/60">Curve Resolution</span>
                <span className="font-mono text-white/40 text-[11px]">—</span>
              </div>
              <div className="relative h-1 w-full rounded-full bg-white/10">
                <div className="absolute left-0 top-0 h-full w-[50%] rounded-full bg-white/30" />
                <div className="absolute left-[50%] top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white/50 border border-black/50" />
              </div>
            </div>
          </div>

          <div className="h-px bg-white/5 w-full my-1" />

          {/* Section: Material & Finish Placeholders */}
          <div className="flex flex-col gap-5">
            <span className="text-[10px] tracking-[0.15em] uppercase text-white/50 font-semibold">
              Material & Finish
            </span>

            {/* Placeholder Color Swatches */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#e2e8f0]/30 border border-white/20" />
              <div className="w-6 h-6 rounded-full bg-[#f59e0b]/30 border border-white/20" />
              <div className="w-6 h-6 rounded-full bg-[#38bdf8]/30 border border-white/20" />
              <div className="w-6 h-6 rounded-full bg-[#a855f7]/30 border border-white/20" />
              <div className="w-6 h-6 rounded-full bg-[#10b981]/30 border border-white/20" />
            </div>

            {/* Slider: Chrome / Metalness */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-white/60">Chrome Reflection</span>
                <span className="font-mono text-white/40 text-[11px]">—</span>
              </div>
              <div className="relative h-1 w-full rounded-full bg-white/10">
                <div className="absolute left-0 top-0 h-full w-[85%] rounded-full bg-white/30" />
                <div className="absolute left-[85%] top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white/50 border border-black/50" />
              </div>
            </div>

            {/* Slider: Surface Roughness */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-white/60">Surface Roughness</span>
                <span className="font-mono text-white/40 text-[11px]">—</span>
              </div>
              <div className="relative h-1 w-full rounded-full bg-white/10">
                <div className="absolute left-0 top-0 h-full w-[15%] rounded-full bg-white/30" />
                <div className="absolute left-[15%] top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white/50 border border-black/50" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer: Disabled Export Suite */}
        <div className="p-5 border-t border-white/5 bg-[#080808] flex flex-col gap-3 flex-shrink-0">
          <div className="flex items-center justify-between text-[11px] text-white/40 mb-1">
            <span className="flex items-center gap-1.5">
              <Download className="w-3 h-3" />
              <span>Export Suite</span>
            </span>
            <span className="text-[10px] font-mono">STANDBY</span>
          </div>

          <div className="grid grid-cols-3 gap-2 opacity-35 pointer-events-none">
            <button
              disabled
              className="flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-lg bg-white/[0.02] border border-white/5 text-white/50 text-[11px] font-medium"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>.GLB</span>
            </button>
            <button
              disabled
              className="flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-lg bg-white/[0.02] border border-white/5 text-white/50 text-[11px] font-medium"
            >
              <Video className="w-3.5 h-3.5" />
              <span>.MP4</span>
            </button>
            <button
              disabled
              className="flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-lg bg-white/[0.02] border border-white/5 text-white/50 text-[11px] font-medium"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>.GIF</span>
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default EmptyStateUpload;
