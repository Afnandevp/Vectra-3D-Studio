import React from 'react';
import { Environment } from '@react-three/drei';
import { useLogoStore } from '../../store/useLogoStore';

export const SceneEnvironment: React.FC = () => {
  const environment = useLogoStore((s) => s.environment);
  const envIntensity = useLogoStore((s) => s.envIntensity);
  const lightIntensity = useLogoStore((s) => s.lightIntensity);
  const videoBackground = useLogoStore((s) => s.videoBackground);
  const exportProgress = useLogoStore((s) => s.exportProgress);

  // When exporting transparent GIF, don't attach background color so WebGL canvas alpha is 0
  const isTransparentExport = exportProgress.isExporting && exportProgress.format === 'gif';

  const bgColor = videoBackground === 'white' ? '#ffffff' : '#08080a';

  return (
    <>
      {!isTransparentExport && (
        <color attach="background" args={[bgColor]} />
      )}

      {/* HDRI Environment reflection map */}
      <Environment preset={environment} environmentIntensity={envIntensity} />

      {/* Multi-point studio lighting for specular rim highlights */}
      <ambientLight intensity={0.4 * lightIntensity} />
      
      {/* Key Light */}
      <directionalLight
        position={[6, 8, 5]}
        intensity={1.8 * lightIntensity}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      {/* Fill Light (Cool tint) */}
      <directionalLight
        position={[-6, 4, 3]}
        intensity={0.8 * lightIntensity}
        color="#cce0ff"
      />

      {/* Rim Light from behind for edge glints */}
      <directionalLight
        position={[0, -5, -6]}
        intensity={1.5 * lightIntensity}
        color="#ffffff"
      />

      <directionalLight
        position={[0, 6, -4]}
        intensity={1.0 * lightIntensity}
      />
    </>
  );
};
