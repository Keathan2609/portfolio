"use client";

import type { ReactNode } from "react";
import { View } from "@react-three/drei";

/**
 * The drei `View` element, isolated behind its own module.
 *
 * WebGLView is reached from Stage, which every section renders, which meant
 * a static `@react-three/drei` import sat in the initial client graph and
 * dragged three.js in with it — defeating the dynamic import on the canvas
 * itself. Keeping the drei import in a leaf module lets WebGLView load it
 * on demand instead.
 */
export function ViewPortal({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    // Decorative by definition: all meaning lives in the DOM alongside it.
    <View aria-hidden="true" className={className}>
      {children}
    </View>
  );
}
