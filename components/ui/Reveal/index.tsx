"use client";

import { useRef, type ReactNode, type Ref } from "react";

import { gsap, SplitText, useGSAP } from "@/lib/animation/register";
import { useReducedMotion } from "@/lib/animation/MotionProvider";
import { DURATION, EASE, STAGGER } from "@/lib/animation/easings";
import { cn } from "@/lib/utils/cn";
import styles from "./reveal.module.css";

/**
 * Restricted to intrinsic tags. A fully polymorphic `as` prop collapses the
 * intersection of every element's props (and every element's ref type) to
 * `never`, so the component becomes unusable in TypeScript. A string union
 * plus createElement keeps it typed and keeps the call sites clean.
 */
type Tag = "h1" | "h2" | "h3" | "h4" | "p" | "div" | "span";

/** Minimal HTML escape. The copy is ours, but this costs nothing. */
function escape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}


/* ================================================================== */
/* RevealText — masked line or character reveal                        */
/* ================================================================== */

interface RevealTextProps {
  text: string;
  as?: Tag;
  /** Lines for prose and headings; chars only for short display statements. */
  split?: "lines" | "chars";
  className?: string;
  id?: string;
  delay?: number;
  /** Where the reveal fires relative to the viewport. */
  start?: string;
  /** Play immediately on mount instead of on scroll — for the opening/hero. */
  immediate?: boolean;
}

/**
 * Masked text reveal.
 *
 * Accessibility contract, in order of importance:
 *
 *  1. When motion is reduced, NO split happens at all — the text renders as
 *     plain text and nothing animates. Splitting and then instantly showing
 *     would still fragment the string for assistive tech.
 *  2. The complete string is rendered as a visually-hidden sibling and the
 *     split spans are `aria-hidden`, so a screen reader reads one sentence
 *     rather than a stream of characters — on every tag, not just headings.
 *  3. `autoSplit` re-splits on resize; the tween returned from `onSplit` is
 *     what GSAP tears down on each re-split, so nothing leaks.
 *  4. `useGSAP` reverts the split on unmount. Without that, text left in a
 *     split state after an error is invisible to assistive tech.
 */
export function RevealText({
  text,
  as = "p",
  split = "lines",
  className,
  id,
  delay = 0,
  start = "top 80%",
  immediate = false,
}: RevealTextProps) {
  const ref = useRef<HTMLElement>(null);
  const target = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const el = target.current;
      if (!el) return;

      if (reduced) {
        /**
         * Actively restore the plain string — do NOT simply return.
         *
         * The motion preference resolves from an external store whose server
         * snapshot is "system", so the first client pass runs with `reduced`
         * false, splits the text, and creates the entrance tween. Only then
         * does the preference resolve to true and re-run this effect with the
         * dependency changed.
         *
         * Returning early at that point leaves whatever the previous pass
         * built. Measured under prefers-reduced-motion, that was every line
         * parked at translateY(110.5px) inside its own overflow:hidden mask —
         * i.e. every RevealText heading on the site invisible, with the
         * element still reporting opacity 1 and a full bounding box. The
         * entrance tween's ScrollTrigger never fires to bring them back,
         * because the tween is exactly what this branch is declining to make.
         *
         * Rewriting the markup is safe and total: this component owns the
         * content, it is the same escaped string the JSX renders, and it is
         * what the accessibility contract at the top of this file promises
         * reduced motion gets — plain text, no split.
         */
        el.innerHTML = escape(text);
        return;
      }

      const instance = SplitText.create(el, {
        type: split,
        mask: split,
        autoSplit: true,
        linesClass: styles.line,
        onSplit(self) {
          const targets = split === "chars" ? self.chars : self.lines;
          return gsap.from(targets, {
            yPercent: 115,
            duration: DURATION.slower,
            ease: EASE.out,
            delay,
            stagger: split === "chars" ? STAGGER.tight : STAGGER.line,
            scrollTrigger: immediate
              ? undefined
              : { trigger: ref.current ?? el, start, once: true },
          });
        },
      });

      return () => instance.revert();
    },
    { dependencies: [text, reduced, split, immediate], scope: ref },
  );

  /**
   * The split target is handed to React as opaque HTML.
   *
   * SplitText restructures these children into per-line and per-character
   * elements. If React still held individual child references it would try
   * to remove nodes SplitText had already replaced on the next render —
   * which throws NotFoundError: "The node to be removed is not a child of
   * this node", and takes the whole tree down with it.
   *
   * dangerouslySetInnerHTML makes React treat the subtree as a single
   * opaque value: it only touches it if the HTML string itself changes.
   * The content is our own typed copy from lib/data, and it is escaped
   * regardless.
   *
   * The markup is also IDENTICAL in reduced and full motion, so toggling
   * motion never swaps children underneath a live split.
   */
  const props = {
    id,
    className: cn(styles.text, className),
  };

  /**
   * Accessible copy is a visually-hidden SIBLING, not an aria-label.
   *
   * aria-label is only reliably exposed on elements that have a role —
   * it works on a heading, but on the <p> variants used here it is ignored
   * by several screen readers, which would have left the sentence
   * unreadable. A sr-only sibling is announced correctly on every tag, and
   * it sits outside the split target so SplitText never touches it.
   */
  const inner = (
    <>
      <span className="sr-only">{text}</span>
      <span
        ref={target}
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: escape(text) }}
      />
    </>
  );

  // An explicit switch rather than createElement: passing a ref through a
  // function call trips the compiler's "refs during render" rule, and a
  // fully polymorphic JSX tag collapses its props to `never`.
  switch (as) {
    case "h1":
      return <h1 {...props} ref={ref as Ref<HTMLHeadingElement>}>{inner}</h1>;
    case "h2":
      return <h2 {...props} ref={ref as Ref<HTMLHeadingElement>}>{inner}</h2>;
    case "h3":
      return <h3 {...props} ref={ref as Ref<HTMLHeadingElement>}>{inner}</h3>;
    case "h4":
      return <h4 {...props} ref={ref as Ref<HTMLHeadingElement>}>{inner}</h4>;
    case "div":
      return <div {...props} ref={ref as Ref<HTMLDivElement>}>{inner}</div>;
    case "span":
      return <span {...props} ref={ref as Ref<HTMLSpanElement>}>{inner}</span>;
    default:
      return <p {...props} ref={ref as Ref<HTMLParagraphElement>}>{inner}</p>;
  }
}

/* ================================================================== */
/* Reveal — generic block entrance                                     */
/* ================================================================== */

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  start?: string;
  /** Stagger direct children instead of moving the block as one. */
  stagger?: boolean;
  as?: Tag;
}

/**
 * Block entrance.
 *
 * The initial hidden state is set from JS via `gsap.set`, never from CSS —
 * so if this never runs, the content is simply visible rather than stuck at
 * opacity 0. That is the whole reason `[data-animate]` exists.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  start = "top 85%",
  stagger = false,
  as = "div",
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const targets = stagger ? Array.from(el.children) : el;

      if (reduced) {
        // Same race as RevealText above: the preference resolves after the
        // first pass has already run, and that pass sets the hidden state
        // below. Returning early would leave the block at opacity 0 with no
        // tween left to raise it. Clearing is what makes the "if this never
        // runs, the content is simply visible" contract actually hold when
        // it runs and then stops.
        gsap.set(targets, { clearProps: "opacity,transform" });
        return;
      }

      gsap.set(targets, { opacity: 0, y: 24 });

      gsap.to(targets, {
        opacity: 1,
        y: 0,
        duration: DURATION.slow,
        ease: EASE.out,
        delay,
        stagger: stagger ? STAGGER.block : 0,
        scrollTrigger: { trigger: el, start, once: true },
      });
    },
    { dependencies: [reduced, stagger], scope: ref },
  );

  const props = { "data-animate": true, className };

  switch (as) {
    case "section" as Tag:
      return <div {...props} ref={ref as Ref<HTMLDivElement>}>{children}</div>;
    case "p":
      return <p {...props} ref={ref as Ref<HTMLParagraphElement>}>{children}</p>;
    case "span":
      return <span {...props} ref={ref as Ref<HTMLSpanElement>}>{children}</span>;
    default:
      return <div {...props} ref={ref as Ref<HTMLDivElement>}>{children}</div>;
  }
}
