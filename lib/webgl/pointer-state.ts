/**
 * Pointer position as a module singleton.
 *
 * Same reasoning as scroll-state.ts: the environment reads this every frame
 * inside useFrame, and routing it through React state would cause a render
 * per pointer move. Nothing subscribes.
 *
 * This is a passive event listener, NOT an animation loop — it fires only
 * when the pointer actually moves and does no work of its own. The single
 * GSAP-driven frame clock remains the only thing driving frames.
 *
 * R3F's own `state.pointer` is unavailable here on purpose: the canvas is
 * pointer-events:none so that the DOM keeps input, which means R3F never
 * receives a move event outside the one view that opts in.
 */

export const pointerState = {
  /** -1 → 1 across the viewport, 0 at centre. */
  x: 0,
  y: 0,
  /** True once the pointer has actually moved. Touch devices never set it. */
  engaged: false,
};

let listening = false;
let detach: (() => void) | null = null;
let refs = 0;

function onMove(event: PointerEvent) {
  // Coarse pointers are excluded: a touch "move" is a drag, and letting it
  // steer the environment would make the world lurch whenever someone
  // scrolls with their thumb.
  if (event.pointerType !== "mouse") return;

  pointerState.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointerState.y = -((event.clientY / window.innerHeight) * 2 - 1);
  pointerState.engaged = true;
}

function onLeave() {
  // Released rather than frozen, so the environment drifts back to centre
  // instead of holding a lean from wherever the pointer left.
  pointerState.x = 0;
  pointerState.y = 0;
}

/**
 * Reference-counted, so the listener exists only while something is reading
 * it and is removed cleanly when the last reader unmounts.
 */
export function trackPointer(): () => void {
  refs += 1;

  if (!listening && typeof window !== "undefined") {
    listening = true;
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave, { passive: true });
    detach = () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      listening = false;
    };
  }

  return () => {
    refs -= 1;
    if (refs <= 0) {
      refs = 0;
      detach?.();
      detach = null;
      pointerState.x = 0;
      pointerState.y = 0;
      pointerState.engaged = false;
    }
  };
}
