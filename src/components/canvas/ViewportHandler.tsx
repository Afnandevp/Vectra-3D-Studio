import React, { useEffect } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';

/**
 * ViewportHandler monitors fullscreen state changes, window resizes, and container bounds
 * to force camera projection matrix updates and synchronize WebGL renderer dimensions.
 */
export const ViewportHandler: React.FC = () => {
  const { camera, gl, invalidate } = useThree();

  useEffect(() => {
    const updateViewport = () => {
      const parent = gl.domElement.parentElement;
      if (!parent) return;

      const width = parent.clientWidth;
      const height = parent.clientHeight;

      if (width > 0 && height > 0) {
        // 1. Force WebGL viewport buffer and canvas element size
        gl.setSize(width, height, false);

        // 2. Recalculate camera aspect ratio and projection matrix
        if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
          const persCam = camera as THREE.PerspectiveCamera;
          persCam.aspect = width / height;
          persCam.updateProjectionMatrix();
        } else if ('aspect' in camera) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (camera as any).aspect = width / height;
          camera.updateProjectionMatrix();
        }

        // 3. Invalidate frame to ensure real-time re-render
        invalidate();
      }
    };

    const handleResize = () => {
      // Execute immediately and queue subsequent checks to catch DOM reflow after fullscreen exit
      updateViewport();
      requestAnimationFrame(updateViewport);
      setTimeout(updateViewport, 50);
      setTimeout(updateViewport, 150);
    };

    // Listen to native fullscreen changes and window resizes
    document.addEventListener('fullscreenchange', handleResize);
    document.addEventListener('webkitfullscreenchange', handleResize);
    document.addEventListener('mozfullscreenchange', handleResize);
    document.addEventListener('MSFullscreenChange', handleResize);
    window.addEventListener('resize', handleResize);

    // Also observe the direct parent container via ResizeObserver
    let resizeObserver: ResizeObserver | null = null;
    const parent = gl.domElement.parentElement;
    if (parent && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        handleResize();
      });
      resizeObserver.observe(parent);
    }

    // Initial sync on mount
    handleResize();

    return () => {
      document.removeEventListener('fullscreenchange', handleResize);
      document.removeEventListener('webkitfullscreenchange', handleResize);
      document.removeEventListener('mozfullscreenchange', handleResize);
      document.removeEventListener('MSFullscreenChange', handleResize);
      window.removeEventListener('resize', handleResize);
      if (resizeObserver && parent) {
        resizeObserver.unobserve(parent);
        resizeObserver.disconnect();
      }
    };
  }, [camera, gl, invalidate]);

  return null;
};

export default ViewportHandler;
