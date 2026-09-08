export const clamp = (v: number, min = 0, max = 1) =>
  Math.min(Math.max(v, min), max);

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Frame-rate independent lerp. Plain `lerp(a, b, 0.1)` in a render loop
 * moves at a different speed on a 60Hz vs a 144Hz display; this does not.
 */
export const damp = (a: number, b: number, lambda: number, dt: number) =>
  lerp(a, b, 1 - Math.exp(-lambda * dt));
