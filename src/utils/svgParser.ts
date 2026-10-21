import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export interface ParseSvgOptions {
  depth?: number;          // 0 to 100 percentage slider (default: 20)
  roundedEdge?: number;    // 0 to 100 percentage slider (default: 15)
  curveSegments?: number;  // 32 to 64 for silky smooth curves (default: 32)
  targetSize?: number;     // Canonical target scale in Three.js units (default: 4.0)
}

/**
 * Checks whether a path is explicitly stroke-only or completely transparent
 */
function isStrokeOnlyPath(path: THREE.ShapePath): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const style = path.userData?.style as Record<string, any> | undefined;
  if (!style) return false;
  const fill = style.fill;
  const fillOpacity = style.fillOpacity;
  if (fill === 'none' || fill === 'transparent') return true;
  if (typeof fillOpacity === 'number' && fillOpacity === 0) return true;
  return false;
}

/**
 * Parses SVG XML string and generates a unified, clean THREE.BufferGeometry
 * using an isolated extrusion pipeline to avoid Earcut cross-path triangulation collapse.
 */
export function parseSvgToGeometry(
  svgString: string,
  options: ParseSvgOptions = {}
): THREE.BufferGeometry | null {
  try {
    if (!svgString || typeof svgString !== 'string') {
      return null;
    }

    const curveSegments = options.curveSegments ?? 32;
    const targetSize = options.targetSize ?? 4.0;
    const rawDepth = options.depth ?? 20;
    const rawRoundedEdge = options.roundedEdge ?? 15;

    // 1. Parse SVG XML into SVGLoader data structure
    const loader = new SVGLoader();
    const svgData = loader.parse(svgString);
    const paths = svgData.paths;

    if (!paths || paths.length === 0) {
      console.warn('SVG parsing: No <path> elements found in SVG.');
      return null;
    }

    // 2. Advanced Path & Shape Extraction
    // Extract shapes PER PATH using SVGLoader.createShapes(path) to isolate compound subpaths
    // and correctly apply SVG fill-rule (evenodd / nonzero) for each path
    const extractedShapes: THREE.Shape[] = [];

    for (const path of paths) {
      // Gracefully ignore paths that are stroke-only with no fill
      if (isStrokeOnlyPath(path)) continue;

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pathShapes: THREE.Shape[] = path.toShapes
          ? path.toShapes()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          : (SVGLoader as any).createShapes(path);

        if (Array.isArray(pathShapes)) {
          for (const s of pathShapes) {
            if (s && s.curves && s.curves.length > 0) {
              extractedShapes.push(s);
            }
          }
        }
      } catch (pathErr) {
        console.warn('Skipping path due to shape extraction error:', pathErr);
      }
    }

    if (extractedShapes.length === 0) {
      console.warn('SVG parsing: No valid filled shapes extracted.');
      return null;
    }

    // 3. Compute tight 2D bounding box across all extracted shapes in SVG coordinate space
    const globalBBox = new THREE.Box2();
    for (const shape of extractedShapes) {
      const pts = shape.getPoints(curveSegments);
      for (const pt of pts) globalBBox.expandByPoint(pt);
      for (const h of shape.holes) {
        const hPts = h.getPoints(curveSegments);
        for (const pt of hPts) globalBBox.expandByPoint(pt);
      }
    }

    const bboxSize = new THREE.Vector2();
    globalBBox.getSize(bboxSize);
    const maxDimension = Math.max(bboxSize.x, bboxSize.y);

    if (maxDimension <= 0.0001) {
      return null;
    }

    // Scale factor to map SVG pixel space to canonical 3D world space (targetSize)
    const scale = targetSize / maxDimension;

    // Convert UI slider percentage (0-100) to 3D world units, then back to SVG units
    const worldDepth = 0.08 + (Math.max(0, Math.min(100, rawDepth)) / 100) * 1.1; // 0.08 to 1.18 world units
    const svgDepth = worldDepth / scale;

    const bevelRatio = Math.max(0, Math.min(100, rawRoundedEdge)) / 100;
    const worldBevel = bevelRatio * 0.12; // max 0.12 world units
    const baseSvgBevel = worldBevel / scale;
    const isBevelRequested = bevelRatio > 0.01;

    // 4. Isolated Extrusion Pipeline
    // Crucial: We NEVER pass the entire shapes array into a single ExtrudeGeometry call!
    // Passing disconnected shapes (text, rings, logos) together causes Earcut to bridge
    // empty space between disconnected paths and produce stretched polygon artifacts.
    // Instead, we extrude each shape in complete isolation, clamping bevels individually.
    const geometries: THREE.BufferGeometry[] = [];

    for (const shape of extractedShapes) {
      try {
        // Measure this individual shape's bounding box
        const shapeBox = new THREE.Box2();
        const pts = shape.getPoints(curveSegments);
        for (const p of pts) shapeBox.expandByPoint(p);
        for (const h of shape.holes) {
          const hPts = h.getPoints(curveSegments);
          for (const p of hPts) shapeBox.expandByPoint(p);
        }

        const sz = new THREE.Vector2();
        shapeBox.getSize(sz);
        const minShapeDim = Math.min(sz.x, sz.y);

        // Dynamic Safe Bevel Constraint:
        // Clamps bevel size so it never exceeds 18% of this specific shape's smallest dimension
        // and never exceeds 35% of the extrusion depth. This completely eliminates self-intersecting
        // bevels and inverted normals on tiny shapes, dots, or thin serifs.
        const safeBevel = Math.min(
          baseSvgBevel,
          minShapeDim * 0.18,
          svgDepth * 0.35
        );

        const bevelEnabled = isBevelRequested && safeBevel > 0.001;

        const extrudeSettings: THREE.ExtrudeGeometryOptions = {
          depth: svgDepth,
          curveSegments,
          steps: 1,
          bevelEnabled,
          bevelSegments: rawRoundedEdge > 30 ? 3 : 2,
          bevelSize: bevelEnabled ? safeBevel : 0,
          bevelThickness: bevelEnabled ? safeBevel : 0,
          bevelOffset: 0,
        };

        const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geometries.push(geom);
      } catch (shapeErr) {
        // If an individual shape has malformed vectors or degenerate curves,
        // skip it gracefully rather than failing the entire logo
        console.warn('Skipping shape due to extrusion failure:', shapeErr);
      }
    }

    if (geometries.length === 0) {
      return null;
    }

    // 5. Merge Geometries: Combine isolated ExtrudeGeometry instances into one unified BufferGeometry
    let unifiedGeometry: THREE.BufferGeometry;
    if (geometries.length === 1) {
      unifiedGeometry = geometries[0];
    } else {
      const merged = BufferGeometryUtils.mergeGeometries(geometries, false);
      // Clean up individual geometries immediately to prevent WebGL memory leaks
      for (const g of geometries) {
        g.dispose();
      }
      if (!merged) return null;
      unifiedGeometry = merged;
    }

    // 6. Geometry Transformations: Center, Scale, and Invert Y Upright
    // Center initially in SVG coordinates
    unifiedGeometry.center();

    // Scale to canonical target size and flip SVG Y-axis (+Y down -> +Y up)
    unifiedGeometry.scale(scale, -scale, scale);

    // Inverting one axis (-scale on Y) inverts the 3D triangle face winding.
    // Swap triangle vertex indices (1 and 2) to restore outward counter-clockwise winding
    const index = unifiedGeometry.getIndex();
    if (index) {
      for (let i = 0; i < index.count; i += 3) {
        const b = index.getX(i + 1);
        const c = index.getX(i + 2);
        index.setX(i + 1, c);
        index.setX(i + 2, b);
      }
      index.needsUpdate = true;
    }

    // 7. Shading & Centering Cleanup
    // Center at (0, 0, 0) for perfect Y-axis spin rotation
    unifiedGeometry.center();

    // Recompute vertex normals for clean studio chrome reflection without creasing
    unifiedGeometry.computeVertexNormals();

    return unifiedGeometry;
  } catch (err) {
    console.error('Fatal error in parseSvgToGeometry:', err);
    return null;
  }
}

/**
 * Validates whether an SVG string has readable paths or vector shapes
 */
export function isValidSvgString(content: string): boolean {
  if (!content || typeof content !== 'string') return false;
  const trimmed = content.trim();
  return (
    trimmed.includes('<svg') &&
    (trimmed.includes('<path') ||
      trimmed.includes('<polygon') ||
      trimmed.includes('<polyline') ||
      trimmed.includes('<circle') ||
      trimmed.includes('<rect') ||
      trimmed.includes('<ellipse>'))
  );
}
