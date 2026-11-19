"use client";

import { useRef } from "react";
import { Stage } from "@/components/layout/Stage";
import { RevealText } from "@/components/ui/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ProjectCard } from "@/components/ui/Project/ProjectCard";
import { projectsByDiscipline, skillGroups } from "@/lib/data/content";
import type { Discipline } from "@/lib/data/types";
import { gsap, useGSAP } from "@/lib/animation/register";
import { useReducedMotion } from "@/lib/animation/MotionProvider";
import { useIsDesktop } from "@/lib/hooks/useMediaQuery";
import { SCRUB } from "@/lib/animation/easings";
import styles from "./discipline.module.css";

/**
 * A DISCIPLINE WORLD.
 *
 * One component renders all five. They differ by data — name, index,
 * accent, intro line, process, capabilities — never by code. Adding or
 * reordering a world is an edit to lib/data/disciplines.ts.
 *
 * Structure:
 *   1. An "in and out" opening: index, name, one line, honest level. No essay.
 *   2. A process strip — the pipeline, as data.
 *   3. A horizontal project rail, pinned on desktop only.
 *
 * NO WEBGL IS MOUNTED HERE. Each world used to carry its own sticky scene;
 * they are gone, and the atmosphere behind this section now belongs to the
 * persistent journey environment, which never unmounts and reads its state
 * from this stage's scroll progress. That is what makes the five worlds feel
 * like one place rather than five — see lib/webgl/scenes/JourneyEnvironment.
 *
 * The rail is the one sanctioned horizontal moment, and its pin is load
 * bearing beyond this section: pinning inserts a spacer, which moves every
 * stage below it. See the refreshPriority note on the pin itself.
 */
/**
 * The three or four tools this world actually runs on.
 *
 * Read from the same skill data the Skills Arsenal renders — never a second
 * hand-kept list — and capped, because the point here is a signature, not an
 * inventory. The full set lives in the Arsenal, which is where a reader who
 * wants the inventory is going anyway.
 */
function signatureSkills(discipline: Discipline): string[] {
  return skillGroups
    .filter((group) => discipline.skillGroups.includes(group.id))
    .flatMap((group) => group.skills)
    .filter((skill) => skill.tier === "primary")
    .slice(0, 4)
    .map((skill) => skill.name);
}

export function DisciplineWorld({ discipline }: { discipline: Discipline }) {
  const opening = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const isDesktop = useIsDesktop();

  const projects = projectsByDiscipline(discipline.id);
  const titleId = `${discipline.slug}-title`;
  const horizontal = isDesktop && !reduced && projects.length > 1;

  /* The rail used to state flatly that imagery was still being produced.
     That was true of every world when it was written and is now false of
     some of them, so it is asked rather than asserted: a world whose work
     all carries real media should not apologise for media it has. */
  const imageryPending = projects.some((project) =>
    project.media.some((asset) => asset.pending),
  );
  const signature = signatureSkills(discipline);

  /**
   * The signature tools release as the visitor continues.
   *
   * They are an orientation device — "this is what this world runs on" — and
   * orientation stops being useful the moment you have it. Holding them on
   * screen for the whole section would make them a permanent label. They are
   * scrubbed, not timed, so they answer to the scroll rather than running a
   * clip at the reader.
   */
  useGSAP(
    () => {
      if (reduced) return;
      const el = opening.current?.querySelector("[data-release]");
      if (!el) return;

      gsap.to(el, {
        opacity: 0,
        y: -18,
        ease: "none",
        scrollTrigger: {
          trigger: opening.current,
          start: "bottom 72%",
          end: "bottom 34%",
          scrub: SCRUB,
        },
      });
    },
    { dependencies: [reduced], scope: opening, revertOnUpdate: true },
  );

  useGSAP(
    () => {
      if (!horizontal) return;
      const trackEl = track.current;
      const railEl = rail.current;
      if (!trackEl || !railEl) return;

      const distance = () => trackEl.scrollWidth - railEl.offsetWidth;
      if (distance() <= 0) return;

      gsap.to(trackEl, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: railEl,
          start: "center center",
          // Scroll distance is tied to how far the track actually travels,
          // so the pin never outlasts the content.
          end: () => `+=${distance() + window.innerHeight * 0.5}`,
          pin: true,
          pinSpacing: true,
          scrub: SCRUB,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          /**
           * MUST refresh before the stage triggers below it, or every stage
           * after this world is measured against a document that does not yet
           * contain this pin's spacer.
           *
           * ScrollTrigger refreshes in start-position order within a priority,
           * and this rail starts a little AFTER its own section's trigger — so
           * by default `skills`, `cv`, `building`, `beyond` and `hire` were all
           * measured first, then this pin inserted its spacer underneath them
           * and shifted the real content down without their starts moving.
           * Measured, that put the entire closing third of the page exactly
           * 1429px out — the pin's own length — so those sections' scroll
           * progress, and with it the environment's whole approach to the
           * ending, was keyed to the wrong scroll positions.
           *
           * A plain ScrollTrigger.refresh() does not fix it, because the sort
           * that decides refresh order uses the stale starts. An explicit
           * priority is the documented remedy.
           */
          refreshPriority: 1,
        },
      });
    },
    { dependencies: [horizontal, projects.length], scope: rail, revertOnUpdate: true },
  );

  return (
    <>
      <Stage
        id={discipline.slug}
        accentVar={discipline.accentVar}
        ariaLabelledBy={titleId}
        className={styles.world}
      >
        {/*
          THE SCENE. One full viewport, and deliberately almost empty.

          THIS IS THE STRUCTURAL FIX. Every reference frame supplied — a jar on
          a red field, a corn plant under "CORN. REVOLUTIONIZED.", a glowing
          ring under "ISN'T JUST A COASTER." — is ONE headline and ONE subject
          on a full screen. This section previously rendered EIGHT text blocks
          into a single viewport: eyebrow, heading, level, register, signature
          tools, a five-step process strip, a capability list and a project
          rail. No amount of art direction behind that makes it read like the
          references, because the references do not have a capability list.
          Three passes of shader and composition work failed for that reason.

          So the metadata moves down into its own screen, and this one carries
          the index, the statement, and nothing else. The WebGL composition
          behind it gets the whole frame to itself for the first time.
        */}
        <div ref={opening} className={styles.scene}>
          <Eyebrow
            index={String(discipline.index).padStart(2, "0")}
            label={discipline.name}
          />

          <RevealText
            id={titleId}
            as="h2"
            text={discipline.intro}
            className={styles.intro}
          />
        </div>

        {/*
          THE DETAIL. Everything the scene deliberately dropped, on its own
          screen beneath it. Nothing is removed from the document — the level,
          register, signature tools, process and capabilities are all still
          here, in the same order, still semantic DOM, still reachable by
          keyboard and findable with ctrl-F. They have simply stopped competing
          with the statement for the same viewport.
        */}
        <div className={styles.detail}>
          <div className={styles.meta}>
            <p className={styles.level}>
              <span className={styles.metaKey}>Level</span>
              {discipline.level}
            </p>
            <p className={styles.register}>
              <span className={styles.metaKey}>Register</span>
              {discipline.register}
            </p>
          </div>

          {signature.length > 0 && (
            <p className={styles.signature} data-release>
              {signature.map((name, i) => (
                <span key={name}>
                  {i > 0 && (
                    /* A middle dot, not a slash. One of the real skill names
                       is "UI / UX Design", and a slash separator turns that
                       row into "Figma / UI / UX Design" — four items or five,
                       unknowable. This also matches the Skills Arsenal. */
                    <span className={styles.signatureSep} aria-hidden="true">
                      {" · "}
                    </span>
                  )}
                  {name}
                </span>
              ))}
            </p>
          )}

          <ol
            className={styles.process}
            aria-label={`${discipline.name} process`}
          >
            {discipline.process.map((step, i) => (
              <li key={step}>
                <span className={styles.stepIndex} aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {step}
              </li>
            ))}
          </ol>

          <div className={styles.capabilities}>
            <h3 className={styles.capabilitiesTitle}>Capabilities</h3>
            <ul>
              {discipline.capabilities.map((capability) => (
                <li key={capability}>{capability}</li>
              ))}
            </ul>
          </div>
        </div>
      </Stage>

      <section
        ref={rail}
        className={styles.rail}
        aria-label={`${discipline.name} projects`}
        style={
          { "--c-accent": `var(${discipline.accentVar})` } as React.CSSProperties
        }
      >
        <div
          ref={track}
          className={styles.track}
          data-horizontal={horizontal ? "true" : "false"}
        >
          <div className={styles.railHead}>
            <h3 className={styles.railTitle}>Work</h3>
            <p className={styles.railNote}>
              {imageryPending
                ? "Selected work. Imagery is still being produced."
                : "Selected work."}
            </p>
          </div>

          {projects.map((project, i) => (
            <div key={project.slug} className={styles.item}>
              <ProjectCard project={project} index={i} />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
