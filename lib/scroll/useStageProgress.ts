"use client";

import { useRef, type RefObject } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/animation/register";
import { clearStageProgress, setStageProgress } from "./stage-progress";

/**
 * Registers a ScrollTrigger that publishes a stage's scroll progress into
 * the module-level map, for WebGL to read per frame.
 *
 * `useGSAP` reverts the trigger automatically on unmount, which is what
 * stops triggers accumulating as stages mount and unmount along a very long
 * page. Nothing here causes a React render.
 */
export function useStageProgress(
  id: string,
  ref: RefObject<HTMLElement | null>,
) {
  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const trigger = ScrollTrigger.create({
        trigger: el,
        // Span the whole element plus a viewport either side, so a scene has
        // somewhere to enter from and somewhere to leave to.
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          setStageProgress(id, {
            progress: self.progress,
            // Remap 0..1 to -1..1 so scenes can key off "distance from centre"
            // without recomputing it in five places.
            centered: self.progress * 2 - 1,
            active: true,
          });
        },
        onToggle: (self) => {
          setStageProgress(id, { active: self.isActive });
        },
      });

      return () => {
        trigger.kill();
        clearStageProgress(id);
      };
    },
    { dependencies: [id], scope: ref as RefObject<HTMLElement> },
  );
}

/**
 * Variant that also returns a ref, for components that do not already have
 * one to hand.
 */
export function useStageProgressRef<T extends HTMLElement = HTMLElement>(
  id: string,
) {
  const ref = useRef<T>(null);
  useStageProgress(id, ref);
  return ref;
}

export { gsap, ScrollTrigger };
