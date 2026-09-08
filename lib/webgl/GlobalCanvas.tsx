"use client";

import { useEffect, type RefObject } from "react";
import { Canvas, advance } from "@react-three/fiber";
import { AdaptiveDpr, PerformanceMonitor, Preload, View } from "@react-three/drei";
import { onFrame } from "@/lib/animation/frame";
import { useQuality } from "@/lib/performance/QualityProvider";
import styles from "./global-canvas.module.css";

/**
 * THE PERSISTENT CANVAS
 * =====================
 *
 * One canvas, mounted once at the root, alive for the entire journey. It is
 * never unmounted as the visitor scrolls between disciplines, so there is no
 * WebGL context loss, no renderer re-creation, and textures/geometry stay
 * warm across worlds.
 *
 * Individual worlds do not create canvases. They declare a <WebGLView>, and
 * drei's View tunnels their contents into this canvas, scissoring the
 * viewport to the tracked DOM element. One canvas -> many worlds.
 *
 * frameloop="never" means R3F does not run its own requestAnimationFrame.
 * Frames are advanced from the single GSAP-driven clock instead, after the
 * scroll position has already resolved for that frame.
 */

interface GlobalCanvasProps {
  /** The DOM element R3F listens on. Keeps pointer events with the DOM. */
  eventSource: RefObject<HTMLElement | null>;
}

export default function GlobalCanvas({ eventSource }: GlobalCanvasProps) {
  const { dpr, antialias, degrade } = useQuality();

  useEffect(() => {
    /**
     * NOTE ON UNITS: with frameloop="never", R3F derives its delta as
     * `timestamp - clock.elapsedTime`, and elapsedTime is in SECONDS.
     * Passing milliseconds here would hand every useFrame a delta of ~16.7
     * "seconds" per frame and break all delta-based motion.
     */
    return onFrame((timeMs) => {
      advance(timeMs / 1000);
    });
  }, []);

  return (
    <div className={styles.root} aria-hidden="true">
      <Canvas
        frameloop="never"
        dpr={dpr}
        // Events are hosted on the DOM shell, not on the canvas. The canvas
        // itself is pointer-events:none; only views that explicitly opt in
        // to interaction accept pointers (see WebGLView).
        // React 19 types refs as RefObject<T | null>; R3F still declares
        // RefObject<T>. The ref is populated before the canvas mounts.
        eventSource={eventSource as React.RefObject<HTMLElement>}
        eventPrefix="client"
        gl={{
          antialias,
          alpha: true,
          stencil: false,
          powerPreference: "high-performance",
          // Required for reading pixels / screenshots; cheap to leave off.
          preserveDrawingBuffer: false,
        }}
        camera={{ position: [0, 0, 5], fov: 35, near: 0.1, far: 200 }}
      >
        {/* Drops quality one tier when sustained frame rate degrades.
            Floored at "low" — the canvas is never yanked mid-session. */}
        <PerformanceMonitor onDecline={degrade} />
        <AdaptiveDpr pixelated />

        {/* Every world's contents arrive here, scissored to its DOM element. */}
        <View.Port />

        <Preload all />
      </Canvas>
    </div>
  );
}
