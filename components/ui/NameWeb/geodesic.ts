/**
 * The geodesic wireframe behind the hero name, solved once at module load.
 *
 * This is an icosahedron subdivided once and pushed out to a sphere — the
 * same construction three.js calls IcosahedronGeometry(r, 1) — then projected
 * flat. Projected, a geodesic sphere reads as a web: triangles that get
 * denser and shallower toward the rim, which is exactly the thing a spider
 * builds and nothing like the even grid a hand-drawn "web" usually becomes.
 *
 * It is computed rather than drawn by hand because the vertex positions are
 * the whole character. An authored SVG of a web is a decoration; a projected
 * polyhedron has a real structure behind it, so the eye reads depth in the
 * edge lengths even though nothing here is 3D at render time.
 *
 * Pure, deterministic and dependency-free: no Math.random anywhere, so the
 * server and the client produce identical markup and React never has to
 * reconcile a hydration mismatch.
 */

export interface WebEdge {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** 0 at the back of the sphere, 1 at the front. Drives stroke opacity. */
  depth: number;
}

type Vec3 = [number, number, number];

const normalise = ([x, y, z]: Vec3): Vec3 => {
  const length = Math.hypot(x, y, z) || 1;
  return [x / length, y / length, z / length];
};

const midpoint = (a: Vec3, b: Vec3): Vec3 =>
  normalise([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]);

/** Base icosahedron: the golden-ratio rectangles. */
function icosahedron(): { points: Vec3[]; faces: [number, number, number][] } {
  const t = (1 + Math.sqrt(5)) / 2;

  const points: Vec3[] = [
    [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
    [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
    [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1],
  ].map((p) => normalise(p as Vec3));

  const faces: [number, number, number][] = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
  ];

  return { points, faces };
}

/**
 * Build the projected edge list.
 *
 * Rotated slightly off-axis before projecting, because a geodesic sphere
 * viewed down one of its own symmetry axes projects to something suspiciously
 * regular — a snowflake rather than a web. A small tilt on two axes breaks
 * that symmetry and is the difference between "generated" and "grown".
 */
export function buildWeb(): WebEdge[] {
  const { points, faces } = icosahedron();

  // Subdivide once: each face becomes four, on a sphere.
  const verts: Vec3[] = [...points];
  const subdivided: [number, number, number][] = [];
  const cache = new Map<string, number>();

  const mid = (i: number, j: number): number => {
    const key = i < j ? `${i}_${j}` : `${j}_${i}`;
    const hit = cache.get(key);
    if (hit !== undefined) return hit;
    verts.push(midpoint(verts[i], verts[j]));
    const index = verts.length - 1;
    cache.set(key, index);
    return index;
  };

  for (const [a, b, c] of faces) {
    const ab = mid(a, b);
    const bc = mid(b, c);
    const ca = mid(c, a);
    subdivided.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]);
  }

  // Unique edges only — every interior edge is shared by two faces, and
  // drawing it twice doubles its opacity where strokes overlap.
  const seen = new Set<string>();
  const edges: [number, number][] = [];
  for (const [a, b, c] of subdivided) {
    for (const [i, j] of [[a, b], [b, c], [c, a]] as [number, number][]) {
      const key = i < j ? `${i}_${j}` : `${j}_${i}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push([i, j]);
    }
  }

  // Off-axis tilt, then orthographic projection.
  const tiltX = 0.42;
  const tiltY = 0.31;
  const cx = Math.cos(tiltX);
  const sx = Math.sin(tiltX);
  const cy = Math.cos(tiltY);
  const sy = Math.sin(tiltY);

  const project = ([x, y, z]: Vec3) => {
    const y1 = y * cx - z * sx;
    const z1 = y * sx + z * cx;
    const x2 = x * cy + z1 * sy;
    const z2 = -x * sy + z1 * cy;
    return { x: x2, y: y1, z: z2 };
  };

  return edges.map(([i, j]) => {
    const a = project(verts[i]);
    const b = project(verts[j]);
    return {
      x1: +a.x.toFixed(4),
      y1: +a.y.toFixed(4),
      x2: +b.x.toFixed(4),
      y2: +b.y.toFixed(4),
      // Midpoint depth, mapped to 0..1.
      depth: +(((a.z + b.z) / 2 + 1) / 2).toFixed(4),
    };
  });
}

/** Solved once. The result is a constant for the lifetime of the page. */
export const WEB_EDGES: WebEdge[] = buildWeb();
