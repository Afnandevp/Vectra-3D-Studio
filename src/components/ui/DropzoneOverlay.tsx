import React, { useState } from 'react';
import { UploadCloud, FileType } from 'lucide-react';
import { useLogoStore } from '../../store/useLogoStore';
import { isValidSvgString } from '../../utils/svgParser';

export const DropzoneOverlay: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const setSvgContent = useLogoStore((s) => s.setSvgContent);
  const svgName = useLogoStore((s) => s.svgName);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file && (file.type === 'image/svg+xml' || file.name.endsWith('.svg'))) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (isValidSvgString(text)) {
          setSvgContent(text, file.name);
        } else {
          alert('Uploaded SVG does not contain valid vector paths.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative w-full h-full flex-1 overflow-hidden flex flex-col min-w-0 min-h-0"
    >
      {/* 3D WebGL Canvas Layer */}
      <div className="relative w-full h-full flex-1 overflow-hidden min-w-0 min-h-0 flex flex-col">{children}</div>

      {/* Drag & Drop Visual Overlay */}
      {isDragOver && (
        <div className="absolute inset-4 z-40 rounded-xl border border-white/20 bg-[#0A0A0A]/90 backdrop-blur-md flex flex-col items-center justify-center pointer-events-none animate-fadeIn">
          <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-white/80 mb-3 animate-bounce">
            <UploadCloud className="w-6 h-6" />
          </div>
          <h3 className="text-[13px] font-medium text-white/90 tracking-wide">Drop SVG Vector Here</h3>
          <p className="text-[11px] text-white/40 mt-1">Converts automatically to real-time 3D extrusion</p>
        </div>
      )}

      {/* Floating Canvas Overlays (Minimal Glass Panels) */}
      <div className="absolute bottom-4 left-4 right-4 pointer-events-none flex items-center justify-between z-20">
        {/* Active File Pill */}
        <div className="pointer-events-auto bg-[#0A0A0A]/80 backdrop-blur-md border border-white/10 rounded-full px-3 py-1.5 text-[11px] text-white/60 flex items-center gap-2 shadow-sm">
          <FileType className="w-3.5 h-3.5 text-white/70" />
          <span className="font-mono text-[11px] font-medium text-white/85">{svgName}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        </div>

        {/* Orbit / Pan / Zoom Instruction Hint */}
        <div className="hidden sm:flex items-center gap-2.5 bg-[#0A0A0A]/80 backdrop-blur-md border border-white/10 rounded-full px-3 py-1.5 text-[11px] text-white/60 font-mono shadow-sm">
          <span>Rotate: Left Click</span>
          <span className="text-white/20">/</span>
          <span>Pan: Right Click</span>
          <span className="text-white/20">/</span>
          <span>Zoom: Scroll</span>
        </div>
      </div>
    </div>
  );
};

export default DropzoneOverlay;
