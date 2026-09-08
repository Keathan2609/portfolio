"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import * as THREE from "three";
import { MEDIA_VERTEX, MEDIA_FRAGMENT } from "./media-shaders";
import { acquire, release, variantUrl, type TextureVariant } from "./texture-cache";
import type { CompositionItem } from "./compositions";

/**
 * A MEDIA PLANE
 * =============
 *
 * One plane, one material, one draw call. Everything about how it looks comes
 * from the composition data; everything about when it looks that way comes
 * from uniforms written by MediaField inside the single frame loop.
 *
 * NO PER-FRAME REACT. The component renders once when it mounts and never
 * again in response to scroll. Reveal, opacity, parallax and drift are all
 * uniforms, and MediaField writes them through the handle below. That is the
 * same contract every other layer in this project honours, and it is why a
 * seven-plane composition costs zero renders while scrolling.
 *
 * GEOMETRY is a shared unit plane, scaled per instance. Seven planes therefore
 * hold one BufferGeometry between them rather than seven, and the mesh scale
 * carries the size — which is also what lets the shader work in world units
 * for the rounded mask and the edge feather.
 *
 * VIDEO is opt-in per plane and obeys the same contract the DOM `Media`
 * component already defines: muted, looped, playsInline, a mandatory poster,
 * no autoplay off-screen, paused on a hidden tab, and withheld entirely on
 * reduced motion, the LOW tier or a Save-Data connection. When it is withheld
 * the poster still loads as an ordinary texture, so the plane is never empty —
 * it just stops moving. Nothing about the composition changes.
 */

export interface MediaPlaneHandle {
  readonly item: CompositionItem;
  readonly material: THREE.ShaderMaterial | null;
  readonly mesh: THREE.Mesh | null;
  /** True once the texture has pixels; drives the reveal so it never wipes onto nothing. */
  readonly loaded: () => boolean;
  /** Called by MediaField when the plane's presence crosses the play threshold. */
  readonly setPlaying: (play: boolean) => void;
}

interface MediaPlaneProps {
  item: CompositionItem;
  variant: TextureVariant;
  /** Whether video is permitted at all on this tier / motion preference. */
  allowVideo: boolean;
  /**
   * Viewport adaptation, from MediaField. Recomputed only when the viewport
   * changes, never per frame.
   *
   * WHY THIS EXISTS. The compositions are authored against a landscape frame,
   * and the visible half-width is `halfHeight · viewportAspect`. At 1440x900
   * that aspect is 1.6; at 390x844 it is 0.46 — so the horizontal room
   * collapses to under a third and every plane authored at x≈4.6 sits
   * entirely outside the frame. Measured on a real 390x844 device context,
   * the XR chapter showed no reactor at all: just the edge of a glass panel
   * and a lot of empty violet.
   *
   * The fix is not to shrink everything uniformly, which would keep the
   * planes off-screen and merely make them smaller. Horizontal offsets are
   * COMPRESSED toward the centre line while vertical offsets are allowed to
   * spread, because a portrait frame has the opposite budget from a landscape
   * one: little width, lots of height. A composition authored as "off to the
   * right at mid-depth" becomes "centred, above and below" — which is the
   * same layered depth relationship, restated for the frame it is in.
   */
  adapt: { xScale: number; yScale: number; sizeScale: number };
}

/** Shared unit plane. Scaled per instance; never mutated. */
let unitPlane: THREE.PlaneGeometry | null = null;
function getUnitPlane(): THREE.PlaneGeometry {
  unitPlane ??= new THREE.PlaneGeometry(1, 1, 1, 1);
  return unitPlane;
}

const REVEAL_DIR: Record<string, number> = { up: 0, down: 1, left: 2, right: 3 };

export const MediaPlane = forwardRef<MediaPlaneHandle, MediaPlaneProps>(
  function MediaPlane({ item, variant, allowVideo, adapt }, ref) {
    const meshRef = useRef<THREE.Mesh>(null);
    const materialRef = useRef<THREE.ShaderMaterial | null>(null);
    const loadedRef = useRef(false);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const videoTextureRef = useRef<THREE.VideoTexture | null>(null);

    const isGlass = item.kind === "glass";

    /* Height comes from an explicit `h` when the composition sets one (glass
       panels are authored as rectangles, not as an image aspect), otherwise
       from the asset's native aspect so an image is never distorted. */
    /* Adapted dimensions. The plane's own aspect is preserved — only the
       overall scale changes — so `fit` still resolves against an undistorted
       frame and the image is never stretched to suit the viewport. */
    const width = item.w * adapt.sizeScale;
    const height = (item.h ?? item.w / (item.aspect ?? 16 / 9)) * adapt.sizeScale;
    const planeAspect = width / height;

    const material = useMemo(() => {
      return new THREE.ShaderMaterial({
        vertexShader: MEDIA_VERTEX,
        fragmentShader: MEDIA_FRAGMENT,
        /* Transparent for the reveal wipe and the rounded mask, but depth is
           still WRITTEN. The planes have to occlude the procedural mass behind
           them or the 2.5D layering collapses into a flat overlay, and their
           interiors are opaque once revealed. The partial-alpha frames during
           a wipe are brief and land against fog, where the artifact is not
           visible. Sorting is by distance, which is correct for planes that
           are roughly parallel and separated in depth. */
        transparent: true,
        depthWrite: true,
        depthTest: true,
        /* Both sides: several planes are turned far enough that a grazing
           view catches the back, and a plane that vanishes when the camera
           crosses its normal reads as a bug. */
        side: THREE.DoubleSide,
        toneMapped: false,
        uniforms: {
          uMap: { value: null as THREE.Texture | null },
          uHasMap: { value: 0 },
          uMode: { value: isGlass ? 1 : 0 },
          uPlaneAspect: { value: planeAspect },
          uImageAspect: { value: item.aspect ?? planeAspect },
          uFit: { value: item.fit ?? 1 },
          uCrop: { value: item.crop ?? 1 },
          uOpacity: { value: 0 },
          uReveal: { value: 0 },
          uRevealDir: { value: REVEAL_DIR[item.reveal ?? "up"] ?? 0 },
          uRadius: { value: item.radius ?? 0.06 },
          uSize: { value: new THREE.Vector2(width, height) },
          uDeep: { value: new THREE.Color("#0a0a0c") },
          uLight: { value: new THREE.Color("#9d5cff") },
          uTint: { value: new THREE.Color("#9d5cff") },
          uTintAmount: { value: item.tint ?? 0 },
          uEdge: { value: item.edge ?? 0.3 },
          uGlassAlpha: { value: item.glassAlpha ?? 0.35 },
          uVignette: { value: item.vignette ?? 0 },
          uDesaturate: { value: item.desaturate ?? 0 },
          uLift: { value: item.lift ?? 1 },
          /* DELIBERATELY A LONGER FOG THAN THE PROCEDURAL LAYERS USE.
             The mass layer fogs out between 8 and 52 and the structural layer
             between 6 and 34, which is right for geometry whose whole job is
             to describe depth by disappearing into it. Media is the subject,
             and on the same curve the mid- and deep-depth boards in the
             Creative chapter — which sit at d≈15-18 because that lens is
             furthest back — were being absorbed to the point where four real
             identity systems read as an empty maroon frame. Same curve shape,
             same `fogAmount` function, longer range: the planes still recede
             and still agree with the space, they just survive far enough back
             to be seen. */
          uFogNear: { value: 12 },
          uFogFar: { value: 78 },
          uDrift: { value: item.drift ?? 0 },
          uTime: { value: 0 },
          uPointer: { value: new THREE.Vector2() },
          uParallax: { value: item.parallax ?? 0 },
        },
      });
      // Uniform identity must survive re-renders; the item is stable per plane.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    materialRef.current = material;

    /* ---- still texture -------------------------------------------------
       Glass panels have no texture at all. A video plane still loads its
       poster here, so it has something to show before playback begins and
       something to keep showing if video is withheld. */
    const stillUrl = useMemo(() => {
      if (isGlass) return null;
      if (item.asset) return variantUrl(item.asset, variant);
      if (item.video) return variantUrl(item.video.poster, variant);
      return null;
    }, [isGlass, item.asset, item.video, variant]);

    useEffect(() => {
      if (!stillUrl) return;
      const entry = acquire(stillUrl);
      let cancelled = false;

      material.uniforms.uMap.value = entry.texture;
      if (entry.loaded) {
        material.uniforms.uHasMap.value = 1;
        loadedRef.current = true;
      }

      void entry.ready.then(() => {
        if (cancelled) return;
        material.uniforms.uHasMap.value = 1;
        loadedRef.current = true;
      });

      return () => {
        cancelled = true;
        loadedRef.current = false;
        material.uniforms.uHasMap.value = 0;
        material.uniforms.uMap.value = null;
        release(stillUrl);
      };
    }, [stillUrl, material]);

    /* ---- video ---------------------------------------------------------
       Created lazily and only when permitted. The element is never added to
       the document: it exists purely as a decode source for the texture. */
    useEffect(() => {
      if (!item.video || !allowVideo) return;

      const el = document.createElement("video");
      el.src = item.video.src;
      el.muted = true;
      el.loop = true;
      el.playsInline = true;
      el.crossOrigin = "anonymous";
      /* `metadata` rather than `auto`: the poster texture is already carrying
         the frame, so there is no reason to pull the whole clip until the
         plane is actually near enough to play. */
      el.preload = "metadata";
      videoRef.current = el;

      const texture = new THREE.VideoTexture(el);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      /* A VideoTexture must not generate mipmaps — it re-uploads every frame
         and mipmap generation on each upload is the single most common cause
         of a video texture tanking the frame rate. */
      texture.generateMipmaps = false;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      videoTextureRef.current = texture;

      const onVisibility = () => {
        if (document.visibilityState === "hidden") el.pause();
      };
      document.addEventListener("visibilitychange", onVisibility);

      return () => {
        document.removeEventListener("visibilitychange", onVisibility);
        el.pause();
        /* Order matters: drop the source and force a load before discarding
           the element, or Chrome keeps the network stream and the decoder
           alive for a video nothing references any more. */
        el.removeAttribute("src");
        el.load();
        texture.dispose();
        videoTextureRef.current = null;
        videoRef.current = null;
        /* Fall back to the poster texture, which the still-texture effect
           above still owns — so the plane never goes blank on teardown. */
        if (stillUrl) {
          const entry = acquire(stillUrl);
          material.uniforms.uMap.value = entry.texture;
          release(stillUrl);
        }
      };
    }, [item.video, allowVideo, material, stillUrl]);

    useImperativeHandle(
      ref,
      () => ({
        item,
        get material() {
          return materialRef.current;
        },
        get mesh() {
          return meshRef.current;
        },
        loaded: () => loadedRef.current,
        setPlaying: (play: boolean) => {
          const el = videoRef.current;
          const tex = videoTextureRef.current;
          if (!el || !tex) return;

          if (play) {
            /* Swap to the video texture only once playback has actually
               started. Binding it earlier shows a black frame, which is worse
               than the poster it replaced. */
            if (el.paused) {
              void el
                .play()
                .then(() => {
                  material.uniforms.uMap.value = tex;
                  material.uniforms.uHasMap.value = 1;
                })
                .catch(() => {
                  /* Autoplay refused. The poster stays. */
                });
            } else {
              material.uniforms.uMap.value = tex;
            }
          } else if (!el.paused) {
            el.pause();
          }
        },
      }),
      [item, material],
    );

    useEffect(() => () => material.dispose(), [material]);

    return (
      <mesh
        ref={meshRef}
        geometry={getUnitPlane()}
        material={material}
        position={[
          item.x * adapt.xScale,
          item.y * adapt.yScale,
          item.z,
        ]}
        rotation={[item.rotX ?? 0, item.rotY ?? 0, item.rotZ ?? 0]}
        scale={[width, height, 1]}
        /* Drawn after the opaque environment so the planes composite over the
           mass and ground rather than fighting them for sort order. */
        renderOrder={2}
        frustumCulled
      />
    );
  },
);
