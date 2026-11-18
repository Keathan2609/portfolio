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
     * The best-evidenced world in the archive, and the reason this site now
     * leads with it: Vantage, At Leisure, Kbot, RedSeptember and KELVIN are
     * several substantial systems across Go, TypeScript and Python, two of
     * them deployed and reachable.
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
      "I model and texture for real-time, and I am still learning the engine half properly.",
    /**
     * HONESTLY DOWNGRADED from "Advanced".
     *
     * The asset pipeline here is genuinely strong — Maya and Substance work
     * exported game-ready, with functional parts separated for engine use.
     * The engine side is not yet: one coursework OpenXR scene assembled on
     * licensed asset packs, whose original code is an audio interaction
     * layer. That is real exposure rather than depth, and stating otherwise
     * would be the single easiest claim on this site to disprove in an
     * interview.
     */
    level: "Growing",
    register: "Modelling · Animation · VFX · Real-time",
    process: ["Model", "Sculpt", "Texture", "Animate", "Real-time"],
    capabilities: [
      "3D modelling for real-time",
      "PBR texturing and map authoring",
      "Game-ready asset export",
      "Rigging parts for engine-driven motion",
      "OpenXR scene assembly",
      "Interaction and spatial audio scripting",
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
     * Broad and sustained — months of modelling and texturing, a shipped
     * multi-week content programme, code-drawn brand marks. Held below
     * "Advanced" for one honest reason: almost none of the 3D work has been
     * rendered, so its finished quality is undemonstrated rather than
     * demonstrated and found wanting.
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
     * RAISED from "Growing", on two independent legs rather than one.
     *
     * The applied-AI leg is an agent runtime in production: bounded tool
     * loops, a policy engine, approval gates and depth-limited delegation.
     * The classical leg is client-scale analysis — 643,933 repair records
     * through classification and intermittent-demand forecasting.
     *
     * Still short of "Advanced" deliberately: the agent work is concentrated
     * in a single codebase, and no model here has been through adversarial
     * validation or a production feedback loop.
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
