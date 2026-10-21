import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Maximize2,
  Box,
  HelpCircle
} from 'lucide-react';
import { useLogoStore } from '../../store/useLogoStore';
import { PRESET_SVGS } from '../../constants/presets';
import { HeaderAuth } from './HeaderAuth';
import { HowToUseModal } from './HowToUseModal';

export const Header: React.FC = () => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const isSpinning = useLogoStore((s) => s.isSpinning);
  const toggleSpinning = useLogoStore((s) => s.toggleSpinning);
  const resetCamera = useLogoStore((s) => s.resetCamera);
  const spinDuration = useLogoStore((s) => s.spinDuration);
  const selectedSvgPresetId = useLogoStore((s) => s.selectedSvgPresetId);
  const selectSvgPreset = useLogoStore((s) => s.selectSvgPreset);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  return (
    <header className="w-full h-14 md:h-16 px-6 bg-[#0A0A0A]/85 backdrop-blur-md border-b border-white/[0.06] flex items-center justify-between gap-4 z-40 select-none min-w-0 flex-shrink-0">
      {/* 1. Left: Brand */}
      <div className="flex items-center shrink-0 min-w-max select-none gap-2">
        <div className="w-5 h-5 rounded bg-white/[0.06] border border-white/10 flex items-center justify-center text-white/80 shrink-0">
          <Box className="w-3 h-3 text-white/90" />
        </div>
        <div className="flex items-center">
          <span className="text-white font-bold text-sm tracking-widest uppercase">
            VECTRA
          </span>
          <span className="text-white/30 mx-1.5 select-none">
            /
          </span>
          <span className="text-[10px] tracking-[0.2em] font-mono text-white/50 font-medium uppercase">
            3D STUDIO
          </span>
        </div>
      </div>

      {/* 2. Center: Preset Carousel/Tabs (The scrollable wrapper) */}
      <div className="flex-1 min-w-0 max-w-[45vw] md:max-w-[50vw] flex items-center overflow-x-auto flex-nowrap scrollbar-none px-2 gap-1.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {PRESET_SVGS.map((p) => {
          const isActive = selectedSvgPresetId === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => selectSvgPreset(p)}
              className={`shrink-0 whitespace-nowrap px-3.5 py-1.5 rounded-lg font-mono text-[11px] tracking-wider transition-all cursor-pointer select-none ${
                isActive
                  ? 'bg-white/[0.04] text-white border border-white/10'
                  : 'border border-transparent text-white/50 hover:text-white/80 hover:bg-white/[0.02]'
              }`}
            >
              {p.name}
            </button>
          );
        })}
      </div>

      {/* 3. Right: Actions & Wallet Controls */}
      <div className="flex items-center gap-3 shrink-0 ml-auto">
        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={toggleSpinning}
          className="px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-md flex items-center gap-2 text-xs text-white/80 shrink-0 hover:bg-white/[0.06] hover:text-white transition-colors"
          title={isSpinning ? 'Pause continuous spin' : 'Start continuous spin'}
        >
          {isSpinning ? (
            <Pause className="w-3.5 h-3.5 fill-current text-white/90 shrink-0" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current text-white/70 shrink-0" />
          )}
          <span>{isSpinning ? 'Pause' : 'Spin'}</span>
          <span className="font-mono text-[10px] text-white/40">({spinDuration}s)</span>
        </button>

        {/* Utility Icons (Camera Reset & Fullscreen) */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={resetCamera}
            className="p-1.5 rounded-md hover:bg-white/[0.06] text-white/40 hover:text-white transition-colors"
            title="Reset Camera View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 rounded-md hover:bg-white/[0.06] text-white/40 hover:text-white transition-colors hidden sm:block"
            title="Toggle Fullscreen Mode"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* How to Use Guide Button */}
        <button
          type="button"
          onClick={() => setIsHelpOpen(true)}
          className="px-3 py-1.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] rounded-full text-xs text-white/70 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          title="How to Use Guide"
        >
          <HelpCircle className="w-3.5 h-3.5 text-white/60 shrink-0" />
          <span>How to Use</span>
        </button>

        {/* Dedicated Fixed Wrapper for Wallet Button */}
        <div className="shrink-0 flex items-center">
          <HeaderAuth />
        </div>
      </div>

      {/* How to Use Instructions Modal */}
      <HowToUseModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </header>
  );
};

export default Header;
