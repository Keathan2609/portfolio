/**
 * The frame bus.
 *
 * ScrollProvider owns the single clock (the GSAP ticker) but must not import
 * @react-three/fiber — that would pull three.js into the main bundle and
 * defeat the dynamic import of the canvas. So instead the canvas registers a
 * callback here, and the clock simply runs whatever is registered.
 *
 * Ordering matters and is guaranteed by insertion: the scroll position is
 * already updated for this frame before any subscriber runs, so WebGL reads
 * the same scroll value the DOM was laid out with. That is what keeps
 * tracked meshes locked to their DOM counterparts with zero drift.
 */

export type FrameCallback = (timeMs: number, deltaMs: number) => void;

const callbacks = new Set<FrameCallback>();

/** Subscribe to the single clock. Returns an unsubscribe function. */
export function onFrame(callback: FrameCallback): () => void {
  callbacks.add(callback);
  return () => {
    callbacks.delete(callback);
  };
}

/** Called by ScrollProvider only. */
export function runFrame(timeMs: number, deltaMs: number): void {
  for (const callback of callbacks) callback(timeMs, deltaMs);
}
