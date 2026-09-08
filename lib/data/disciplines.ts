import type { Discipline, DisciplineId } from "./types";

/**
 * The five discipline worlds, in journey order.
 *
 * Capabilities and technology names are exactly those supplied — nothing is
 * added or inferred. Intro lines remain editable placeholder copy written
 * in the first person; they describe what Keathan does and assert no
 * outcome, employer, client or result.
 *
 * `id` and `slug` are structural: journey.ts, projects, skills, timeline and
 * professional development all key off them, so they are left untouched even
 * where the display name has changed.
 */
export const disciplines: Discipline[] = [
  {
    id: "software",
    slug: "software-engineering",
    name: "Software Engineering",
    shortName: "Software",
    index: 1,
    accentVar: "--c-accent-software",
    accentHex: "#4f7cff",
    intro:
      "I build products, systems and interfaces — from the screen back to the data.",
    // TODO — no level was supplied for this discipline. Carried over from
    // the previous content pass rather than guessed at afresh.
    level: "Advanced / Broad",
    register: "Systems · Interfaces · Languages · Applications",
    process: ["Interface", "Application", "Logic", "Data", "Delivery"],
    /**
     * Broad capability areas. These are deliberately NOT the same thing as
     * the portfolio's own tech stack — see the note at the top of the
     * `programming` skill group in content.ts.
     */
    capabilities: [
      "Frontend development",
      "Application development",
      "Web development",
      "Interface engineering",
      "Scripting and automation",
    ],
    skillGroups: ["programming"],
  },
  {
    id: "xr",
    slug: "xr-development",
    /**
     * Displayed as "XR Development". The id and slug stay `xr` /
     * `xr-development` because journey stages, scenes, transitions, skills
     * and projects all key off them; only the display name changed. The 3D
     * and VFX capabilities are unchanged and still listed below.
     */
    name: "XR Development",
    shortName: "XR",
    index: 2,
    accentVar: "--c-accent-xr",
    accentHex: "#9d5cff",
    intro:
      "I model, animate and light — then take it into engines and make it real-time.",
    level: "Advanced",
    register: "Modelling · Animation · VFX · Real-time",
    process: ["Model", "Sculpt", "Texture", "Animate", "Real-time"],
    capabilities: [
      "3D modelling",
      "Animation",
      "Character animation",
      "Visual effects design",
      "Texturing",
      "Digital sculpting",
      "Real-time 3D",
      "VFX",
      "XR development",
    ],
    skillGroups: ["xr3d"],
  },
  {
    id: "creative",
    slug: "creative-design",
    name: "Creative",
    shortName: "Creative",
    index: 3,
    accentVar: "--c-accent-creative",
    accentHex: "#ff6b3d",
    intro:
      "I design identities, interfaces and campaign work — then build the assets that carry them.",
    level: "Advanced",
    register: "Identity · Interface · Communication · Campaign",
    process: ["Identity", "Concept", "Design", "Asset", "Performance"],
    capabilities: [
      "Brand identity systems",
      "Digital marketing assets",
      "Paid advertising creatives",
      "Landing pages",
      "Email templates",
      "Website content",
      "Social media campaigns",
      "Performance-focused creative",
    ],
    skillGroups: ["design"],
  },
  {
    id: "ai",
    slug: "ai-data-science",
    name: "Data Science",
    shortName: "Data",
    index: 4,
    accentVar: "--c-accent-ai",
    accentHex: "#00c2a8",
    intro:
      "I analyse data, engineer features and run machine learning experiments.",
    /**
     * VERIFIED framing: growing, junior-level machine learning. This is
     * explicitly NOT a senior ML engineering claim.
     */
    level: "Growing",
    register: "Analysis · Modelling · Prediction · Visualisation",
    process: [
      "Data",
      "Analysis",
      "Features",
      "Modelling",
      "Visualisation",
    ],
    capabilities: [
      "Python-based data analysis",
      "Feature engineering",
      "Machine learning experiments",
      "Statistical modelling",
      "Predictive analytics",
      "Data visualisation",
    ],
    skillGroups: ["data"],
  },
  {
    id: "security",
    slug: "cybersecurity",
    name: "Cybersecurity",
    shortName: "Cyber",
    index: 5,
    accentVar: "--c-accent-security",
    accentHex: "#5c86a8",
    intro:
      "I am actively building this capability — learning to break systems so I can build them properly.",
    /** VERIFIED framing: junior. Held deliberately below every other world. */
    level: "Currently Developing",
    register: "Offensive · Defensive · Forensics · Detection",
    process: ["Recon", "Exploit", "Detect", "Respond", "Harden"],
    capabilities: [
      "Penetration Testing",
      "Threat Analysis",
      "Security Architecture",
      "Web Exploitation",
      "Cryptography",
      "Reverse Engineering",
      "Digital Forensics",
      "SOC Analysis",
      "Threat Detection",
      "Incident Response",
      "Security Metrics",
      "Cloud Security",
    ],
    skillGroups: ["security"],
  },
];

export const disciplinesById = Object.fromEntries(
  disciplines.map((d) => [d.id, d]),
) as Record<DisciplineId, Discipline>;

export function getDiscipline(id: DisciplineId): Discipline {
  return disciplinesById[id];
}
