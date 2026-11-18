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
    /**
     * The best-evidenced world in the archive, and the reason this site
     * leads with it: Vantage, At Leisure and FreeVoices are substantial
     * systems across Go, TypeScript, Python and Angular, with ATLAS, Forge
     * and the Nexus control plane behind them in the same repository
     * account. Two of them are deployed and reachable.
     */
    level: "Advanced / Broad",
    register: "Systems · Interfaces · Languages · Applications",
    process: ["Interface", "Application", "Logic", "Data", "Delivery"],
    /**
     * Broad capability areas. These are deliberately NOT the same thing as
     * the portfolio's own tech stack — see the note at the top of the
     * `programming` skill group in content.ts.
     */
    capabilities: [
      "Full-stack application development",
      "API and service design",
      "Relational schema design",
      "Offline-first and progressive web apps",
      "Edge and serverless deployment",
      "Automated testing",
      "Interface engineering",
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
      "I run the whole XR pipeline myself — concept, model, sculpt, texture, rig, animate, and into the engine.",
    /**
     * RAISED to "Advanced", on Keathan's own account of the work.
     *
     * The distinguishing claim here is not any one skill but the absence of
     * a handoff: the same person authors the geometry, the materials, the
     * rig and the engine integration, which is why a kit like ORBITAL can
     * be built to a constraint — 85 assets on a 0.5 m grid — and still
     * land correctly in Unity. Pipelines usually break at the seams between
     * specialists; there are no seams here.
     */
    level: "Advanced",
    register: "Modelling · Sculpting · Texturing · Animation · Real-time",
    process: ["Model", "Sculpt", "Texture", "Animate", "Integrate"],
    capabilities: [
      "End-to-end XR pipeline, single-handed",
      "Modular environment kits built to a grid",
      "3D modelling for real-time",
      "PBR texturing and map authoring",
      "Digital sculpting and retopology",
      "Rigging and character animation",
      "Game-ready export and engine integration",
      "OpenXR scene assembly and interaction scripting",
      "Asset, environment and render specification",
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
    /**
     * Broad and sustained — four identity systems taken past the logo into
     * colour, type, applications and websites, plus campaign work judged on
     * CTR, conversion and ROI rather than on taste. Held below "Advanced"
     * for one honest reason: much of the finished output has not been
     * photographed, rendered or written up yet, so its quality is
     * undemonstrated rather than demonstrated and found wanting.
     */
    level: "Intermediate → Advanced",
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
    name: "Data & Applied AI",
    shortName: "Data & AI",
    index: 4,
    accentVar: "--c-accent-ai",
    accentHex: "#00c2a8",
    intro:
      "I build systems that act on models, and I do the unglamorous data work that makes them worth acting on.",
    /**
     * RAISED from "Growing", on commercial work rather than coursework: a
     * Python pipeline built for Verifone covering ingestion, cleaning and
     * exploratory analysis, then machine-learning and forecasting models
     * delivered with documentation and reporting that non-technical
     * stakeholders could actually read.
     *
     * Still short of "Advanced" deliberately, and the project rail says why
     * more plainly than this comment can: the write-ups are pending. No
     * model here has been through adversarial validation or a production
     * feedback loop.
     */
    level: "Intermediate → Advanced",
    register: "Data · Modelling · Agents · Delivery",
    process: [
      "Data",
      "Analysis",
      "Features",
      "Modelling",
      "Visualisation",
    ],
    capabilities: [
      "Large messy dataset preparation",
      "Classification and feature engineering",
      "Intermittent-demand forecasting",
      "LLM agent runtimes and tool calling",
      "Approval-gated autonomous systems",
      "Reporting business users can actually open",
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
      "I build the security in — authentication, authorisation and sandboxing, designed before the feature rather than audited after it.",
    /**
     * REFRAMED, and raised.
     *
     * The previous framing was offensive — recon, exploit, forensics, SOC —
     * and the only standalone evidence for it was a small amount of CTF
     * practice. Meanwhile the genuinely strong security work was sitting
     * unclaimed inside the engineering: Row Level Security carrying real
     * authorisation rules, WebAuthn implemented by hand with no password
     * path, dedicated SSRF guards, argv-only sandboxed execution contained
     * by an OS job object, and a ten-job security pipeline.
     *
     * This is the stronger claim and the true one. Offensive practice stays
     * listed as practice, under Training, where it belongs.
     */
    level: "Intermediate → Advanced",
    register: "Authentication · Authorisation · Isolation · Supply chain",
    process: ["Model", "Constrain", "Gate", "Scan", "Verify"],
    capabilities: [
      "Passwordless authentication (WebAuthn)",
      "Row-level authorisation in the database",
      "SSRF and egress guarding",
      "Sandboxed command execution",
      "Approval gates for sensitive actions",
      "Secret scanning and dependency auditing",
      "Static and dynamic analysis in CI",
      "Threat modelling",
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
