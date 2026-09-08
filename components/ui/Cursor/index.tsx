"use client";

import { useEffect, useRef, useState } from "react";
import { onFrame } from "@/lib/animation/frame";
import { useReducedMotion } from "@/lib/animation/MotionProvider";
import { useIsCoarsePointer, useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { damp } from "@/lib/utils/math";
import styles from "./cursor.module.css";

/**
 * Custom desktop cursor.
 *
 * Rules it obeys, all of them non-negotiable:
 *
 *  - It NEVER carries information or affordance that is not already in the
 *    DOM. Removing it changes nothing functional.
 *  - It does not exist on touch or coarse-pointer devices, and it does not
 *    exist when motion is reduced.
 *  - It does not run its own requestAnimationFrame. Position is damped from
 *    the single GSAP-driven clock via the frame bus, so it stays in step
 *    with scroll and WebGL instead of drifting against them.
 *  - The native cursor is hidden by a class this component adds at runtime,
 *    never by a static stylesheet rule — so a failed hydration cannot leave
 *    a visitor with no pointer at all.
 *
 * Context comes from `data-cursor` on any element: "VIEW", "EXPLORE",
 * "OPEN", or absent for the default dot.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [pressed, setPressed] = useState(false);

  const reduced = useReducedMotion();
  const coarse = useIsCoarsePointer();
  const fine = useMediaQuery("(pointer: fine)");

  const enabled = fine && !coarse && !reduced;

  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!enabled) return;

    const root = document.documentElement;
    root.classList.add("cursor-custom");

    const onPointerMove = (event: PointerEvent) => {
      target.current.x = event.clientX;
      target.current.y = event.clientY;
      if (!visible) setVisible(true);
    };

    const onPointerOver = (event: PointerEvent) => {
      const el = (event.target as HTMLElement | null)?.closest?.(
        "[data-cursor]",
      );
      setLabel(el ? el.getAttribute("data-cursor") : null);
    };

    const onLeave = () => setVisible(false);
    const onDown = () => setPressed(true);
    const onUp = () => setPressed(false);

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerover", onPointerOver, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("pointercancel", onUp, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    // Position is interpolated on the shared clock, not a private loop.
    const stop = onFrame((_time, deltaMs) => {
      const node = dot.current;
      if (!node) return;
      const dt = Math.min(deltaMs, 50) / 1000;
      // 16 rather than 22: the tighter value tracked the pointer almost
      // exactly, which reads as a cheap CSS follower. A little lag is what
      // makes it feel like an object with mass — but too much and it stops
      // being a pointer, so this stays well short of a trailing dot.
      current.current.x = damp(current.current.x, target.current.x, 16, dt);
      current.current.y = damp(current.current.y, target.current.y, 16, dt);
      node.style.transform = `translate3d(${current.current.x}px, ${current.current.y}px, 0) translate(-50%, -50%)`;
    });

    return () => {
      root.classList.remove("cursor-custom");
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerover", onPointerOver);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      document.removeEventListener("pointerleave", onLeave);
      stop();
    };
  }, [enabled, visible]);

  if (!enabled) return null;

  return (
    <div
      ref={dot}
      className={styles.cursor}
      data-visible={visible}
      data-label={label ? "true" : "false"}
      data-pressed={pressed}
      // Purely decorative: everything it indicates is already in the DOM.
      aria-hidden="true"
    >
      <span className={styles.inner}>{label}</span>
    </div>
  );
}
