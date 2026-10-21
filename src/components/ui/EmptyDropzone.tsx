import React, { useState, useRef } from 'react';
import { Upload } from 'lucide-react';

export interface EmptyDropzoneProps {
  /** Callback fired when a valid SVG File is dropped or selected */
  onUpload: (file: File) => void;
}

export const EmptyDropzone: React.FC<EmptyDropzoneProps> = ({ onUpload }) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate and forward the uploaded SVG file
  const handleFile = (file: File) => {
    if (!file) return;

    const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
    if (!isSvg) {
      alert('Please upload a valid SVG vector file (.svg)');
      return;
    }

    onUpload(file);
  };

  // Drag and drop event handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  // Hidden file input change handler
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    e.target.value = '';
  };

  return (
    <div className="w-full h-full bg-black flex items-center justify-center p-6 select-none">
      {/* Centered Upload Box */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border border-dashed rounded-xl px-16 py-12 flex flex-col items-center cursor-pointer transition-all duration-300 outline-none
          ${
            isDragging
              ? 'border-white/50 bg-white/[0.02] scale-[1.01]'
              : 'border-white/20 hover:border-white/50 hover:bg-white/[0.02]'
          }
        `}
      >
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".svg"
          onChange={handleFileInputChange}
          onClick={(e) => e.stopPropagation()}
          className="hidden"
          aria-hidden="true"
        />

        {/* Minimalist Upload Glyph */}
        <div
          className={`
            w-11 h-11 rounded-full border flex items-center justify-center mb-6 transition-all duration-300
            ${
              isDragging
                ? 'border-white/40 bg-white/10 text-white scale-110'
                : 'border-white/10 bg-white/[0.03] text-white/60 hover:text-white hover:border-white/30'
            }
          `}
        >
          <Upload className="w-5 h-5 stroke-[1.75]" />
        </div>

        {/* Primary Action Text */}
        <span className="font-mono text-white text-sm font-bold tracking-[0.2em] uppercase">
          DROP YOUR SVG HERE
        </span>

        {/* Secondary Action Text */}
        <span className="font-mono text-white/50 text-[11px] tracking-widest uppercase mt-3">
          OR CLICK TO BROWSE
        </span>

        {/* Helper Text */}
        <p className="font-sans text-white/40 text-[11px] mt-8 text-center max-w-[250px] leading-relaxed">
          Clean SVGs work best: solid fills, text converted to outlines, no strokes
        </p>
      </div>
    </div>
  );
};

export default EmptyDropzone;
