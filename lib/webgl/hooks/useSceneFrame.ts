"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useQuality } from "@/lib/performance/QualityProvider";
import { getStageProgress } from "@/lib/scroll/stage-progress";
import { normalisedVelocity, scrollState } from "@/lib/scroll/scroll-state";

export interface SceneFrame {
  /** Clamped delta in seconds. A backgrounded tab can hand us a huge first frame. */
  dt: number;
  /**
   * Seconds since the scene's clock started — the AMBIENT time base.
   * Frozen at 0 when ambient motion is off, so a scene written against it
   * automatically holds still without checking the tier itself.
   */
  time: number;
  /** 0 → 1 across this stage's scroll span. */
  progress: number;
  /** -1 → 1, 0 at viewport centre. */
  centered: number;
  /** Normalised scroll velocity, clamped to -1..1. */
  velocity: number;
  /** Relative geometry/particle budget for the current quality tier. */
  density: number;
  /**
   * False when the visitor asked for less motion, or the tier is too low to
   * afford continuous animation. Scenes that need to drop a camera move or a
   * drift entirely — rather than merely freezing it — branch on this.
   */
  ambient: boolean;
}

/**
 * The frame hook every world scene uses.
 *
 * What it guarantees, and the reason no scene should call `useFrame` directly:
 *
 *  1. It early-returns when the stage is off-screen. With five worlds plus
 *     four transitions on one shared canvas, ticking all of them at all
 *     times is nine times the CPU work for one visible result.
 *
 *  2. It separates SCROLL-DRIVEN STATE from AMBIENT MOTION. This used to be
 *     a single early-return: when the quality tier said no ambient motion,
 *     the scene was never called at all. Since every material starts at
 *     opacity 0 and is raised by the scene itself, that did not "hold a
 *     static frame" — it held nothing, and the whole WebGL layer was dead
 *     weight on the LOW tier and under reduced motion. Now the callback
 *     still runs, `time` is pinned to 0, and `ambient` is false. Scroll
 *     still drives state; nothing moves on its own. That is precisely what
 *     reduced motion is supposed to mean.
 *
 *  3. With ambient motion off it runs only when the scroll position has
 *     actually changed, so a still page costs nothing.
 *
 *  4. It delivers one final frame after a stage goes inactive, pinned to
 *     whichever end of the span the visitor left through. Without it a scene
 *     keeps whatever values it happened to hold on its last active frame and
 *     stays frozen at that state — visible, mid-animation, forever.
 *
 * Scroll is read from the module singletons, never from React state, so a
 * scrubbing visitor causes zero re-renders.
 */
export function useSceneFrame(
  stageId: string,
  callback: (frame: SceneFrame) => void,
) {
  const { animateAmbient, density } = useQuality();
  const wasActive = useRef(false);
  const lastProgress = useRef(-1);

  useFrame((state, delta) => {
    const stage = getStageProgress(stageId);
    const dt = Math.min(delta, 1 / 20);

    if (!stage.active) {
      if (!wasActive.current) return;
      wasActive.current = false;

      // Settle to the end the visitor left through, so the scene lands on
      // its rest state instead of freezing part-way.
      const settled = stage.progress > 0.5 ? 1 : 0;
      lastProgress.current = settled;
      callback({
        dt,
        time: animateAmbient ? state.clock.elapsedTime : 0,
        progress: settled,
        centered: settled * 2 - 1,
        velocity: 0,
        density,
        ambient: animateAmbient,
      });
      return;
    }

    wasActive.current = true;

    // Nothing moves on its own at this setting, so a frame with an unchanged
    // scroll position would compute an identical result.
    if (!animateAmbient && stage.progress === lastProgress.current) return;
    lastProgress.current = stage.progress;

    callback({
      dt,
      time: animateAmbient ? state.clock.elapsedTime : 0,
      progress: stage.progress,
      centered: stage.centered,
      velocity: animateAmbient ? normalisedVelocity(80) : 0,
      density,
      ambient: animateAmbient,
    });
  });
}

/** Read-only access for the rare case a scene needs scroll outside a frame. */
export { scrollState };
