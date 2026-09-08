"use client";

import { useEffect, type RefObject } from "react";
import * as THREE from "three";
import { Canvas, advance, useThree } from "@react-three/fiber";
import { AdaptiveDpr, PerformanceMonitor, Preload, View } from "@react-three/drei";
import { onFrame } from "@/lib/animation/frame";
import { textureCacheStats } from "@/lib/webgl/media/texture-cache";
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

/**
 * Development-only renderer bridge.
 *
 * `renderer.info` is the ground truth for draw calls, triangle count and
 * resident texture/geometry counts, and there is otherwise no way to read it
 * from outside the reconciler — which makes the media layer's texture budget
 * unauditable exactly when it started to matter. Mirrors the `__knp` and
 * `__knpQuality` conventions and is stripped from production by the NODE_ENV
 * check. Nothing in the app reads this.
 */
function RendererBridge() {
  const { gl, scene } = useThree();

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const w = window as unknown as Record<string, unknown>;
    w.__knpGL = {
      info: () => ({
        calls: gl.info.render.calls,
        triangles: gl.info.render.triangles,
        points: gl.info.render.points,
        lines: gl.info.render.lines,
        geometries: gl.info.memory.geometries,
        textures: gl.info.memory.textures,
        programs: gl.info.programs?.length ?? 0,
      }),
      /** Resident media textures, by URL — the media layer's own budget. */
      mediaTextures: () => textureCacheStats(),
      /** Live mesh/material census, for spotting a material zoo. */
      census: () => {
        let meshes = 0;
        const materials = new Set<string>();
        scene.traverse((o) => {
          const m = o as THREE.Mesh;
          if (!m.isMesh) return;
          meshes += 1;
          const mat = m.material;
          if (Array.isArray(mat)) mat.forEach((x) => materials.add(x.uuid));
          else if (mat) materials.add(mat.uuid);
        });
        return { meshes, materials: materials.size };
      },
    };
    return () => {
      delete w.__knpGL;
    };
  }, [gl, scene]);

  return null;
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

        <RendererBridge />
      </Canvas>
    </div>
  );
}
