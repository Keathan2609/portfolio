"use client";

import { MotionProvider } from "@/lib/animation/MotionProvider";
import { QualityProvider } from "@/lib/performance/QualityProvider";
import { ScrollProvider } from "@/lib/scroll/ScrollProvider";

/**
 * Provider order is load-bearing:
 *
 *   MotionProvider   resolves reduced-motion (OS + in-page override)
 *     -> QualityProvider   caps the WebGL tier using that answer
 *       -> ScrollProvider  owns the single clock and reads motion to decide
 *                          whether to smooth at all
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionProvider>
      <QualityProvider>
        <ScrollProvider>{children}</ScrollProvider>
      </QualityProvider>
    </MotionProvider>
  );
}
