import React, { useState, useRef } from 'react';
import { Upload } from 'lucide-react';

export interface UploadDropzoneProps {
  /** Callback fired when a valid SVG file is dropped or selected */
  onFileSelect?: (file: File) => void;
  /** Optional callback fired with the parsed text content of the SVG */
  onSvgLoaded?: (content: string, fileName: string) => void;
  /** Optional custom class name override */
  className?: string;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({
  onFileSelect,
  onSvgLoaded,
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File validation and extraction pipeline
  const handleFile = (file: File) => {
    if (!file) return;

    // Validate SVG MIME type or extension
    const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
    if (!isSvg) {
      alert('Please upload a valid SVG vector file (.svg)');
      return;
    }

    onFileSelect?.(file);

    if (onSvgLoaded) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) {
          onSvgLoaded(text, file.name);
        }
      };
      reader.readAsText(file);
    }
  };

  // Drag event handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Only deactivate when leaving the target bounding box
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
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    // Reset so the same file can be re-selected if needed
    e.target.value = '';
  };

  return (
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
        relative max-w-md w-full py-12 px-6 rounded-xl border border-dashed
        flex flex-col items-center justify-center text-center cursor-pointer select-none
        transition-colors duration-300 outline-none
        ${
          isDragging
            ? 'border-white/60 bg-white/[0.04]'
            : 'border-white/20 bg-transparent hover:border-white/50 hover:bg-white/[0.02]'
        }
        ${className}
      `}
    >
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".svg"
        onChange={handleInputChange}
        onClick={(e) => e.stopPropagation()}
        className="hidden"
        aria-hidden="true"
      />

      {/* Minimal Icon Glyph */}
      <div 
        className={`
          w-10 h-10 rounded-full border flex items-center justify-center mb-5 transition-all duration-300
          ${
            isDragging
              ? 'border-white/40 bg-white/10 text-white scale-110'
              : 'border-white/10 bg-white/[0.03] text-white/60 hover:text-white hover:border-white/25'
          }
        `}
      >
        <Upload className="w-4 h-4 stroke-[1.75]" />
      </div>

      {/* 1. Primary Action: Monospace, Uppercase, Heavily Tracked, Bold, Solid White */}
      <span className="font-mono text-sm font-bold uppercase tracking-[0.15em] text-white leading-tight">
        DROP YOUR SVG HERE
      </span>

      {/* 2. Secondary Action: Monospace, Uppercase, Slightly Smaller, Muted */}
      <span className="font-mono text-xs uppercase text-white/50 mt-3 tracking-wider">
        OR CLICK TO BROWSE
      </span>

      {/* 3. Helper Text: Standard Sans, Very Small (10px), Heavily Muted, Centered with mt-6 */}
      <p className="font-sans text-[10px] text-white/40 text-center max-w-[280px] leading-relaxed mt-6">
        Clean SVGs work best: solid fills, text converted to outlines, no strokes
      </p>

      {/* Active Drag Hint Badge */}
      {isDragging && (
        <div className="absolute inset-x-0 bottom-3 flex justify-center pointer-events-none">
          <span className="text-[10px] font-mono tracking-widest text-white/80 uppercase bg-white/10 px-2.5 py-0.5 rounded-full border border-white/20 animate-pulse">
            Release to drop
          </span>
        </div>
      )}
    </div>
  );
};

export default UploadDropzone;
