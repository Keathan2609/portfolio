"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

/**
 * Single registration point for GSAP plugins.
 *
 * Registering in more than one module is harmless but makes it impossible to
 * see at a glance what the animation layer depends on. Import `gsap`,
 * `ScrollTrigger` and `SplitText` from here so consumers cannot accidentally
 * use an unregistered plugin.
 *
 * SplitText is free on the public npm package since GSAP 3.13 — no token,
 * no private registry.
 */

let registered = false;

if (!registered && typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

  // Never animate off a rounded pixel — sub-pixel positioning is what makes
  // scrubbed motion read as smooth rather than stepped.
  gsap.config({ autoSleep: 60, force3D: true, nullTargetWarn: false });

  gsap.defaults({ ease: "power3.out", duration: 0.8 });

  ScrollTrigger.config({
    // Recalculating on every mobile URL-bar resize causes visible jumps.
    ignoreMobileResize: true,
    autoRefreshEvents: "visibilitychange,DOMContentLoaded,load",
  });

  registered = true;
}

export { gsap, ScrollTrigger, SplitText, useGSAP };
