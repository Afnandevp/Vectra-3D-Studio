import { useState, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { parseSvgToGeometry, type ParseSvgOptions } from '../utils/svgParser';

export interface UseSvgGeometryOptions extends ParseSvgOptions {
  onError?: (error: Error) => void;
}

/**
 * Custom React hook that compiles an SVG string or URL into an optimized,
 * merged THREE.BufferGeometry using isolated shape extrusions.
 *
 * Geometry calculation is strictly memoized with useMemo so it NEVER
 * recalculates on continuous frame updates or rotations.
 */
export function useSvgGeometry(
  svgSource: string | undefined | null,
  options: UseSvgGeometryOptions = {}
): THREE.BufferGeometry | null {
  const { depth, roundedEdge, curveSegments, targetSize, onError } = options;
  const [asyncSvg, setAsyncSvg] = useState<string | null>(null);

  // Check if svgSource is a URL or file path instead of raw XML
  const isUrl = useMemo(() => {
    if (!svgSource || typeof svgSource !== 'string') return false;
    const trimmed = svgSource.trim();
    return (
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('data:') ||
      trimmed.startsWith('blob:') ||
      (trimmed.endsWith('.svg') && !trimmed.includes('<svg'))
    );
  }, [svgSource]);

  // Asynchronously fetch SVG if a URL was passed
  useEffect(() => {
    if (isUrl && svgSource) {
      let isMounted = true;
      fetch(svgSource)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status} loading SVG from ${svgSource}`);
          return res.text();
        })
        .then((text) => {
          if (isMounted) setAsyncSvg(text);
        })
        .catch((err) => {
          const e = err instanceof Error ? err : new Error(String(err));
          console.error('Failed to load SVG from URL:', e);
          onError?.(e);
        });
      return () => {
        isMounted = false;
      };
    } else {
      setAsyncSvg(null);
    }
  }, [isUrl, svgSource, onError]);

  const activeXml = isUrl ? asyncSvg : svgSource;

  // Memoize geometry creation: only recomputes when SVG or extrusion settings change
  const geometry = useMemo(() => {
    if (!activeXml) return null;
    try {
      return parseSvgToGeometry(activeXml, {
        depth,
        roundedEdge,
        curveSegments,
        targetSize,
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('Geometry creation failure in useSvgGeometry:', error);
      onError?.(error);
      return null;
    }
  }, [activeXml, depth, roundedEdge, curveSegments, targetSize, onError]);

  // Clean up geometry to prevent WebGL memory leaks
  useEffect(() => {
    return () => {
      if (geometry) {
        geometry.dispose();
      }
    };
  }, [geometry]);

  return geometry;
}

export default useSvgGeometry;
