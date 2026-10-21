import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import gifencPkg from 'gifenc';
import { Muxer as Mp4Muxer, ArrayBufferTarget as Mp4ArrayBufferTarget } from 'mp4-muxer';
import { Muxer as WebmMuxer, ArrayBufferTarget as WebmArrayBufferTarget } from 'webm-muxer';

// Accommodate CJS/ESM bundling for gifenc
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const gifenc: any = (gifencPkg as any).GIFEncoder ? gifencPkg : (gifencPkg as any).default || gifencPkg;
const { GIFEncoder, quantize, applyPalette } = gifenc;

export interface ThreeExportContext {
  gl: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.Camera;
  canvas: HTMLCanvasElement;
}

export let activeThreeContext: ThreeExportContext | null = null;
export let activeCanvasElement: HTMLCanvasElement | null = null;
export let activeThreeScene: THREE.Scene | null = null;

export function registerThreeContext(ctx: ThreeExportContext | null) {
  activeThreeContext = ctx;
  activeCanvasElement = ctx?.canvas || null;
  activeThreeScene = ctx?.scene || null;
}

export function registerCanvasElement(canvas: HTMLCanvasElement | null) {
  activeCanvasElement = canvas;
  if (activeThreeContext && !canvas) {
    activeThreeContext.canvas = null as unknown as HTMLCanvasElement;
  }
}

export function registerThreeScene(scene: THREE.Scene | null) {
  activeThreeScene = scene;
  if (activeThreeContext && !scene) {
    activeThreeContext.scene = null as unknown as THREE.Scene;
  }
}

/**
 * Searches the scene for the active 3D logo mesh
 */
export function findLogoMesh(scene: THREE.Scene): THREE.Mesh | null {
  let found: THREE.Mesh | null = null;
  scene.traverse((obj) => {
    if (!found && obj instanceof THREE.Mesh && obj.geometry) {
      found = obj;
    }
  });
  return found;
}

/**
 * Initiates browser download of a generated Blob
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

/**
 * Converts a base64 Data URL to a Uint8Array byte buffer
 */
function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1] || '';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Extracts raw VP8 bitstream payload from a WebP byte buffer
 */
function extractVp8ChunkFromWebP(webpBytes: Uint8Array): Uint8Array | null {
  if (webpBytes.length < 20) return null;
  const fourcc = String.fromCharCode(webpBytes[12], webpBytes[13], webpBytes[14], webpBytes[15]);
  if (fourcc === 'VP8 ') {
    const size = webpBytes[16] | (webpBytes[17] << 8) | (webpBytes[18] << 16) | (webpBytes[19] << 24);
    return webpBytes.subarray(20, 20 + size);
  }
  return null;
}

/**
 * GLB Export: Strictly isolates the 3D logo mesh/group, resets transforms to origin,
 * and exports a clean binary .glb file.
 */
export async function exportGLB(
  meshOrScene: THREE.Object3D,
  fileName: string = 'logo-3d.glb',
  onProgress?: (progress: number, text: string) => void
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      if (!meshOrScene) {
        throw new Error('No 3D mesh object available for GLB export');
      }

      onProgress?.(15, 'Isolating 3D logo geometry...');

      let targetMesh: THREE.Object3D = meshOrScene;
      if (meshOrScene instanceof THREE.Scene) {
        const found = findLogoMesh(meshOrScene);
        if (!found) {
          throw new Error('Could not isolate 3D logo mesh from scene');
        }
        targetMesh = found;
      }

      onProgress?.(30, 'Cloning mesh and resetting origin transforms...');

      const exportTarget = targetMesh.clone(true);
      exportTarget.parent = null;
      exportTarget.position.set(0, 0, 0);
      exportTarget.rotation.set(0, 0, 0);
      exportTarget.scale.set(1, 1, 1);
      exportTarget.updateMatrixWorld(true);

      onProgress?.(55, 'Encoding binary GLTF (.glb)...');

      const exporter = new GLTFExporter();
      exporter.parse(
        exportTarget,
        (gltf) => {
          onProgress?.(90, 'Packaging GLB file...');
          const blob = new Blob([gltf as ArrayBuffer], { type: 'model/gltf-binary' });
          downloadBlob(blob, fileName);
          onProgress?.(100, 'GLB exported successfully!');
          resolve(blob);
        },
        (error) => {
          console.error('Error during GLB export:', error);
          reject(error);
        },
        {
          binary: true,
          embedImages: true,
          truncateDrawRange: true,
        }
      );
    } catch (err) {
      reject(err);
    }
  });
}

export interface TransparentGifOptions {
  context?: ThreeExportContext | null;
  canvas?: HTMLCanvasElement | null;
  mesh?: THREE.Object3D | null;
  spinDuration?: number;
  fps?: number;
  totalFrames?: number;
  width?: number;
  height?: number;
  fileName?: string;
  onProgress?: (progress: number, text: string) => void;
}

/**
 * Deterministic (Offline) Transparent GIF Export:
 * - Decoupled from live browser refresh rate and performance.
 * - Iterates frame-by-frame: manually steps mesh.rotation.y, forces gl.render(scene, camera),
 *   and captures the buffer synchronously with exact dictated frame delay.
 */
export async function exportTransparentGif(
  optionsOrCanvas: TransparentGifOptions | HTMLCanvasElement,
  legacySpinDuration: number = 6,
  legacyFileName: string = 'logo-transparent.gif',
  legacyOnProgress?: (progress: number, text: string) => void
): Promise<Blob> {
  const isOptionsObject = !(optionsOrCanvas instanceof HTMLCanvasElement);
  const options: TransparentGifOptions = isOptionsObject
    ? (optionsOrCanvas as TransparentGifOptions)
    : {
        canvas: optionsOrCanvas as HTMLCanvasElement,
        spinDuration: legacySpinDuration,
        fileName: legacyFileName,
        onProgress: legacyOnProgress,
      };

  const spinDuration = Math.max(1, options.spinDuration || 6);
  const targetFPS = Math.max(10, options.fps || 30);
  const totalFrames = options.totalFrames || Math.round(spinDuration * targetFPS);
  const fileName = options.fileName || 'logo-transparent.gif';
  const onProgress = options.onProgress;
  const targetWidth = options.width || 512;
  const targetHeight = options.height || 512;

  // Resolve Three.js context
  const gl = options.context?.gl || activeThreeContext?.gl;
  const scene = options.context?.scene || activeThreeContext?.scene || activeThreeScene;
  const camera = options.context?.camera || activeThreeContext?.camera;
  const canvas = options.canvas || options.context?.canvas || activeThreeContext?.canvas || activeCanvasElement;

  if (!gl || !scene || !camera || !canvas) {
    throw new Error('Three.js WebGL context is not active or available for rendering');
  }

  let mesh = options.mesh || null;
  if (!mesh) {
    mesh = findLogoMesh(scene);
  }

  onProgress?.(5, 'Preparing deterministic offline GIF capture...');

  const offscreen = document.createElement('canvas');
  offscreen.width = targetWidth;
  offscreen.height = targetHeight;
  const ctx = offscreen.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Failed to acquire 2D rendering context for offscreen canvas');
  }

  // Preserve scene state for guaranteed restoration
  const originalBackground = scene.background;
  const originalClearColor = new THREE.Color();
  gl.getClearColor(originalClearColor);
  const originalClearAlpha = gl.getClearAlpha();
  const originalRotationY = mesh ? mesh.rotation.y : 0;

  // Dictated delay in milliseconds per frame
  const delay = Math.max(10, Math.round(1000 / targetFPS));
  const gif = GIFEncoder();

  try {
    // 1. Transparent background setup
    scene.background = null;
    gl.setClearColor(0x000000, 0);

    // 2. Deterministic frame stepping loop
    for (let i = 0; i < totalFrames; i++) {
      // Exact angle calculation for this frame
      const calculatedAngle = (i / totalFrames) * Math.PI * 2;
      if (mesh) {
        mesh.rotation.y = calculatedAngle;
      }

      // Force synchronous render pass
      gl.render(scene, camera);

      // Clear offscreen canvas
      ctx.clearRect(0, 0, targetWidth, targetHeight);

      // Aspect-ratio preserving square center-crop of WebGL buffer
      const srcW = gl.domElement.width;
      const srcH = gl.domElement.height;
      const minDim = Math.min(srcW, srcH);
      const sx = (srcW - minDim) / 2;
      const sy = (srcH - minDim) / 2;

      ctx.drawImage(gl.domElement, sx, sy, minDim, minDim, 0, 0, targetWidth, targetHeight);

      // Quantize RGBA pixels with 1-bit alpha thresholding
      const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
      const rgba = imgData.data;

      const palette = quantize(rgba, 256, {
        format: 'rgba4444',
        oneBitAlpha: true,
        clearAlpha: true,
      });

      const transparentIndex = palette.findIndex((col: number[]) => col[3] === 0);
      const hasAlpha = transparentIndex !== -1;
      const index = applyPalette(rgba, palette, 'rgba4444');

      // Dictate frame delay to encoder
      gif.writeFrame(index, targetWidth, targetHeight, {
        palette,
        transparent: hasAlpha,
        transparentIndex: hasAlpha ? transparentIndex : 0,
        delay,
        repeat: 0,
      });

      const pct = Math.round(((i + 1) / totalFrames) * 92);
      onProgress?.(pct, `Deterministic GIF: rendering frame ${i + 1}/${totalFrames} (${pct}%)...`);

      // Yield to browser event loop so UI progress updates and stays responsive
      await new Promise((r) => setTimeout(r, 0));
    }

    onProgress?.(95, 'Finalizing GIF stream...');
    gif.finish();

    const bytes = gif.bytes();
    const blob = new Blob([bytes], { type: 'image/gif' });
    downloadBlob(blob, fileName);
    onProgress?.(100, 'Transparent GIF exported successfully!');
    return blob;
  } finally {
    scene.background = originalBackground;
    gl.setClearColor(originalClearColor, originalClearAlpha);
    if (mesh) {
      mesh.rotation.y = originalRotationY;
    }
    gl.render(scene, camera);
  }
}

export interface VideoExportOptions {
  context?: ThreeExportContext | null;
  canvas?: HTMLCanvasElement | null;
  mesh?: THREE.Object3D | null;
  spinDuration?: number;
  fps?: number;
  totalFrames?: number;
  width?: number;
  height?: number;
  bitrate?: number;
  videoBackground?: 'black' | 'white';
  fileName?: string;
  onProgress?: (progress: number, text: string) => void;
}

/**
 * Deterministic (Offline) 60 FPS Video Export:
 * - Eliminates real-time reliance (no canvas.captureStream, no useFrame delta, no requestAnimationFrame timing).
 * - Exact mathematical frame stepping: calculates totalFrames = SpinDuration * TargetFPS (e.g. 360 frames for 6s @ 60fps).
 * - Manually sets logoMesh.rotation.y = (i / totalFrames) * 2 * Math.PI.
 * - Forces gl.render(scene, camera) synchronously and feeds frames directly into the encoder with dictated timestamps.
 * - Silky smooth 60fps guaranteed, regardless of hardware speed or throttling.
 */
export async function exportVideo(
  optionsOrCanvas: VideoExportOptions | HTMLCanvasElement,
  legacySpinDuration: number = 6,
  legacyFileName: string = 'logo-360.mp4',
  legacyOnProgress?: (progress: number, text: string) => void
): Promise<{ blob: Blob; fileName: string }> {
  const isOptionsObject = !(optionsOrCanvas instanceof HTMLCanvasElement);
  const options: VideoExportOptions = isOptionsObject
    ? (optionsOrCanvas as VideoExportOptions)
    : {
        canvas: optionsOrCanvas as HTMLCanvasElement,
        spinDuration: legacySpinDuration,
        fileName: legacyFileName,
        onProgress: legacyOnProgress,
      };

  const spinDuration = Math.max(1, options.spinDuration || 6);
  const targetFPS = Math.max(24, options.fps || 60); // Flawless 60 FPS by default
  const totalFrames = options.totalFrames || Math.round(spinDuration * targetFPS);
  const requestedFileName = options.fileName || 'logo-360.mp4';
  const onProgress = options.onProgress;
  const videoBackground = options.videoBackground || 'black';
  const bitrate = options.bitrate || 10_000_000; // 10 Mbps studio fidelity

  // Even dimensions required for H.264 / AVC video codecs
  const rawWidth = options.width || 1080;
  const rawHeight = options.height || 1080;
  const exportWidth = rawWidth - (rawWidth % 2);
  const exportHeight = rawHeight - (rawHeight % 2);

  const gl = options.context?.gl || activeThreeContext?.gl;
  const scene = options.context?.scene || activeThreeContext?.scene || activeThreeScene;
  const camera = options.context?.camera || activeThreeContext?.camera;
  const canvas = options.canvas || options.context?.canvas || activeThreeContext?.canvas || activeCanvasElement;

  if (!gl || !scene || !camera || !canvas) {
    throw new Error('Three.js WebGL context is not active or available for rendering');
  }

  let mesh = options.mesh || null;
  if (!mesh) {
    mesh = findLogoMesh(scene);
  }

  onProgress?.(5, `Initializing deterministic offline render (${totalFrames} frames @ ${targetFPS} FPS)...`);

  // Offscreen canvas for frame capture
  const offscreen = document.createElement('canvas');
  offscreen.width = exportWidth;
  offscreen.height = exportHeight;
  const ctx = offscreen.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Failed to acquire 2D rendering context for offscreen canvas');
  }

  // Preserve scene state
  const originalBackground = scene.background;
  const originalClearColor = new THREE.Color();
  gl.getClearColor(originalClearColor);
  const originalClearAlpha = gl.getClearAlpha();
  const originalRotationY = mesh ? mesh.rotation.y : 0;

  // Solid background to eliminate anti-aliased dark fringe artifacts
  const bgColorHex = videoBackground === 'white' ? 0xffffff : 0x000000;
  scene.background = new THREE.Color(bgColorHex);
  gl.setClearColor(bgColorHex, 1);

  // Compute crop bounds to center-fit canvas without stretching
  const srcW = gl.domElement.width;
  const srcH = gl.domElement.height;
  const srcAspect = srcW / srcH;
  const targetAspect = exportWidth / exportHeight;
  let cropW = srcW;
  let cropH = srcH;
  if (srcAspect > targetAspect) {
    cropW = srcH * targetAspect;
  } else {
    cropH = srcW / targetAspect;
  }
  const sx = (srcW - cropW) / 2;
  const sy = (srcH - cropH) / 2;

  // Check for WebCodecs VideoEncoder availability
  const hasWebCodecs =
    typeof window !== 'undefined' &&
    typeof (window as any).VideoEncoder !== 'undefined' &&
    typeof (window as any).VideoFrame !== 'undefined';

  try {
    if (hasWebCodecs) {
      // 1. Detect best supported encoder codec
      const candidateConfigs = [
        {
          format: 'mp4' as const,
          muxerCodec: 'avc' as const,
          encoderConfig: {
            codec: 'avc1.42001f', // H.264 Baseline
            width: exportWidth,
            height: exportHeight,
            bitrate,
          },
        },
        {
          format: 'mp4' as const,
          muxerCodec: 'avc' as const,
          encoderConfig: {
            codec: 'avc1.4d002a', // H.264 Main
            width: exportWidth,
            height: exportHeight,
            bitrate,
          },
        },
        {
          format: 'webm' as const,
          muxerCodec: 'V_VP9' as const,
          encoderConfig: {
            codec: 'vp09.00.10.08', // VP9
            width: exportWidth,
            height: exportHeight,
            bitrate,
          },
        },
        {
          format: 'webm' as const,
          muxerCodec: 'V_VP8' as const,
          encoderConfig: {
            codec: 'vp8',
            width: exportWidth,
            height: exportHeight,
            bitrate,
          },
        },
      ];

      let selectedConfig: (typeof candidateConfigs)[0] | null = null;
      for (const cand of candidateConfigs) {
        try {
          const support = await (window as any).VideoEncoder.isConfigSupported(cand.encoderConfig);
          if (support && support.supported) {
            selectedConfig = cand;
            break;
          }
        } catch {
          // Check next candidate
        }
      }

      if (!selectedConfig) {
        // Fallback default
        selectedConfig = candidateConfigs[0];
      }

      const isMp4 = selectedConfig.format === 'mp4';
      const ext = isMp4 ? 'mp4' : 'webm';
      const mimeType = isMp4 ? 'video/mp4' : 'video/webm';
      const finalFileName = requestedFileName.replace(/\.[^/.]+$/, `.${ext}`);

      // Setup MP4 or WebM Muxer
      const muxer = isMp4
        ? new Mp4Muxer({
            target: new Mp4ArrayBufferTarget(),
            video: {
              codec: 'avc',
              width: exportWidth,
              height: exportHeight,
              frameRate: targetFPS,
            },
            fastStart: 'in-memory',
          })
        : new WebmMuxer({
            target: new WebmArrayBufferTarget(),
            video: {
              codec: selectedConfig.muxerCodec,
              width: exportWidth,
              height: exportHeight,
              frameRate: targetFPS,
            },
          });

      let encoderError: Error | null = null;
      const videoEncoder = new (window as any).VideoEncoder({
        output: (chunk: any, meta: any) => muxer.addVideoChunk(chunk, meta),
        error: (err: any) => {
          console.error('VideoEncoder error:', err);
          encoderError = err instanceof Error ? err : new Error(String(err));
        },
      });

      videoEncoder.configure(selectedConfig.encoderConfig);

      // 2. Deterministic offline frame capture loop
      for (let i = 0; i < totalFrames; i++) {
        if (encoderError) throw encoderError;

        // Manually set rotation angle for this exact frame
        const calculatedAngle = (i / totalFrames) * Math.PI * 2;
        if (mesh) {
          mesh.rotation.y = calculatedAngle;
        }

        // Force synchronous render pass
        gl.render(scene, camera);

        // Immediately read WebGL buffer into offscreen canvas
        ctx.clearRect(0, 0, exportWidth, exportHeight);
        ctx.drawImage(gl.domElement, sx, sy, cropW, cropH, 0, 0, exportWidth, exportHeight);

        // Dictate exact timestamp to VideoEncoder (microseconds)
        const timestampUs = Math.round((i / targetFPS) * 1_000_000);
        const videoFrame = new (window as any).VideoFrame(offscreen, { timestamp: timestampUs });
        const isKeyFrame = i % (targetFPS * 2) === 0;

        videoEncoder.encode(videoFrame, { keyFrame: isKeyFrame });
        videoFrame.close();

        // Prevent memory pressure if encoding queues up
        while (videoEncoder.encodeQueueSize > 5) {
          await new Promise((r) => setTimeout(r, 8));
        }

        const pct = Math.round(((i + 1) / totalFrames) * 95);
        onProgress?.(pct, `Offline rendering 60 FPS: frame ${i + 1}/${totalFrames} (${pct}%)...`);

        // Yield to browser event loop
        await new Promise((r) => setTimeout(r, 0));
      }

      onProgress?.(96, 'Finalizing video container...');
      await videoEncoder.flush();
      muxer.finalize();

      const buffer = muxer.target.buffer;
      const videoBlob = new Blob([buffer], { type: mimeType });
      downloadBlob(videoBlob, finalFileName);
      onProgress?.(100, 'Offline video export ready!');
      return { blob: videoBlob, fileName: finalFileName };
    } else {
      // Fallback for browsers without WebCodecs: Deterministic WebP to WebM raw chunk compilation
      const finalFileName = requestedFileName.replace(/\.[^/.]+$/, '.webm');
      const muxer = new WebmMuxer({
        target: new WebmArrayBufferTarget(),
        video: {
          codec: 'V_VP8',
          width: exportWidth,
          height: exportHeight,
          frameRate: targetFPS,
        },
      });

      for (let i = 0; i < totalFrames; i++) {
        const calculatedAngle = (i / totalFrames) * Math.PI * 2;
        if (mesh) {
          mesh.rotation.y = calculatedAngle;
        }

        gl.render(scene, camera);

        ctx.clearRect(0, 0, exportWidth, exportHeight);
        ctx.drawImage(gl.domElement, sx, sy, cropW, cropH, 0, 0, exportWidth, exportHeight);

        const dataUrl = offscreen.toDataURL('image/webp', 0.95);
        const webpBytes = dataUrlToBytes(dataUrl);
        const vp8Payload = extractVp8ChunkFromWebP(webpBytes);

        if (vp8Payload) {
          const timestampUs = Math.round((i / targetFPS) * 1_000_000);
          muxer.addVideoChunkRaw(vp8Payload, 'key', timestampUs);
        }

        const pct = Math.round(((i + 1) / totalFrames) * 95);
        onProgress?.(pct, `Offline rendering frame ${i + 1}/${totalFrames} (${pct}%)...`);

        await new Promise((r) => setTimeout(r, 0));
      }

      onProgress?.(96, 'Finalizing WebM stream...');
      muxer.finalize();

      const buffer = muxer.target.buffer;
      const videoBlob = new Blob([buffer], { type: 'video/webm' });
      downloadBlob(videoBlob, finalFileName);
      onProgress?.(100, 'Offline video export ready!');
      return { blob: videoBlob, fileName: finalFileName };
    }
  } finally {
    // Guaranteed restoration of canvas interactive state
    scene.background = originalBackground;
    gl.setClearColor(originalClearColor, originalClearAlpha);
    if (mesh) {
      mesh.rotation.y = originalRotationY;
    }
    gl.render(scene, camera);
  }
}

/**
 * PNG Snapshot: High-res crisp transparent frame capture
 */
export function exportSnapshotPNG(canvas: HTMLCanvasElement, fileName: string = 'logo-snapshot.png') {
  if (!canvas) return;
  const dataUrl = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => document.body.removeChild(a), 500);
}
