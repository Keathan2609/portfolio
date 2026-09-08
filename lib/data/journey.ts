import type { JourneyStage, TransitionKind } from "./types";
import { disciplines } from "./disciplines";

/**
 * The spine of the primary experience.
 *
 * ONE continuous page, not a set of routes — the five discipline worlds
 * transition into each other rather than navigating between documents.
 * Case studies open as an in-page takeover, never a navigation.
 *
 * Both the page composition and the navigation rail are generated from this
 * array, so the order exists in exactly one place.
 *
 * Transition bands sit BETWEEN worlds and carry their own distinct mechanic.
 * They are stages in their own right so they can be measured, tracked and
 * scrubbed like anything else — but they never appear in navigation.
 */

const transitionAfter: Record<string, TransitionKind> = {
  "software-engineering": "software-xr",
  "xr-development": "xr-creative",
  "creative-design": "creative-ai",
  "ai-data-science": "ai-security",
};

function buildDisciplineStages(): JourneyStage[] {
  const stages: JourneyStage[] = [];

  for (const d of disciplines) {
    stages.push({
      id: d.slug,
      kind: "discipline",
      navLabel: d.shortName,
      navIndex: String(d.index).padStart(2, "0"),
      inNav: true,
      discipline: d.id,
      accentVar: d.accentVar,
    });

    const transition = transitionAfter[d.slug];
    if (transition) {
      stages.push({
        id: `transition-${transition}`,
        kind: "transition",
        navLabel: "",
        navIndex: null,
        inNav: false,
        transition,
      });
    }
  }

  return stages;
}

export const journey: JourneyStage[] = [
  { id: "opening", kind: "opening", navLabel: "Opening", navIndex: null, inNav: false },
  { id: "hero", kind: "hero", navLabel: "Start", navIndex: null, inNav: true },
  { id: "intro", kind: "intro", navLabel: "Intro", navIndex: null, inNav: true },

  ...buildDisciplineStages(),

  { id: "skills", kind: "skills", navLabel: "Skills", navIndex: null, inNav: true },
  { id: "cv", kind: "cv", navLabel: "CV", navIndex: null, inNav: true },
  { id: "building", kind: "building", navLabel: "", navIndex: null, inNav: false },
  { id: "beyond", kind: "beyond", navLabel: "", navIndex: null, inNav: false },
  { id: "hire", kind: "hire", navLabel: "Hire", navIndex: null, inNav: true },
  { id: "footer", kind: "footer", navLabel: "", navIndex: null, inNav: false },
];

export const navStages = journey.filter((stage) => stage.inNav);

/** Every stage the journey indicator observes — includes transitions, so the
 *  rail does not freeze on the previous world while a transition plays. */
export const trackedStageIds = journey
  .filter((s) => s.kind !== "footer")
  .map((s) => s.id);
