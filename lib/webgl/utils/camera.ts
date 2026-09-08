/**
 * Camera helpers for DOM-tracked WebGL.
 *
 * When a mesh has to sit exactly where a DOM element sits, the cleanest
 * approach is to make one world unit equal one CSS pixel. Then a tracked
 * element's mesh is simply scaled to its bounding rect — no conversion
 * factors scattered through the scene code.
 */

/** FOV (degrees) that makes 1 world unit == 1 CSS pixel at the given distance. */
export function fovForViewport(viewportHeight: number, distance: number) {
  return (2 * Math.atan(viewportHeight / (2 * distance)) * 180) / Math.PI;
}

/** Distance at which the given FOV yields 1 world unit == 1 CSS pixel. */
export function distanceForFov(viewportHeight: number, fovDegrees: number) {
  return viewportHeight / (2 * Math.tan((fovDegrees * Math.PI) / 360));
}

/** Visible width/height in world units at a given depth. */
export function visibleSizeAtDepth(
  distance: number,
  fovDegrees: number,
  aspect: number,
) {
  const height = 2 * distance * Math.tan((fovDegrees * Math.PI) / 360);
  return { width: height * aspect, height };
}

/**
 * Convert a DOM rect to a centre-origin position in pixel-unit world space.
 * Y is flipped because the DOM grows downward and WebGL grows upward.
 */
export function rectToWorld(
  rect: { left: number; top: number; width: number; height: number },
  viewportWidth: number,
  viewportHeight: number,
): [number, number, number] {
  return [
    rect.left + rect.width / 2 - viewportWidth / 2,
    -(rect.top + rect.height / 2) + viewportHeight / 2,
    0,
  ];
}
