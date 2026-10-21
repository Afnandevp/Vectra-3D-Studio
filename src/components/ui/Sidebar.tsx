import React, { useRef, useState } from 'react';
import { 
  Box, 
  Sparkles, 
  Sun, 
  RotateCw, 
  Download, 
  FileCode, 
  Video, 
  Image as ImageIcon,
  Camera, 
  Upload, 
  Sliders, 
  Palette,
  Loader2
} from 'lucide-react';
import { useLogoStore } from '../../store/useLogoStore';
import { SliderControl } from './Controls/SliderControl';
import { DropdownControl } from './Controls/DropdownControl';
import { ColorPickerControl } from './Controls/ColorPickerControl';
import { ENVIRONMENT_OPTIONS, MATERIAL_PRESETS } from '../../constants/presets';
import { 
  exportGLB, 
  exportVideo, 
  exportTransparentGif, 
  exportSnapshotPNG, 
  activeCanvasElement,
  activeThreeContext,
  findLogoMesh,
} from '../../utils/exportEngines';
import { logoMeshObject } from '../canvas/ExtrudedLogo';
import { isValidSvgString } from '../../utils/svgParser';
import { useTokenGate } from '../../hooks/useTokenGate';
import { ExportGateModal } from './ExportGateModal';

export const Sidebar: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Web3 3-Chain Token-Gating State (Robinhood, Monad, Base)
  const { hasAccess } = useTokenGate();
  const [isGateModalOpen, setIsGateModalOpen] = useState(false);
  const [pendingExportFormat, setPendingExportFormat] = useState<'glb' | 'mp4' | 'gif' | 'png' | null>(null);

  const triggerGuardedExport = (format: 'glb' | 'mp4' | 'gif' | 'png', exportAction: () => void) => {
    if (!hasAccess) {
      setPendingExportFormat(format);
      setIsGateModalOpen(true);
      return;
    }
    exportAction();
  };

  // Zustand Store Selectors
  const depth = useLogoStore((s) => s.depth);
  const roundedEdge = useLogoStore((s) => s.roundedEdge);
  const curveSegments = useLogoStore((s) => s.curveSegments);
  const chrome = useLogoStore((s) => s.chrome);
  const color = useLogoStore((s) => s.color);
  
  const environment = useLogoStore((s) => s.environment);
  const spinDuration = useLogoStore((s) => s.spinDuration);
  const videoBackground = useLogoStore((s) => s.videoBackground);
  const selectedMaterialPresetId = useLogoStore((s) => s.selectedMaterialPresetId);
  const exportProgress = useLogoStore((s) => s.exportProgress);
  const svgName = useLogoStore((s) => s.svgName);

  // Store Setters
  const setDepth = useLogoStore((s) => s.setDepth);
  const setRoundedEdge = useLogoStore((s) => s.setRoundedEdge);
  const setCurveSegments = useLogoStore((s) => s.setCurveSegments);
  const setChrome = useLogoStore((s) => s.setChrome);
  const setColor = useLogoStore((s) => s.setColor);
  const setEnvironment = useLogoStore((s) => s.setEnvironment);
  const setSpinDuration = useLogoStore((s) => s.setSpinDuration);
  const setVideoBackground = useLogoStore((s) => s.setVideoBackground);
  const applyMaterialPreset = useLogoStore((s) => s.applyMaterialPreset);
  const setExportProgress = useLogoStore((s) => s.setExportProgress);
  const setSvgContent = useLogoStore((s) => s.setSvgContent);

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (isValidSvgString(content)) {
        setSvgContent(content, file.name);
      } else {
        alert('Please upload a valid SVG vector file containing vector paths.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Export Trigger Actions
  const handleExportGLB = async () => {
    const mesh = logoMeshObject || (activeThreeContext?.scene ? findLogoMesh(activeThreeContext.scene) : null);
    if (!mesh) {
      alert('Logo mesh is still rendering. Please try again.');
      return;
    }
    try {
      setExportProgress({
        isExporting: true,
        format: 'glb',
        progress: 10,
        statusText: 'Preparing 3D geometry...',
      });
      const name = svgName.replace(/\.[^/.]+$/, '');
      await exportGLB(mesh, `${name}-3d.glb`, (pct: number, txt: string) => {
        setExportProgress({ progress: pct, statusText: txt });
      });
      setTimeout(() => {
        setExportProgress({ isExporting: false, progress: 0, statusText: '' });
      }, 1500);
    } catch (err) {
      console.error(err);
      alert('Failed to export GLB model.');
      setExportProgress({ isExporting: false, progress: 0, statusText: '' });
    }
  };

  const handleExportMP4 = async () => {
    if (!activeCanvasElement && !activeThreeContext) {
      alert('WebGL Canvas not active.');
      return;
    }
    try {
      setExportProgress({
        isExporting: true,
        format: 'mp4',
        progress: 5,
        statusText: 'Initializing video recording...',
      });
      const name = svgName.replace(/\.[^/.]+$/, '');
      await exportVideo({
        context: activeThreeContext,
        canvas: activeCanvasElement,
        mesh: logoMeshObject,
        spinDuration,
        videoBackground,
        fileName: `${name}-360.mp4`,
        onProgress: (pct: number, txt: string) => {
          setExportProgress({ progress: pct, statusText: txt });
        },
      });
      setTimeout(() => {
        setExportProgress({ isExporting: false, progress: 0, statusText: '' });
      }, 1500);
    } catch (err) {
      console.error(err);
      alert('Video recording failed.');
      setExportProgress({ isExporting: false, progress: 0, statusText: '' });
    }
  };

  const handleExportGIF = async () => {
    if (!activeCanvasElement && !activeThreeContext) {
      alert('WebGL Canvas not active.');
      return;
    }
    try {
      setExportProgress({
        isExporting: true,
        format: 'gif',
        progress: 5,
        statusText: 'Capturing alpha frames...',
      });
      const name = svgName.replace(/\.[^/.]+$/, '');
      await exportTransparentGif({
        context: activeThreeContext,
        canvas: activeCanvasElement,
        mesh: logoMeshObject,
        spinDuration,
        fileName: `${name}-transparent.gif`,
        onProgress: (pct: number, txt: string) => {
          setExportProgress({ progress: pct, statusText: txt });
        },
      });
      setTimeout(() => {
        setExportProgress({ isExporting: false, progress: 0, statusText: '' });
      }, 1500);
    } catch (err) {
      console.error(err);
      alert('Transparent GIF encoding failed.');
      setExportProgress({ isExporting: false, progress: 0, statusText: '' });
    }
  };

  const handleExportSnapshot = () => {
    if (!activeCanvasElement) return;
    const name = svgName.replace(/\.[^/.]+$/, '');
    exportSnapshotPNG(activeCanvasElement, `${name}-snapshot.png`);
  };

  return (
    <aside className="w-[380px] h-full flex-shrink-0 flex flex-col bg-[#0A0A0A] border-r border-white/[0.04] z-20 text-white/85 select-none font-sans">
      {/* 1. Sidebar Header */}
      <div className="h-[48px] px-5 border-b border-white/[0.04] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-white/50" />
          <h2 className="text-[11px] font-semibold tracking-[0.12em] text-white/90 uppercase">
            Controls & Tuning
          </h2>
        </div>
        
        {/* Upload SVG Trigger */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-md bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] text-white/70 hover:text-white transition-all"
          title="Upload custom SVG"
        >
          <Upload className="w-3 h-3 text-white/60" />
          <span>Upload SVG</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".svg"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* 2. Export Live Progress Notification (if exporting) */}
      {exportProgress.isExporting && (
        <div className="px-5 py-2.5 bg-white/[0.03] border-b border-white/[0.05] flex flex-col gap-1.5 animate-fadeIn flex-shrink-0">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-2 text-white/90 font-medium">
              <Loader2 className="w-3 h-3 animate-spin text-white/70" />
              <span>Exporting {exportProgress.format?.toUpperCase()}</span>
            </span>
            <span className="font-mono text-white/60 font-semibold">{exportProgress.progress}%</span>
          </div>
          <div className="w-full bg-white/[0.05] rounded-full h-[2px] overflow-hidden">
            <div
              className="bg-white/80 h-full transition-all duration-150"
              style={{ width: `${exportProgress.progress}%` }}
            />
          </div>
          <p className="text-[10px] text-white/40 truncate">{exportProgress.statusText}</p>
        </div>
      )}

      {/* 3. Scrollable Control Body with standardized gap-7 vertical rhythm and pb-10 bottom padding */}
      <div className="flex-1 overflow-y-auto p-5 pb-10 flex flex-col gap-7">

        {/* Section: Material Presets (Refined flat cards) */}
        <div>
          <div className="text-[10px] tracking-[0.15em] uppercase text-white/40 font-semibold mb-3 flex items-center gap-1.5">
            <Palette className="w-3 h-3 text-white/40" />
            <span>Material Presets</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {MATERIAL_PRESETS.map((p) => {
              const isActive = selectedMaterialPresetId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyMaterialPreset(p)}
                  className={`p-2 rounded-md text-left transition-all flex flex-col gap-0.5 ${
                    isActive
                      ? 'bg-white/[0.07] border border-white/20 ring-1 ring-white/20 text-white'
                      : 'bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] text-white/50 hover:text-white/85'
                  }`}
                >
                  <div className="text-[12px] font-medium truncate leading-tight">{p.name}</div>
                  <div className="text-[9px] text-white/30 font-mono uppercase tracking-wider">{p.badge}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section: Geometry */}
        <div className="flex flex-col gap-4">
          <div className="text-[10px] tracking-[0.15em] uppercase text-white/40 font-semibold mb-1 flex items-center gap-1.5">
            <Box className="w-3 h-3 text-white/40" />
            <span>Geometry</span>
          </div>

          <SliderControl
            label="Depth"
            value={depth}
            min={5}
            max={100}
            onChange={setDepth}
            description="Extrusion thickness along the Z-axis"
          />

          <SliderControl
            label="Rounded edge"
            value={roundedEdge}
            min={0}
            max={100}
            onChange={setRoundedEdge}
            description="Bevel curvature and smoothness on logo silhouette"
          />

          <SliderControl
            label="Curve Smoothness"
            value={curveSegments}
            min={16}
            max={64}
            step={8}
            unit=" seg"
            onChange={setCurveSegments}
            description="Bezier subdivision quality (32 to 64 for sharp curves)"
          />
        </div>

        {/* Section: Material & Color */}
        <div className="flex flex-col gap-4">
          <div className="text-[10px] tracking-[0.15em] uppercase text-white/40 font-semibold mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-white/40" />
            <span>Material & Color</span>
          </div>

          <SliderControl
            label="Chrome"
            value={chrome}
            min={0}
            max={100}
            onChange={setChrome}
            description="Metalness (100%) and mirror polish roughness (0%)"
          />

          <ColorPickerControl
            label="Specular Color"
            value={color}
            onChange={setColor}
            description="Base specular tint (pure white for liquid silver)"
          />
        </div>

        {/* Section: Lighting & HDRI */}
        <div className="flex flex-col gap-4">
          <div className="text-[10px] tracking-[0.15em] uppercase text-white/40 font-semibold mb-1 flex items-center gap-1.5">
            <Sun className="w-3 h-3 text-white/40" />
            <span>Lighting & HDRI</span>
          </div>

          <DropdownControl
            label="Environment"
            value={environment}
            options={ENVIRONMENT_OPTIONS.map((env) => ({
              value: env.id,
              label: env.label,
              sublabel: env.description,
            }))}
            onChange={setEnvironment}
            description="Studio environment map for realistic reflections"
          />
        </div>

        {/* Section: Motion & Scene */}
        <div className="flex flex-col gap-4">
          <div className="text-[10px] tracking-[0.15em] uppercase text-white/40 font-semibold mb-1 flex items-center gap-1.5">
            <RotateCw className="w-3 h-3 text-white/40" />
            <span>Motion & Scene</span>
          </div>

          <SliderControl
            label="Spin duration"
            value={spinDuration}
            min={2}
            max={20}
            step={0.5}
            unit="s"
            onChange={setSpinDuration}
            description="Duration for one complete 360° rotation loop"
          />

          <DropdownControl
            label="Video background"
            value={videoBackground}
            options={[
              { value: 'black', label: 'Solid Black (#000000)' },
              { value: 'white', label: 'Solid White (#FFFFFF)' },
            ]}
            onChange={setVideoBackground}
            description="Background for video export (GIFs remain transparent)"
          />
        </div>

        {/* Section: Export Suite */}
        <div>
          <div className="text-[10px] tracking-[0.15em] uppercase text-white/40 font-semibold mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Download className="w-3 h-3 text-white/40" />
              <span>Export Suite</span>
            </div>
            {hasAccess ? (
              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 lowercase">
                verified
              </span>
            ) : (
              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-white/[0.03] text-white/40 border border-white/[0.06] lowercase">
                verification required
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={exportProgress.isExporting}
              onClick={() => triggerGuardedExport('glb', handleExportGLB)}
              className="flex items-center gap-2.5 p-2.5 rounded-md bg-white/[0.02] border border-white/[0.05] hover:border-white/15 hover:bg-white/[0.04] text-white/70 hover:text-white transition-all text-[12px] group disabled:opacity-30"
            >
              <div className="w-6 h-6 rounded bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-white/60 group-hover:text-white transition-colors">
                <FileCode className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <div className="text-white/85 font-medium leading-tight">.GLB Model</div>
                <div className="text-[10px] text-white/35 font-mono">Universal 3D</div>
              </div>
            </button>

            <button
              type="button"
              disabled={exportProgress.isExporting}
              onClick={() => triggerGuardedExport('mp4', handleExportMP4)}
              className="flex items-center gap-2.5 p-2.5 rounded-md bg-white/[0.02] border border-white/[0.05] hover:border-white/15 hover:bg-white/[0.04] text-white/70 hover:text-white transition-all text-[12px] group disabled:opacity-30"
            >
              <div className="w-6 h-6 rounded bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-white/60 group-hover:text-white transition-colors">
                <Video className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <div className="text-white/85 font-medium leading-tight">.MP4 Video</div>
                <div className="text-[10px] text-white/35 font-mono">60 FPS 1-Loop</div>
              </div>
            </button>

            <button
              type="button"
              disabled={exportProgress.isExporting}
              onClick={() => triggerGuardedExport('gif', handleExportGIF)}
              className="flex items-center gap-2.5 p-2.5 rounded-md bg-white/[0.02] border border-white/[0.05] hover:border-white/15 hover:bg-white/[0.04] text-white/70 hover:text-white transition-all text-[12px] group disabled:opacity-30"
            >
              <div className="w-6 h-6 rounded bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-white/60 group-hover:text-white transition-colors">
                <ImageIcon className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <div className="text-white/85 font-medium leading-tight">.GIF Alpha</div>
                <div className="text-[10px] text-white/35 font-mono">Transparent</div>
              </div>
            </button>

            <button
              type="button"
              disabled={exportProgress.isExporting}
              onClick={() => triggerGuardedExport('png', handleExportSnapshot)}
              className="flex items-center gap-2.5 p-2.5 rounded-md bg-white/[0.02] border border-white/[0.05] hover:border-white/15 hover:bg-white/[0.04] text-white/70 hover:text-white transition-all text-[12px] group disabled:opacity-30"
            >
              <div className="w-6 h-6 rounded bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-white/60 group-hover:text-white transition-colors">
                <Camera className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <div className="text-white/85 font-medium leading-tight">.PNG Frame</div>
                <div className="text-[10px] text-white/35 font-mono">Still Image</div>
              </div>
            </button>
          </div>
        </div>

      </div>

      {/* Web3 Token-Gated Export Interception Modal */}
      <ExportGateModal
        isOpen={isGateModalOpen}
        onClose={() => {
          setIsGateModalOpen(false);
          setPendingExportFormat(null);
        }}
        targetFormat={pendingExportFormat}
        onAuthorized={() => {
          if (pendingExportFormat === 'glb') handleExportGLB();
          else if (pendingExportFormat === 'mp4') handleExportMP4();
          else if (pendingExportFormat === 'gif') handleExportGIF();
          else if (pendingExportFormat === 'png') handleExportSnapshot();
          setPendingExportFormat(null);
        }}
      />
    </aside>
  );
};

export default Sidebar;
