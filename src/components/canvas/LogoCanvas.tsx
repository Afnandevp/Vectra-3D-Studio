import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { SceneEnvironment } from './SceneEnvironment';
import { ExtrudedLogo } from './ExtrudedLogo';
import { ViewportHandler } from './ViewportHandler';
import { registerThreeContext } from '../../utils/exportEngines';
import { useLogoStore } from '../../store/useLogoStore';

export { ViewportHandler } from './ViewportHandler';

const CanvasConnector: React.FC = () => {
  const { gl, scene, camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const cameraResetKey = useLogoStore((s) => s.cameraResetKey);

  useEffect(() => {
    registerThreeContext({
      gl,
      scene,
      camera,
      canvas: gl.domElement,
    });
    return () => {
      registerThreeContext(null);
    };
  }, [gl, scene, camera]);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.reset();
      camera.position.set(0, 0, 7);
      camera.lookAt(0, 0, 0);
    }
  }, [cameraResetKey, camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      minDistance={2.5}
      maxDistance={16}
    />
  );
};

export const LogoCanvas: React.FC = () => {
  return (
    // Strictly bounded container conforming to flex/grid layout without fixed heights/widths
    <div className="relative w-full h-full flex-1 overflow-hidden min-w-0 min-h-0 select-none">
      <Canvas
        camera={{ position: [0, 0, 7], fov: 42 }}
        dpr={[1, 2]}
        gl={{
          preserveDrawingBuffer: true,
          alpha: true,
          antialias: true,
          premultipliedAlpha: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
        }}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
      >
        {/* Handles fullscreen transitions, window resizes, and camera projection updates */}
        <ViewportHandler />
        <SceneEnvironment />
        <ExtrudedLogo />
        <CanvasConnector />
      </Canvas>
    </div>
  );
};

export default LogoCanvas;
