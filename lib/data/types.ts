/**
 * Content model for the portfolio.
 *
 * Everything the site displays is described here and authored in the sibling
 * data files. Sections read from this layer and never hardcode copy, so
 * adding a project or a certificate is a data edit — not a component edit —
 * and swapping to a CMS later is a change of loader, not of structure.
 *
 * Fields marked "editable placeholder" hold polished stand-in copy. Nothing
 * in this layer asserts a fact about Keathan that has not been supplied.
 */

/* ------------------------------------------------------------------ */
/* Disciplines — the five worlds of the journey                        */
/* ------------------------------------------------------------------ */

export type DisciplineId = "software" | "xr" | "ai" | "creative" | "security";

/** Deliberately coarse and honest. Rendered as quiet metadata, never a badge. */
export type ExperienceLevel =
  | "Advanced"
  | "Advanced / Broad"
  | "Intermediate → Advanced"
  | "Growing"
  | "Currently Developing";

export interface Discipline {
  id: DisciplineId;
  /** URL-safe key, also used as the DOM id of the section. */
  slug: string;
  /** Full name shown as the section heading. */
  name: string;
  /** Compact form for navigation and tight spaces. */
  shortName: string;
  /** 1-based position within the discipline sequence, shown as an index. */
  index: number;
  /** CSS custom property holding this world's accent colour. */
  accentVar: string;
  /**
   * The same colour as a literal, for WebGL.
   * three.js cannot read CSS custom properties, and calling
   * getComputedStyle per frame is a layout-thrash. MUST mirror the value of
   * `accentVar` in lib/styles/tokens.css.
   */
  accentHex: string;
  /** The single introductory line. One sentence, first person, no essay. */
  intro: string;
  /** Honest capability level, shown as quiet metadata. */
  level: ExperienceLevel;
  /** The conceptual register of this world — used as a quiet subtitle. */
  register: string;
  /** Ordered pipeline shown as a horizontal process strip. */
  process: string[];
  /** Broad capabilities listed in the world's aside. */
  capabilities: string[];
  /** Skill group ids surfaced within this world. */
  skillGroups: string[];
}

/* ------------------------------------------------------------------ */
/* Projects                                                            */
/* ------------------------------------------------------------------ */

/**
 * `model` is a 3D/WebGL project visual. The data shape is supported now so
 * a GLB can be dropped in later without a schema change; until a scene is
 * registered for it, it renders the composed placeholder frame rather than
 * speculative loader machinery nothing uses yet.
 */
export type MediaKind = "image" | "video" | "model";

export interface MediaAsset {
  kind: MediaKind;
  /** Path under /public. See public/media/README.md for the layout. */
  src: string;
  /** Required for images conveying meaning; empty string marks decorative. */
  alt: string;
  width?: number;
  height?: number;
  /** Poster frame for video. Always provide one — it is the LOW-tier still. */
  poster?: string;
  /** Optional lower-bitrate source used on the "low" quality tier. */
  srcLow?: string;
  /** Aspect ratio override, e.g. "4 / 3". Falls back to the slot default. */
  ratio?: string;
  /** No asset yet — render the composed placeholder treatment instead. */
  pending?: boolean;
}

export interface CaseStudySection {
  heading: string;
  body: string;
}

/**
 * A project.
 *
 * Only `slug`, `title`, `discipline`, `summary`, `stack`, `media`,
 * `presentation` and `placeholder` are required. EVERY other field is
 * optional and the UI renders nothing at all when it is absent — no empty
 * labels, no "N/A", no placeholder rows. A project with a title, a summary
 * and one image is a complete, well-formed project.
 */
export interface Project {
  slug: string;
  title: string;
  discipline: DisciplineId;
  /** Short summary used in listings. */
  summary: string;
  /** Technology names, rendered as `A · B · C`. */
  stack: string[];
  /**
   * `media[0]` is the primary visual (card and case-study hero).
   * Any further entries form the case-study gallery.
   */
  media: MediaAsset[];
  /**
   * `compact` renders visual + title + description + technology.
   * `expanded` additionally opens a full-screen case study takeover.
   */
  presentation: "compact" | "expanded";
  /**
   * TRUE for every entry currently in the file. These are format
   * demonstrations, not completed work, and the UI labels them as such.
   */
  placeholder: boolean;

  /* ---- optional: omit entirely rather than leaving an empty string ---- */

  role?: string;
  /** Displayed year or range. */
  year?: string;
  /** The live, deployed thing. */
  liveUrl?: string;
  /** Source repository. */
  repositoryUrl?: string;
  /** Any further links beyond live + repository. */
  links?: ExternalLink[];
  /** Long-form narrative. Only read when presentation === "expanded". */
  caseStudy?: CaseStudySection[];
  /** What the work actually achieved. Stays absent until it is real. */
  outcome?: string;
  /** Architecture and implementation notes, one per line. */
  technicalDetails?: string[];
}

/* ------------------------------------------------------------------ */
/* Skills                                                              */
/* ------------------------------------------------------------------ */

/**
 * Relative prominence within a discipline. Not a proficiency claim — it is
 * an editorial decision about what deserves to be surfaced first.
 *
 *   primary     the tools the work actually runs on — full weight, and the
 *               source of each discipline world's signature line
 *   secondary   regularly used — present, quieter
 *   supporting  known and used, but not headline — set back within an
 *               expanded Skills Arsenal row, which would otherwise drown in
 *               twenty-odd security tools all shouting equally.
 *
 * Emphasis only. Every tier is present in the DOM at every breakpoint.
 */
export type SkillTier = "primary" | "secondary" | "supporting";

export interface Skill {
  name: string;
  /** Which worlds light this skill up. A skill may belong to several. */
  disciplines: DisciplineId[];
  /** One short line revealed on hover or focus. */
  note: string;
  /** Relative prominence. Defaults to "secondary" when omitted. */
  tier?: SkillTier;
  /** Technologies commonly used alongside this one. Shown in the detail. */
  related?: string[];
}

export interface SkillGroup {
  id: string;
  label: string;
  /** Primary discipline for accent purposes. */
  discipline: DisciplineId;
  skills: Skill[];
}

/* ------------------------------------------------------------------ */
/* CV — profile, experience, certification, training, timeline         */
/* ------------------------------------------------------------------ */

export interface ExperienceEntry {
  id: string;
  organisation: string;
  role: string;
  /** Free-form display string, e.g. "2023 — Present". */
  period: string;
  location?: string;
  summary: string;
  highlights: string[];
  placeholder: boolean;
}

export interface ProfessionalDevelopmentEntry {
  discipline: DisciplineId;
  label: string;
  level: ExperienceLevel;
  /** 0–1, drives the quiet horizontal measure. Not a percentage claim. */
  weight: number;
  note: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issued: string;
  credentialId?: string;
  url?: string;
  placeholder: boolean;
}

export interface TrainingEntry {
  id: string;
  name: string;
  provider: string;
  period?: string;
  inProgress?: boolean;
  placeholder: boolean;
}

export interface TimelineEntry {
  id: string;
  period: string;
  title: string;
  detail: string;
  discipline?: DisciplineId;
  placeholder: boolean;
}

/* ------------------------------------------------------------------ */
/* Languages                                                           */
/* ------------------------------------------------------------------ */

export interface LanguageEntry {
  name: string;
  /** Free-form proficiency label, exactly as supplied. */
  level: string;
}

/* ------------------------------------------------------------------ */
/* Currently building / learning                                       */
/* ------------------------------------------------------------------ */

export interface CurrentlyBuilding {
  id: string;
  title: string;
  discipline: DisciplineId;
  status: "exploring" | "building" | "studying";
  note: string;
  placeholder: boolean;
}

/* ------------------------------------------------------------------ */
/* Beyond the code                                                     */
/* ------------------------------------------------------------------ */

export interface BeyondEntry {
  id: string;
  label: string;
  media: MediaAsset;
}

/* ------------------------------------------------------------------ */
/* Links + profile                                                     */
/* ------------------------------------------------------------------ */

export interface ExternalLink {
  label: string;
  href: string;
  /** Shown to assistive tech when the label alone is ambiguous. */
  ariaLabel?: string;
  /** TRUE while the real URL has not been supplied. Never invent one. */
  pending?: boolean;
}

export interface Profile {
  name: string;
  /** The hero statement, split across lines. */
  statement: string[];
  headline: string;
  location: string;
  email: string;
  /** First-person introduction paragraphs. */
  intro: string[];
  /** CV professional summary. */
  summary: string;
  availability: string;
}

/* ------------------------------------------------------------------ */
/* Journey — the ordered spine of the single continuous experience     */
/* ------------------------------------------------------------------ */

export type JourneyStageKind =
  | "opening"
  | "hero"
  | "intro"
  | "discipline"
  | "transition"
  | "skills"
  | "cv"
  | "building"
  | "beyond"
  | "hire"
  | "footer";

/** The four world-to-world transitions, each with its own mechanic. */
export type TransitionKind =
  | "software-xr"
  | "xr-creative"
  | "creative-ai"
  | "ai-security";

export interface JourneyStage {
  /** DOM id and scroll anchor. */
  id: string;
  kind: JourneyStageKind;
  /** Label used by the journey navigation. */
  navLabel: string;
  /** Two-digit index shown in the rail, or null for unnumbered stages. */
  navIndex: string | null;
  /** Whether this stage appears in the navigation rail. */
  inNav: boolean;
  /** Set for kind === "discipline". */
  discipline?: DisciplineId;
  /** Set for kind === "transition". */
  transition?: TransitionKind;
  /** Accent inherited by this stage, if any. */
  accentVar?: string;
}
