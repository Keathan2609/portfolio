"use client";

import { useRef, type ReactNode } from "react";
import { WebGLView } from "@/lib/webgl/WebGLView";
import { useInView } from "@/lib/hooks/useInView";
import { useStageProgress } from "@/lib/scroll/useStageProgress";
import { cn } from "@/lib/utils/cn";
import styles from "./stage.module.css";

/**
 * A stage in the journey.
 *
 * One semantic <section> that optionally carries a WebGL region behind its
 * content. The contract it enforces:
 *
 *   - the heading and all copy are real DOM, always present
 *   - the WebGL layer is decorative, behind, and absent on low tiers
 *   - the scene mounts only while the stage is near the viewport, so nine
 *     scenes never tick at once on the shared canvas
 *   - the stage publishes its own scroll progress for WebGL to read per
 *     frame, without causing a single React render
 *   - the accent colour is set as a local custom property, so descendants
 *     use var(--c-accent) and never reference a discipline colour directly
 */

interface StageProps {
  id: string;
  children?: ReactNode;
  /** Scene tunnelled into the persistent canvas behind this stage. */
  scene?: ReactNode;
  /** Grants pointer events to this stage's WebGL region only. */
  interactive?: boolean;
  /** CSS custom property name of the accent for this stage. */
  accentVar?: string;
  /** Accessible name, when the stage has no visible heading. */
  ariaLabel?: string;
  /** Id of the heading that names this stage. */
  ariaLabelledBy?: string;
  className?: string;
  /** Fills the viewport. Off for stages that should size to their content. */
  full?: boolean;
  /** Purely atmospheric — hidden from assistive tech entirely. */
  decorative?: boolean;
  /** How the WebGL region is anchored. See WebGLView. */
  sceneMode?: "cover" | "viewport";
}

export function Stage({
  id,
  children,
  scene,
  interactive = false,
  accentVar,
  ariaLabel,
  ariaLabelledBy,
  className,
  full = false,
  decorative = false,
  sceneMode = "cover",
}: StageProps) {
  const ref = useRef<HTMLElement>(null);

  // Generous margin so assets warm up before the stage is on screen — a
  // transition that compiles its shader on frame one is worse than none.
  const { ref: inViewRef, inView } = useInView<HTMLElement>({
    rootMargin: "50% 0px",
  });

  useStageProgress(id, ref);

  const setRefs = (node: HTMLElement | null) => {
    ref.current = node;
    inViewRef.current = node;
  };

  return (
    <section
      ref={setRefs}
      id={id}
      data-stage={id}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-hidden={decorative || undefined}
      tabIndex={decorative ? undefined : -1}
      className={cn(styles.stage, full && styles.full, className)}
      style={
        accentVar
          ? ({ "--c-accent": `var(${accentVar})` } as React.CSSProperties)
          : undefined
      }
    >
      {scene && inView && (
        <WebGLView interactive={interactive} mode={sceneMode}>
          {scene}
        </WebGLView>
      )}

      {children && <div className={styles.content}>{children}</div>}
    </section>
  );
}
