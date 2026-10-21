import React, { useRef, useEffect, Component } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useLogoStore } from '../../store/useLogoStore';
import { useSvgGeometry } from '../../hooks/useSvgGeometry';

// Re-export hook for convenience
export { useSvgGeometry } from '../../hooks/useSvgGeometry';

export interface SvgMeshProps {
  /** Raw SVG string or URL to an .svg file (falls back to Zustand store if omitted) */
  svg?: string;
  /** Extrusion depth (0-100 percentage slider) */
  depth?: number;
  /** Bevel size and thickness (0-100 percentage slider) */
  roundedEdge?: number;
  /** Smoothness of bezier curves (default: 32) */
  curveSegments?: number;
  /** Hex color or Three.js color */
  color?: string;
  /** Metalness (0.0 to 1.0) */
  metalness?: number;
  /** Roughness (0.0 to 1.0) */
  roughness?: number;
  /** Whether the mesh spins on Y-axis */
  isSpinning?: boolean;
  /** Duration for 1 full 360 rotation in seconds */
  spinDuration?: number;
  /** Optional custom material element to override default Physical Chrome */
  material?: React.ReactNode;
  /** Enable cast shadow */
  castShadow?: boolean;
  /** Enable receive shadow */
  receiveShadow?: boolean;
  /** Callback fired when new geometry is successfully compiled */
  onGeometryLoaded?: (geom: THREE.BufferGeometry) => void;
  /** Callback fired when mesh is mounted or unmounted */
  onMeshReady?: (mesh: THREE.Mesh | null) => void;
  /** Callback fired if geometry creation fails */
  onError?: (err: Error) => void;
}

/**
 * Robust Error Boundary to catch any WebGL triangulation or rendering failure
 * without unmounting the parent 3D canvas.
 */
interface ErrorBoundaryProps {
  children: React.ReactNode;
  onError?: (err: Error) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class SvgErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error) {
    console.error('SvgMesh ErrorBoundary caught:', error);
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      // Non-crashing wireframe placeholder in the 3D scene
      return (
        <group>
          <mesh>
            <boxGeometry args={[2, 2, 0.4]} />
            <meshStandardMaterial color="#ef4444" wireframe />
          </mesh>
        </group>
      );
    }
    return this.props.children;
  }
}

/**
 * Inner mesh component that performs memoized SVG parsing, isolated extrusion,
 * and continuous real-time Y-axis spin.
 */
export const SvgMeshInner: React.FC<SvgMeshProps> = ({
  svg: propSvg,
  depth: propDepth,
  roundedEdge: propRoundedEdge,
  curveSegments: propCurveSegments = 32,
  color: propColor,
  metalness: propMetalness,
  roughness: propRoughness,
  isSpinning: propIsSpinning,
  spinDuration: propSpinDuration,
  material,
  castShadow = true,
  receiveShadow = true,
  onGeometryLoaded,
  onMeshReady,
  onError,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Connect to Zustand store for any props that were not explicitly passed
  const storeSvg = useLogoStore((s) => s.svgContent);
  const storeDepth = useLogoStore((s) => s.depth);
  const storeRoundedEdge = useLogoStore((s) => s.roundedEdge);
  const storeCurveSegments = useLogoStore((s) => s.curveSegments);
  const storeColor = useLogoStore((s) => s.color);
  const storeMetalness = useLogoStore((s) => s.metalness);
  const storeRoughness = useLogoStore((s) => s.roughness);
  const storeIsSpinning = useLogoStore((s) => s.isSpinning);
  const storeSpinDuration = useLogoStore((s) => s.spinDuration);
  const isExporting = useLogoStore((s) => s.exportProgress.isExporting);

  const effectiveSvg = propSvg ?? storeSvg;
  const effectiveDepth = propDepth ?? storeDepth;
  const effectiveRoundedEdge = propRoundedEdge ?? storeRoundedEdge;
  const effectiveCurveSegments = propCurveSegments ?? storeCurveSegments ?? 32;
  const effectiveColor = propColor ?? storeColor;
  const effectiveMetalness = propMetalness ?? storeMetalness;
  const effectiveRoughness = propRoughness ?? storeRoughness;
  const effectiveIsSpinning = propIsSpinning ?? storeIsSpinning;
  const effectiveSpinDuration = propSpinDuration ?? storeSpinDuration;

  // Memoized isolated extrusion geometry via useSvgGeometry
  const geometry = useSvgGeometry(effectiveSvg, {
    depth: effectiveDepth,
    roundedEdge: effectiveRoundedEdge,
    curveSegments: effectiveCurveSegments,
    onError,
  });

  // Notify parent when geometry changes
  useEffect(() => {
    if (geometry) {
      onGeometryLoaded?.(geometry);
    }
  }, [geometry, onGeometryLoaded]);

  // Register mesh reference for GLB export
  useEffect(() => {
    if (meshRef.current) {
      onMeshReady?.(meshRef.current);
    }
    return () => {
      onMeshReady?.(null);
    };
  }, [geometry, onMeshReady]);

  // Y-axis continuous rotation animation linked to spinDuration (pauses cleanly during frame exports)
  useFrame((_, delta) => {
    if (isExporting || !meshRef.current || !effectiveIsSpinning || effectiveSpinDuration <= 0) return;
    const angularSpeed = (Math.PI * 2) / effectiveSpinDuration;
    meshRef.current.rotation.y = (meshRef.current.rotation.y + delta * angularSpeed) % (Math.PI * 2);
  });

  if (!geometry) {
    return null;
  }

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
    >
      {material ? (
        material
      ) : (
        <meshPhysicalMaterial
          color={effectiveColor}
          metalness={effectiveMetalness}
          roughness={effectiveRoughness}
          reflectivity={1.0}
          envMapIntensity={2.2}
          side={THREE.DoubleSide}
        />
      )}
    </mesh>
  );
};

/**
 * Top-level SvgMesh component wrapped with ErrorBoundary for bulletproof stability
 */
export const SvgMesh: React.FC<SvgMeshProps> = (props) => {
  return (
    <SvgErrorBoundary onError={props.onError}>
      <SvgMeshInner {...props} />
    </SvgErrorBoundary>
  );
};

export default SvgMesh;
