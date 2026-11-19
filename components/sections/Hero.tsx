"use client";

import { useEffect, useRef } from "react";

import { Stage } from "@/components/layout/Stage";
import { measureHeroAnchor } from "@/lib/webgl/hero-anchor";
import { RevealText } from "@/components/ui/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { profile } from "@/lib/data/profile";
import { disciplines } from "@/lib/data/disciplines";
import styles from "./hero.module.css";

/**
 * THE HERO — the only h1 on the page.
 *
 * Art-directed rather than stacked: the name sits on the baseline of the
 * composition at display scale, the statement breaks across two lines
 * against it, and the discipline index runs as a quiet column to one side.
 * The name is the largest thing on the screen, and the 3D object sits
 * behind it rather than beside it.
 *
 * This is the one stage that grants pointer events to WebGL, so the hero
 * object acknowledges the cursor. Nothing depends on that interaction.
 */
export function Hero() {
  const nameRef = useRef<HTMLHeadingElement>(null);

  /**
   * Tell the background where the name is, so the hero cloud can sit behind
   * it — see lib/webgl/hero-anchor.ts for why this is measured here rather
   * than read from inside the frame loop.
   *
   * A ResizeObserver rather than a window resize listener, because the name
   * also changes size when the font finishes loading and when it re-wraps,
   * neither of which fires a resize event. The observation the observer
   * delivers on connect doubles as the first measurement.
   */
  useEffect(() => {
    const el = nameRef.current;
    if (!el) return;

    const measure = () => measureHeroAnchor(el);
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    window.addEventListener("resize", measure, { passive: true });
    document.fonts?.ready.then(measure).catch(() => {});

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <Stage
      id="hero"
      full
      ariaLabelledBy="hero-title"
      className={styles.stage}
    >
      <div className={styles.hero}>
        <Eyebrow label="Portfolio — 001" />

        <h1 id="hero-title" ref={nameRef} className={styles.name}>
          {profile.name}
        </h1>

        <div className={styles.statement}>
          {profile.statement.map((line, i) => (
            <RevealText
              key={line}
              text={line}
              as="p"
              // Lines, not characters. A per-character cascade is the busiest
              // thing the reveal system can do, and it was doing it on the
              // first thing a visitor sees. The hero should arrive composed
              // and then hold still.
              immediate
              delay={0.4 + i * 0.16}
              className={styles.statementLine}
            />
          ))}
        </div>

        <div className={styles.foot}>
          <p className={styles.headline}>{profile.headline}</p>

          {/* The five disciplines are the single most distinctive fact about
              this person, and they were set at 13px in the corner — smaller
              than everything else in the hero, including the eyebrow. The
              index now carries each world's own accent on its number, so the
              range reads as five identities rather than a list of words. */}
          <ol className={styles.index} aria-label="Disciplines">
            {disciplines.map((discipline) => (
              <li
                key={discipline.id}
                style={
                  {
                    "--c-accent": `var(${discipline.accentVar})`,
                  } as React.CSSProperties
                }
              >
                <span className={styles.indexNum} aria-hidden="true">
                  {String(discipline.index).padStart(2, "0")}
                </span>
                {discipline.shortName}
              </li>
            ))}
          </ol>
        </div>

        {/* The only piece of UI in the hero. Decorative: the journey rail and
            the page itself already say what to do, and a visitor who cannot
            see this can still scroll. It is a hairline that travels, not an
            arrow that bounces — the restraint is the point. */}
        <div className={styles.scroll} aria-hidden="true">
          <span className={styles.scrollLabel}>Scroll</span>
          <span className={styles.scrollTrack}>
            <span className={styles.scrollHead} />
          </span>
        </div>
      </div>
    </Stage>
  );
}
