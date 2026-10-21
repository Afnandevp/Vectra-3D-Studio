import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface HowToUseModalProps {
  /** Controls modal visibility */
  isOpen: boolean;
  /** Callback fired to close the modal */
  onClose: () => void;
}

const GUIDE_STEPS = [
  {
    step: '01',
    title: 'PREPARE YOUR SVG',
    detail:
      'Upload a clean vector file. Convert all text to outlines/paths and ensure shapes use solid fills. Avoid strokes, gradients, or clipping masks for clean 3D extrusion.',
  },
  {
    step: '02',
    title: 'TUNE GEOMETRY & MATERIALS',
    detail:
      'Use the left panel to calibrate extrusion depth, bevel radius, and curve smoothness. Select a preset (Liquid Chrome, Cyber Gold, Obsidian Noir) or set a custom specular tint.',
  },
  {
    step: '03',
    title: 'CONFIGURE MOTION & LIGHTING',
    detail:
      'Select studio HDRI lighting for realistic surface reflections. Set the spin duration slider to define the exact 360° animation loop speed.',
  },
  {
    step: '04',
    title: 'VERIFY ACCESS & EXPORT',
    detail:
      'Connect your wallet via Web3Auth. Holders of $VCT, ecosystem tokens (Chog, Spark, Vibe, RH Stocks), or testnet ETH unlock studio exports (GLB 3D model, 60 FPS MP4, and transparent GIF).',
  },
] as const;

export const HowToUseModal: React.FC<HowToUseModalProps> = ({ isOpen, onClose }) => {
  // Prevent background scrolling and attach Escape key listener
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Modal Card Container: Guaranteed vertical/horizontal centering & max height limits */}
      <div
        className="relative w-full max-w-lg max-h-[88vh] flex flex-col bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl my-auto overflow-hidden select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed Header (Never scrolls away) */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-white/[0.06] shrink-0">
          <div>
            <div className="font-mono text-[11px] tracking-widest text-white/40 uppercase">
              GUIDE // HOW TO USE
            </div>
            <h2 className="text-sm font-semibold text-white mt-0.5">
              Creating & Exporting 3D Spatial Logos
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors p-1 rounded-md hover:bg-white/[0.05] cursor-pointer shrink-0"
            title="Close guide"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body (Holds all 4 steps) */}
        <div className="p-6 space-y-3 overflow-y-auto overscroll-contain">
          {GUIDE_STEPS.map((s) => (
            <div
              key={s.step}
              className="bg-white/[0.02] border border-white/5 rounded-lg p-3.5 flex gap-3.5 items-start"
            >
              <span className="font-mono text-xs font-semibold text-white/40 tracking-wider shrink-0 mt-0.5">
                {s.step}
              </span>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="font-mono text-xs font-semibold text-white/90 tracking-wide uppercase">
                  {s.title}
                </span>
                <p className="text-xs text-white/60 leading-relaxed font-sans mt-0.5">
                  {s.detail}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Fixed Footer / Dismiss Button */}
        <div className="p-6 pt-3 border-t border-white/[0.06] shrink-0 bg-[#0A0A0A]">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-white text-black text-xs font-semibold rounded-lg hover:bg-white/90 transition-colors cursor-pointer select-none shadow-sm"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default HowToUseModal;
