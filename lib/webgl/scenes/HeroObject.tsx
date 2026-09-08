"use client";

import { useEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { useSceneFrame } from "@/lib/webgl/hooks/useSceneFrame";
import { disposeObject } from "@/lib/webgl/utils/dispose";
import { heroPresence } from "@/lib/webgl/utils/envelope";
import { FRESNEL, SIMPLEX_3D } from "@/lib/webgl/shaders/chunks";
import { damp } from "@/lib/utils/math";

/**
 * THE HERO OBJECT
 *
 * One form, built properly, rather than a scene full of geometry. It reads
 * as something engineered — a faceted mass under tension inside a wider
 * structural cage — and it stays dark so the name remains the loudest thing
 * on screen.
 *
 * This is the only ambient scene that accepts pointer input. Motion is
 * damped rather than tracked directly, so it feels weighted, and it is
 * driven from R3F's pointer state (which is hosted on the DOM shell) rather
 * than a window listener, keeping the single-clock rule intact.
 */

const vertexShader = /* glsl */ `
${SIMPLEX_3D}

uniform float uTime;
uniform float uAmplitude;

varying vec3 vNormal;
varying vec3 vView;
varying float vDisplace;

void main() {
  // Two octaves: a slow swell, and a finer ripple that catches the rim light.
  float slow = snoise(normal * 1.15 + uTime * 0.09);
  float fine = snoise(normal * 3.4 - uTime * 0.16) * 0.35;
  float displace = (slow + fine) * uAmplitude;

  vec3 displaced = position + normal * displace;

  vec4 mv = modelViewMatrix * vec4(displaced, 1.0);
  vNormal = normalize(normalMatrix * normal);
  vView = normalize(-mv.xyz);
  vDisplace = displace;

  gl_Position = projectionMatrix * mv;
}
`;

const fragmentShader = /* glsl */ `
${FRESNEL}

uniform vec3 uAccent;
uniform vec3 uCore;
uniform float uOpacity;

varying vec3 vNormal;
varying vec3 vView;
varying float vDisplace;

void main() {
  float rim = fresnel(vView, vNormal, 2.6);

  // The body stays near-black; the accent lives only in the rim and in the
  // crests of the displacement. Restraint is the point.
  vec3 color = mix(uCore, uAccent, rim);
  color += uAccent * smoothstep(0.05, 0.28, vDisplace) * 0.35;

  float alpha = (0.18 + rim * 0.9) * uOpacity;
  gl_FragColor = vec4(color, alpha);
}
`;

export function HeroObject({ accent = "#f2f2f4" }: { accent?: string }) {
  const group = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const cage = useRef<THREE.LineSegments>(null);
  const target = useRef({ x: 0, y: 0 });

  /**
   * Per-frame mutation goes through refs to the rendered objects, never
   * through the memoised bindings. Values returned from useMemo are frozen
   * under the React Compiler rules, and mutating them is both a lint error
   * and a genuine correctness hazard once the compiler starts caching.
   */
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const cageMaterialRef = useRef<THREE.LineBasicMaterial>(null);

  const { pointer } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAmplitude: { value: 0.16 },
      uAccent: { value: new THREE.Color(accent) },
      uCore: { value: new THREE.Color("#0d0d12") },
      uOpacity: { value: 1 },
    }),
    [accent],
  );

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.NormalBlending,
      }),
    [uniforms],
  );

  // The structural cage: an icosahedral wireframe at a larger radius,
  // counter-rotating. Reads as scaffolding around the mass.
  const cageGeometry = useMemo(() => {
    const base = new THREE.IcosahedronGeometry(1.72, 1);
    const wire = new THREE.WireframeGeometry(base);
    base.dispose();
    return wire;
  }, []);

  const cageMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color(accent),
        transparent: true,
        opacity: 0.14,
        depthWrite: false,
      }),
    [accent],
  );

  useEffect(() => {
    const node = group.current;
    return () => {
      material.dispose();
      cageGeometry.dispose();
      cageMaterial.dispose();
      if (node) disposeObject(node);
    };
  }, [material, cageGeometry, cageMaterial]);

  useSceneFrame("hero", ({ dt, time, progress }) => {
    const mat = materialRef.current;
    const cageMat = cageMaterialRef.current;
    if (!mat) return;

    mat.uniforms.uTime.value = time;

    // Pointer parallax, damped. Small range on purpose — the object should
    // acknowledge the cursor, not chase it.
    target.current.x = damp(target.current.x, pointer.y * 0.22, 3, dt);
    target.current.y = damp(target.current.y, pointer.x * 0.3, 3, dt);

    if (core.current) {
      core.current.rotation.x = target.current.x;
      core.current.rotation.y += dt * 0.1;
    }

    if (group.current) {
      group.current.rotation.y = target.current.y;
      // Sink and fade as the hero scrolls away, so the object hands the
      // stage over rather than simply vanishing at the section boundary.
      group.current.position.y = -progress * 1.4;
    }

    if (cage.current) {
      cage.current.rotation.y -= dt * 0.045;
      cage.current.rotation.z += dt * 0.02;
    }

    const fade = heroPresence(progress);
    mat.uniforms.uOpacity.value = fade;
    if (cageMat) cageMat.opacity = 0.14 * fade;
  });

  return (
    <group ref={group}>
      <PerspectiveCamera makeDefault position={[0, 0, 4.4]} fov={38} />
      <ambientLight intensity={0.4} />

      <mesh ref={core}>
        <icosahedronGeometry args={[1.05, 24]} />
        <primitive object={material} attach="material" ref={materialRef} />
      </mesh>

      <lineSegments ref={cage}>
        <primitive object={cageGeometry} attach="geometry" />
        <primitive
          object={cageMaterial}
          attach="material"
          ref={cageMaterialRef}
        />
      </lineSegments>
    </group>
  );
}
