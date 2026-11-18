import type {
  BeyondEntry,
  Certification,
  CurrentlyBuilding,
  DisciplineId,
  ExperienceEntry,
  LanguageEntry,
  ProfessionalDevelopmentEntry,
  Project,
  SkillGroup,
  TimelineEntry,
  TrainingEntry,
} from "./types";

/**
 * Content collections.
 *
 * Every project below is REAL and carries `placeholder: false`. Each was
 * characterised from the source files on disk rather than from memory, and
 * the standing rule applies without exception: no invented project, metric,
 * certification, client or link.
 *
 * WHAT IS DELIBERATELY ABSENT, and why:
 *
 *   - No accuracy figures appear for the repair-return model. A README
 *     beside that work quotes a headline accuracy that its own results file
 *     contradicts, and the classifier splits without grouping, so any single
 *     number would overstate it. The data scale is stated instead, because
 *     that is independently reconciled inside the notebook.
 *
 *   - No specification is repeated from KELVIN K1. The product is fictional
 *     and its numbers are invented; the entry says so in its own first line
 *     rather than leaving a reader to discover it.
 *
 *   - `media` is `pending: true` everywhere. There is real imagery on disk
 *     for the 3D and content work, but none of it has been brought in,
 *     sized or captioned yet. A pending marker renders as a composed frame;
 *     it never fabricates a screenshot.
 *
 *   - Only verified links appear. Every URL here was requested and answered
 *     before it was written down, and the public/private status of the one
 *     repository link was confirmed.
 *
 * Replacing content is a matter of editing this file. No component changes.
 */
export const projects: Project[] = [
  /* ---------------------------------------------------------------- */
  /* SOFTWARE                                                          */
  /* ---------------------------------------------------------------- */

  {
    slug: "vantage",
    title: "Vantage",
    discipline: "software",
    summary:
      "A single-operator automated trading platform where every order passes a pure risk engine before it can reach a venue. Paper trading only — it has never been pointed at real money, and that constraint shaped the architecture rather than limiting it.",
    role: "Sole author — architecture, Go services, Python research layer, security pipeline",
    year: "2025 — 2026",
    stack: ["Go", "PostgreSQL", "Redis", "Python", "FastAPI", "pandas", "Prometheus"],
    repositoryUrl: "https://github.com/Keathan2609/vantage",
    media: [{ kind: "image", src: "", alt: "", pending: true }],
    presentation: "expanded",
    caseStudy: [
      {
        heading: "Context",
        body: "Automated trading is a domain where a quiet bug spends real money. The system is built around one idea: make the dangerous part small, pure, and impossible to skip. Strategies generate orders, a consensus layer agrees them, and then — without exception — a risk engine judges them before anything leaves the building.",
      },
      {
        heading: "Approach",
        body: "The risk engine is a single pure function. It evaluates every check on every order instead of short-circuiting on the first failure, so a refusal arrives as a complete account of everything wrong rather than the first thing noticed. Twenty-seven named checks sit behind it, with a separate trading-authority ceiling layer above them. Money is never a float: it is decimal end to end. The order pipeline is an explicit state machine rather than a scatter of booleans.",
      },
      {
        heading: "Proving it",
        body: "73 of 179 Go files are tests, and in at least one case the test file is larger than the implementation it covers. Fills are reconciled against the venue and runs replay deterministically, which is the only practical way to debug a system whose inputs never repeat. A ten-job security pipeline runs static analysis, secret scanning, dependency and container audits, and a dynamic scan over it.",
      },
    ],
    technicalDetails: [
      "Risk engine is one pure function evaluating all checks per order, so a refusal reports every violation rather than only the first.",
      "27 named risk checks, plus a separate five-check trading-authority ceiling layer.",
      "Decimal money throughout — no floating point anywhere in the ledger.",
      "Forward-only numbered Postgres migrations, embedded in the binary.",
      "Deterministic replay and venue reconciliation for post-hoc debugging.",
      "Ten-job security pipeline: Semgrep, Gitleaks, govulncheck, OSV-Scanner, Trivy and OWASP ZAP.",
    ],
    placeholder: false,
  },

  {
    slug: "at-leisure",
    title: "At Leisure",
    discipline: "software",
    summary:
      "An offline-first reader for books you already own — PDF, EPUB and plain text — that holds your position to the character and can turn a photographed page into clean, restylable text without the image ever leaving your device.",
    role: "Sole author — product, engineering, deployment, Android build",
    year: "2026",
    stack: ["TypeScript", "React", "Vite", "Supabase", "IndexedDB", "tesseract.js", "Cloudflare Pages"],
    liveUrl: "https://atleisure.pages.dev",
    media: [{ kind: "image", src: "", alt: "", pending: true }],
    presentation: "expanded",
    caseStudy: [
      {
        heading: "Context",
        body: "Reading apps tend to assume a connection and a shop. This one assumes neither: it opens files you already have, works with the network off, and keeps your place precisely rather than approximately. The interesting problem was never the reader — it was everything needed to make a photograph of a page readable.",
      },
      {
        heading: "The OCR pipeline",
        body: "Recognition is the easy half. A photographed page arrives with uneven lighting, a curved gutter, sometimes two columns, and words broken across lines. The pipeline estimates paper brightness across a coarse grid and smooths it to correct the lighting, detects the gutter so a spread becomes two pages, separates columns, strips running heads, and rejoins hyphenated words before a single character is shown. All of it runs on the device.",
      },
      {
        heading: "Shipping it",
        body: "It installs as a PWA, and there is a signed Android build wrapped as a Trusted Web Activity, distributed from the site itself rather than through a store. The release script reads the signing password from a file rather than the command line, and re-patches a manifest flag the generator insists on resetting on every build.",
      },
    ],
    technicalDetails: [
      "OCR runs entirely on-device — no server ever sees the page.",
      "Hand-written illumination flattening: per-cell paper-brightness estimation on a coarse grid, then smoothing passes.",
      "Gutter and column detection for two-page spreads; running-head removal and de-hyphenation during reassembly.",
      "Postgres Row Level Security for sync, so a row is unreadable to anyone but its owner.",
      "Signed Android build as a Trusted Web Activity, verified by Digital Asset Links.",
    ],
    placeholder: false,
  },

  {
    slug: "redseptember-lms",
    title: "RedSeptember",
    discipline: "software",
    summary:
      "A learning management system with genuinely separate student and facilitator roles, where the authorisation rules live in the database rather than in whichever interface happens to be in front of you.",
    role: "Database design and application development",
    year: "2025",
    stack: ["React", "TypeScript", "Vite", "Supabase", "PostgreSQL", "Tailwind CSS"],
    media: [{ kind: "image", src: "", alt: "", pending: true }],
    presentation: "compact",
    technicalDetails: [
      "Eleven-table Postgres schema with Row Level Security enabled on every table.",
      "Policies encode the real rules: a student may edit a submission only while its grade is still null, and only the owning facilitator can grade it.",
      "A SECURITY DEFINER trigger creates the profile row on sign-up and sets the role server-side rather than trusting the client.",
    ],
    placeholder: false,
  },

  {
    slug: "schoeman-inspection",
    title: "Schoeman Inspection Services",
    discipline: "software",
    summary:
      "A marketing site for a water-leak-detection business, built as a single self-contained HTML file with every asset inlined — no dependencies, no build step, and it will still open correctly in a decade.",
    role: "Design and build",
    year: "2026",
    stack: ["HTML", "CSS", "JavaScript"],
    media: [{ kind: "image", src: "", alt: "", pending: true }],
    presentation: "compact",
    technicalDetails: [
      "Single-file delivery: images and assets embedded as data URIs, so the entire site is one portable document.",
    ],
    placeholder: false,
  },

  {
    slug: "kelvin-k1",
    title: "KELVIN K1",
    discipline: "software",
    summary:
      "A scroll-driven launch site for a vacuum flask that does not exist. Built purely as an engineering exercise: one temperature value derived from scroll position simultaneously drives a 3D material, the typography, the lighting and the copy.",
    role: "Self-directed exercise — concept, 3D and front-end",
    year: "2026",
    stack: ["React", "TypeScript", "Three.js", "React Three Fiber", "GSAP", "Lenis"],
    media: [{ kind: "image", src: "", alt: "", pending: true }],
    presentation: "compact",
    technicalDetails: [
      "The product, the brand and every specification shown are invented. This is a design and engineering exercise, not a real product.",
      "Vessel geometry is generated procedurally rather than modelled and imported.",
      "One thermal colour ramp is defined once and shared: the GLSL ramp is generated from the same array the CPU samples, so shader and DOM colour cannot drift apart.",
      "MeshStandardMaterial is patched through onBeforeCompile rather than replaced, keeping physically-based lighting while injecting a Fresnel term.",
      "Three.js is deliberately kept out of the initial bundle.",
    ],
    placeholder: false,
  },

  /* ---------------------------------------------------------------- */
  /* AI                                                                */
  /* ---------------------------------------------------------------- */

  {
    slug: "kbot",
    title: "Kbot",
    discipline: "ai",
    summary:
      "A self-hosted multi-agent AI platform built end to end on free infrastructure. Agents call tools, delegate to sub-agents, and stop to ask permission before doing anything consequential.",
    role: "Sole author — architecture, agent runtime, authentication, deployment",
    year: "2026",
    stack: ["TypeScript", "Cloudflare Workers", "Hono", "D1", "Durable Objects", "React", "Workers AI"],
    liveUrl: "https://kbot.pages.dev",
    media: [{ kind: "image", src: "", alt: "", pending: true }],
    presentation: "expanded",
    caseStudy: [
      {
        heading: "The constraint",
        body: "The rule set at the outset was that it had to run on free tiers. That is a product constraint wearing a budget constraint's clothes: it ruled out object storage, ruled out paid models as a silent fallback, and forced every decision about where state lives to be made deliberately instead of by reaching for the obvious managed service.",
      },
      {
        heading: "The agent runtime",
        body: "An agent turn is a bounded loop, not an open one. There is a cap on tool rounds, a cap on calls within a round, and a depth limit on how far a supervisor may delegate. Sensitive tools sit behind an approval step that pauses the run and resumes it on consent. A degenerate-run detector refuses to repeat an identical failing call after two attempts — which is what stops a confused agent burning an afternoon in a loop.",
      },
      {
        heading: "Security",
        body: "There is no password anywhere: authentication is passkeys, implemented directly rather than delegated to a service. Every tool that can reach the network passes through a dedicated SSRF guard, and the ones that fetch are restricted to named hosts with validated responses and a transport size cap.",
      },
      {
        heading: "Verification",
        body: "230 test files, an end-to-end suite driven by a virtual passkey authenticator, and continuous integration that runs a dependency audit, type checks, database migrations against a throwaway instance, and a check that every model still qualifies as free-tier.",
      },
    ],
    technicalDetails: [
      "Bounded agent loop: capped tool rounds, capped calls per round, depth-limited supervisor delegation.",
      "Approval-gated tools that pause and resume a run, rather than asking forgiveness afterwards.",
      "Degenerate-run detection — an identical failing call is refused after two attempts.",
      "WebAuthn passkey authentication implemented in-house; no password path exists at all.",
      "A dedicated SSRF guard module; network tools restricted to named hosts with validated responses.",
      "Durable Objects and Workflows for per-user background jobs.",
      "230 test files plus a Playwright end-to-end suite using a virtual passkey authenticator.",
    ],
    placeholder: false,
  },

  {
    slug: "repair-return-forecast",
    title: "Repair Return Prediction & Spare-Parts Forecast",
    discipline: "ai",
    summary:
      "An end-to-end analysis of 643,933 European repair records: predicting which devices come back, forecasting demand across 672 distinct spare parts, and delivering it as dashboards the business can actually open.",
    role: "Data analysis and modelling",
    year: "2025 — 2026",
    stack: ["Python", "pandas", "scikit-learn", "XGBoost", "statsmodels", "openpyxl"],
    media: [{ kind: "image", src: "", alt: "", pending: true }],
    presentation: "expanded",
    caseStudy: [
      {
        heading: "The data",
        body: "The source was a 136 MB Excel workbook with its headers on the fourth row and a parts column holding several part numbers per cell. Most of the work happened before any modelling: splitting that column to one row per part per job, then proving the counts still reconciled against the yearly totals. That assertion lives in the notebook and it passes — 643,933 raw job rows, 642,962 exploded spare-usage rows.",
      },
      {
        heading: "Two questions",
        body: "First, classification: will this device come back for repair again? Second, forecasting: how much of each of 672 part numbers will be needed next year. Spare-parts demand is intermittent — long runs of zero punctuated by spikes — which ordinary forecasting handles badly, so the demand side uses methods built for that shape specifically.",
      },
      {
        heading: "Delivery",
        body: "Results are written out as multi-sheet Excel workbooks with native charts, because the people who needed the answer work in Excel. A forecast nobody opens is not a forecast.",
      },
    ],
    technicalDetails: [
      "643,933 repair records spanning 2018 to 2025, reconciled by a row-count assertion inside the notebook.",
      "A multi-value parts column exploded to one row per part per job before any modelling began.",
      "Intermittent-demand forecasting across 672 distinct part numbers.",
      "Output written as multi-sheet Excel workbooks with native charts, usable without a notebook.",
    ],
    placeholder: false,
  },

  /* ---------------------------------------------------------------- */
  /* XR                                                                */
  /* ---------------------------------------------------------------- */

  {
    slug: "maluti-xr",
    title: "Maluti XR",
    discipline: "xr",
    summary:
      "A room-scale VR scene in Unity 6 with OpenXR: teleport movement, physics objects you can pick up, and an audio layer that reacts to how you actually move them rather than merely to the fact that you touched them.",
    role: "Interaction and audio scripting, scene assembly",
    year: "2025",
    stack: ["Unity 6", "C#", "OpenXR", "XR Interaction Toolkit", "Universal Render Pipeline"],
    media: [{ kind: "image", src: "", alt: "", pending: true }],
    presentation: "expanded",
    caseStudy: [
      {
        heading: "Context",
        body: "Built as structured XR coursework, configured for both standalone headsets and desktop. The rig is assembled from the XR Interaction Toolkit — grab interactables, teleport anchors, snap volumes — rather than written from scratch, which is the normal and correct way to build an OpenXR scene.",
      },
      {
        heading: "The original part",
        body: "The code that is mine is the audio layer, and it is the part worth showing. A bottle of liquid sloshes based on both how fast it is moving and how far it has rotated since the previous frame, gated by a cooldown so that shaking it does not machine-gun the sample. A lantern separates its pickup, drop, movement and collision sounds. Both pick from clip arrays and randomise pitch slightly, so repeated interaction never sounds mechanical.",
      },
    ],
    technicalDetails: [
      "Liquid audio driven by both rigidbody velocity and frame-to-frame rotation angle, with a configurable cooldown.",
      "Grab callbacks subscribed on enable and unsubscribed on disable — no leaked handlers.",
      "Pitch randomised per trigger and clips drawn from arrays, so repetition is never audible.",
      "Learning-stage work: a coursework scene built on licensed asset packs, not a shipped product.",
    ],
    placeholder: false,
  },

  {
    slug: "forklift-pipeline",
    title: "Forklift — Maya to Unity pipeline",
    discipline: "xr",
    summary:
      "A forklift and its yard environment, modelled and textured for real-time use — built with its moving parts separated and named so an engine can drive them, rather than as a single sealed mesh.",
    role: "Modelling, texturing and export pipeline",
    year: "2026",
    stack: ["Autodesk Maya", "Substance Painter", "FBX", "Unity"],
    media: [{ kind: "image", src: "", alt: "", pending: true }],
    presentation: "compact",
    technicalDetails: [
      "Functional parts modelled as separately named nodes — forks, brake, accelerator — so they can be animated or driven in-engine.",
      "A dedicated export target, with the source-to-export chain recorded in the FBX metadata.",
    ],
    placeholder: false,
  },

  /* ---------------------------------------------------------------- */
  /* CREATIVE                                                          */
  /* ---------------------------------------------------------------- */

  {
    slug: "fire-safety-set",
    title: "Fire Safety — interior set",
    discipline: "creative",
    summary:
      "A three-room domestic interior — kitchen, living room, bedroom — modelled and textured around fire-safety props, and built to be handed to a real-time engine rather than rendered once and filed away.",
    role: "Modelling and texturing",
    year: "2025",
    stack: ["Autodesk Maya", "Substance Painter", "FBX"],
    media: [{ kind: "image", src: "", alt: "", pending: true }],
    presentation: "compact",
    technicalDetails: [
      "Scenes organised into named sub-assemblies rather than loose geometry.",
      "Texture sets exported to the engine's own channel-packing naming convention, so they import without rewiring.",
    ],
    placeholder: false,
  },

  {
    slug: "crown-splash-sim",
    title: "Crown Splash — fluid study",
    discipline: "creative",
    summary:
      "A liquid simulation of a droplet impact, iterated across four tuned versions and surfaced to a mesh rather than left as particles — which is the difference between a physics demo and something you can light.",
    role: "Simulation and rendering",
    year: "2025",
    stack: ["Blender", "Mantaflow", "Fluid simulation"],
    media: [{ kind: "image", src: "", alt: "", pending: true }],
    presentation: "compact",
    technicalDetails: [
      "Four iterations, each with its own baked cache — the tuning is the work.",
      "Liquid surfaced to a mesh and rendered out to video, rather than captured from the viewport.",
    ],
    placeholder: false,
  },

  {
    slug: "cxi-social-series",
    title: "CXI-Africa — content series",
    discipline: "creative",
    summary:
      "A sustained weekly content programme: short vertical videos with matched cover frames, course creatives and recurring tip slots, held to a single visual identity across every platform for months on end.",
    role: "Design and content production",
    year: "2025",
    stack: ["Vertical video", "Social design", "Brand systems", "Analytics"],
    media: [{ kind: "image", src: "", alt: "", pending: true }],
    presentation: "compact",
    technicalDetails: [
      "A consistent delivery convention — every post ships as a video plus a matched cover frame.",
      "Weekly performance capture across three platforms, kept as a time series rather than as one-off screenshots.",
    ],
    placeholder: false,
  },

  /* ---------------------------------------------------------------- */
  /* SECURITY                                                          */
  /* ---------------------------------------------------------------- */

  {
    slug: "local-execution-gateway",
    title: "Local Execution Gateway",
    discipline: "security",
    summary:
      "A service that lets a cloud-hosted AI assistant run commands on your own machine — which is a security problem first and a feature second, and is built in that order.",
    role: "Sole author",
    year: "2026",
    stack: ["Python", "FastAPI", "Server-Sent Events", "Windows Job Objects"],
    media: [{ kind: "image", src: "", alt: "", pending: true }],
    presentation: "expanded",
    caseStudy: [
      {
        heading: "The threat model",
        body: "Giving a language model a shell is the kind of feature that reads as convenient and behaves as a vulnerability. The design assumption is that the model may be wrong, confused, or steered by something it has just read — so every control sits on the machine side, where the model cannot argue with it.",
      },
      {
        heading: "The controls",
        body: "Commands execute as argument arrays and never as a shell string, which removes an entire class of injection rather than filtering for it. Execution is confined to allowed roots with denied executables, timeouts and output caps, and is wrapped in an operating-system job object so a spawned process tree can be killed as a unit. A three-mode policy decides whether each command runs, asks, or is refused outright; in ask mode it requires a one-time token minted only after a human clicks Approve. Outbound fetching is off by default, read-only when enabled, and blocks private address ranges.",
      },
    ],
    technicalDetails: [
      "argv-only execution — no shell string is ever constructed, which removes shell injection as a category.",
      "Allowed roots, denied executables, timeouts and output caps enforced before launch.",
      "An OS job object contains the whole spawned process tree so it can be terminated as one.",
      "Three-mode policy (ask / always allow / never) with one-time approval tokens in ask mode.",
      "Optional egress proxy restricted to read-only methods, off by default, private ranges blocked.",
    ],
    placeholder: false,
  },
];

/* ------------------------------------------------------------------ */
/* Skills — exactly the supplied list. Nothing invented.               */
/* ------------------------------------------------------------------ */

/**
 * SKILLS — verified. Nothing here is inferred.
 *
 * IMPORTANT DISTINCTION: this is Keathan's own skill set. It is NOT the
 * portfolio's tech stack. The site itself is built with Next.js, React,
 * Three.js and GSAP; only the technologies genuinely in his skill list
 * appear below. Professional experience is never implied from a technology
 * merely because this site happens to use it. Do not merge the two.
 *
 * `tier` is an editorial weighting, not a proficiency score:
 *   primary     the tools the work runs on. These are what a discipline
 *               world shows as its signature line.
 *   secondary   regularly used — listed, unemphasised
 *   supporting  known and used, but not headline. Set back in an expanded
 *               Skills Arsenal row rather than given equal weight — the
 *               security toolset alone is 28 entries, and flattening them
 *               all to the same emphasis turns the section into a wall.
 *
 * Every tier is rendered at every breakpoint. Tier changes emphasis, never
 * presence: no skill is hidden from anyone on any device.
 */
export const skillGroups: SkillGroup[] = [
  {
    id: "programming",
    label: "Software Engineering",
    discipline: "software",
    skills: [
      { name: "Python", disciplines: ["software", "ai"], tier: "primary", note: "Scripting, data and automation", related: ["Machine Learning", "Data Analytics"] },
      { name: "JavaScript", disciplines: ["software"], tier: "primary", note: "Application logic", related: ["TypeScript", "ReactJS"] },
      { name: "TypeScript", disciplines: ["software"], tier: "primary", note: "Typed application development", related: ["ReactJS", "JavaScript"] },
      { name: "ReactJS", disciplines: ["software", "creative"], tier: "primary", note: "Interface development", related: ["TypeScript", "CSS"] },
      { name: "C#", disciplines: ["software", "xr"], tier: "secondary", note: "Engine and application code", related: ["Unity"] },
      { name: "C++", disciplines: ["software"], tier: "secondary", note: "Systems-level programming", related: ["C#"] },
      { name: "HTML", disciplines: ["software", "creative"], tier: "secondary", note: "Structure and semantics", related: ["CSS"] },
      { name: "CSS", disciplines: ["software", "creative"], tier: "secondary", note: "Layout and styling", related: ["HTML", "ReactJS"] },
    ],
  },
  {
    id: "xr3d",
    label: "XR Development",
    discipline: "xr",
    skills: [
      { name: "Maya", disciplines: ["xr"], tier: "primary", note: "Modelling and animation", related: ["ZBrush", "Substance Painter"] },
      { name: "Blender", disciplines: ["xr"], tier: "primary", note: "Modelling, animation and VFX", related: ["Substance Painter"] },
      { name: "ZBrush", disciplines: ["xr"], tier: "primary", note: "Digital sculpting", related: ["Maya", "Substance Painter"] },
      { name: "Substance Painter", disciplines: ["xr"], tier: "primary", note: "Texturing and materials", related: ["Blender", "Maya"] },
      { name: "Houdini", disciplines: ["xr"], tier: "supporting", note: "Visual effects", related: ["Blender"] },
      { name: "Unity", disciplines: ["xr", "software"], tier: "primary", note: "Real-time engine and XR runtime", related: ["C#"] },
      { name: "OpenXR", disciplines: ["xr"], tier: "secondary", note: "Cross-vendor XR runtime standard", related: ["Unity"] },
      { name: "FBX pipeline", disciplines: ["xr", "creative"], tier: "secondary", note: "Game-ready export and engine handoff", related: ["Maya", "Unity"] },
      { name: "Unreal Engine", disciplines: ["xr"], tier: "supporting", note: "Real-time environments", related: ["Maya", "ZBrush"] },
    ],
  },
  {
    id: "design",
    label: "Creative",
    discipline: "creative",
    skills: [
      { name: "Adobe Creative Cloud", disciplines: ["creative"], tier: "primary", note: "Graphic, motion and digital art", related: ["Figma"] },
      { name: "Figma", disciplines: ["creative", "software"], tier: "primary", note: "Interface and systems design", related: ["Adobe Creative Cloud", "ReactJS"] },
      { name: "UI / UX Design", disciplines: ["creative", "software"], tier: "primary", note: "Interface and experience design", related: ["Figma"] },
      { name: "Brand Identity Design", disciplines: ["creative"], tier: "primary", note: "Identity systems", related: ["Visual Communication"] },
      { name: "Digital Art Design", disciplines: ["creative"], tier: "secondary", note: "Illustration and digital artwork", related: ["Adobe Creative Cloud"] },
      { name: "Visual Communication", disciplines: ["creative"], tier: "secondary", note: "Message, hierarchy and composition", related: ["Brand Identity Design"] },
    ],
  },
  {
    id: "data",
    label: "Data Science",
    discipline: "ai",
    skills: [
      { name: "Data Analytics", disciplines: ["ai"], tier: "primary", note: "Analysis and interpretation", related: ["Python", "Power BI"] },
      { name: "Data Visualisation", disciplines: ["ai", "creative"], tier: "primary", note: "Making data legible", related: ["Plotly", "Tableau"] },
      { name: "Machine Learning", disciplines: ["ai"], tier: "primary", note: "Growing expertise — experiments and modelling", related: ["Scikit-learn", "Python"] },
      { name: "TensorFlow", disciplines: ["ai"], tier: "secondary", note: "Growing expertise", related: ["PyTorch"] },
      { name: "PyTorch", disciplines: ["ai"], tier: "secondary", note: "Growing expertise", related: ["TensorFlow"] },
      { name: "Scikit-learn", disciplines: ["ai"], tier: "primary", note: "Classification and model selection", related: ["Python"] },
      { name: "pandas", disciplines: ["ai"], tier: "primary", note: "Dataframe work on large, messy sources", related: ["Python", "NumPy"] },
      { name: "NumPy", disciplines: ["ai"], tier: "secondary", note: "Numerical arrays underneath everything", related: ["pandas"] },
      { name: "XGBoost", disciplines: ["ai"], tier: "secondary", note: "Gradient-boosted trees", related: ["Scikit-learn"] },
      { name: "statsmodels", disciplines: ["ai"], tier: "secondary", note: "Statistical and time-series modelling", related: ["pandas"] },
      { name: "Jupyter", disciplines: ["ai"], tier: "secondary", note: "Exploratory analysis and narrative", related: ["Python", "pandas"] },
      { name: "LLM agent systems", disciplines: ["ai", "software"], tier: "primary", note: "Tool-calling runtimes with bounded loops", related: ["TypeScript", "Cloudflare Workers"] },
      { name: "Power BI", disciplines: ["ai"], tier: "secondary", note: "Reporting and dashboards", related: ["Tableau"] },
      { name: "Plotly", disciplines: ["ai"], tier: "supporting", note: "Charting", related: ["Python"] },
      { name: "D3.js", disciplines: ["ai"], tier: "supporting", note: "Custom visualisation", related: ["JavaScript"] },
      { name: "Tableau", disciplines: ["ai"], tier: "supporting", note: "Reporting and dashboards", related: ["Power BI"] },
      { name: "AWS", disciplines: ["ai"], tier: "supporting", note: "Cloud data platform" },
      { name: "GCP", disciplines: ["ai"], tier: "supporting", note: "Cloud data platform" },
      { name: "Azure", disciplines: ["ai"], tier: "supporting", note: "Cloud data platform" },
      { name: "Databricks", disciplines: ["ai"], tier: "supporting", note: "Data platform" },
    ],
  },
  {
    id: "security",
    label: "Cybersecurity",
    discipline: "security",
    skills: [
      { name: "Kali Linux", disciplines: ["security"], tier: "secondary", note: "Currently developing", related: ["Metasploit", "Nmap"] },

      /* BUILT, not merely studied. Each of these is load-bearing in a real
         system in the projects list above, which is why they outrank the
         offensive tooling rather than sitting beneath it. */
      { name: "WebAuthn / Passkeys", disciplines: ["security", "software"], tier: "primary", note: "Passwordless auth, implemented in-house", related: ["TypeScript"] },
      { name: "Row Level Security", disciplines: ["security", "software"], tier: "primary", note: "Authorisation enforced in the database", related: ["PostgreSQL", "Supabase"] },
      { name: "SSRF guarding", disciplines: ["security", "software"], tier: "primary", note: "Egress allowlisting and private-range blocking", related: ["Cloudflare Workers"] },
      { name: "Sandboxed execution", disciplines: ["security"], tier: "primary", note: "argv-only commands inside OS job objects", related: ["Python"] },
      { name: "Security CI", disciplines: ["security", "software"], tier: "primary", note: "Secret, dependency and container scanning as a merge gate", related: ["GitHub Actions"] },
      { name: "Threat modelling", disciplines: ["security"], tier: "secondary", note: "Deciding what must not be possible, first" },
      { name: "Semgrep", disciplines: ["security"], tier: "secondary", note: "Static analysis in the pipeline", related: ["Security CI"] },
      { name: "Gitleaks", disciplines: ["security"], tier: "secondary", note: "Secret scanning in the pipeline", related: ["Security CI"] },
      { name: "Trivy", disciplines: ["security"], tier: "secondary", note: "Container and dependency scanning", related: ["Security CI"] },
      { name: "OWASP ZAP", disciplines: ["security"], tier: "secondary", note: "Dynamic application scanning", related: ["Security CI"] },

      { name: "Burp Suite", disciplines: ["security"], tier: "secondary", note: "Currently developing — web exploitation", related: ["Nmap"] },
      { name: "Wireshark", disciplines: ["security"], tier: "secondary", note: "Currently developing — traffic analysis", related: ["Nmap"] },
      { name: "Nmap", disciplines: ["security"], tier: "secondary", note: "Currently developing — reconnaissance", related: ["Kali Linux"] },
      { name: "Metasploit", disciplines: ["security"], tier: "secondary", note: "Currently developing — exploitation", related: ["Kali Linux"] },
      { name: "Ghidra", disciplines: ["security"], tier: "supporting", note: "Currently developing — reverse engineering", related: ["IDA Pro"] },
      { name: "Splunk", disciplines: ["security"], tier: "supporting", note: "Currently developing — SIEM", related: ["Elastic SIEM"] },
      { name: "Volatility", disciplines: ["security"], tier: "supporting", note: "Currently developing — memory forensics" },
      { name: "IDA Pro", disciplines: ["security"], tier: "supporting", note: "Currently developing", related: ["Ghidra"] },
      { name: "AWS Security", disciplines: ["security"], tier: "supporting", note: "Currently developing" },
      { name: "Azure Sentinel", disciplines: ["security"], tier: "supporting", note: "Currently developing" },
      { name: "Cloudflare", disciplines: ["security"], tier: "supporting", note: "Currently developing" },
      { name: "Terraform", disciplines: ["security"], tier: "supporting", note: "Currently developing" },
      { name: "QRadar", disciplines: ["security"], tier: "supporting", note: "Currently developing" },
      { name: "ArcSight", disciplines: ["security"], tier: "supporting", note: "Currently developing" },
      { name: "Elastic SIEM", disciplines: ["security"], tier: "supporting", note: "Currently developing", related: ["Splunk"] },
      { name: "MISP", disciplines: ["security"], tier: "supporting", note: "Currently developing" },
      { name: "ThreatConnect", disciplines: ["security"], tier: "supporting", note: "Currently developing" },
      { name: "Recorded Future", disciplines: ["security"], tier: "supporting", note: "Currently developing" },
      { name: "VirusTotal", disciplines: ["security"], tier: "supporting", note: "Currently developing" },
      { name: "Phantom", disciplines: ["security"], tier: "supporting", note: "Currently developing" },
      { name: "Demisto", disciplines: ["security"], tier: "supporting", note: "Currently developing" },
      { name: "Swimlane", disciplines: ["security"], tier: "supporting", note: "Currently developing" },
      { name: "SOAR", disciplines: ["security"], tier: "supporting", note: "Currently developing" },
      { name: "CrowdStrike", disciplines: ["security"], tier: "supporting", note: "Currently developing" },
      { name: "SentinelOne", disciplines: ["security"], tier: "supporting", note: "Currently developing" },
      { name: "Carbon Black", disciplines: ["security"], tier: "supporting", note: "Currently developing" },
      { name: "Cortex XDR", disciplines: ["security"], tier: "supporting", note: "Currently developing" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* CV                                                                  */
/* ------------------------------------------------------------------ */

/**
 * EXPERIENCE — roles are verified. Two organisations are. Dates are NOT.
 *
 * Unknown fields are the EMPTY STRING, and the CV component now omits the
 * element entirely rather than rendering a stranded separator. The previous
 * pass used the literal "TODO" as a visible marker, which was right while
 * this was a private draft and wrong the moment it became a public site: it
 * put the word TODO on a stranger's screen beside a real person's name.
 *
 * Empty is the honest state. It is also the one the type comments already
 * promised — "the UI renders nothing at all when it is absent".
 *
 * STILL NEEDED FROM KEATHAN, and not inventable from any file on disk:
 * the Verifone dates and description, the Graphic Designer description,
 * and the organisation behind the XR, 3D/VFX, data and security roles.
 *
 * `placeholder` is false because these are real roles.
 */
export const experience: ExperienceEntry[] = [
  {
    id: "exp-data-analyst",
    organisation: "Verifone",
    role: "Senior Data Analyst",
    period: "",
    // TODO — no description supplied for this role.
    summary: "",
    highlights: [],
    placeholder: false,
  },
  {
    id: "exp-creative-designer",
    organisation: "Kommar Technologies",
    role: "Creative Designer",
    period: "",
    summary:
      "Created digital assets including advertising creatives, landing pages, email templates, website content and social campaigns. Developed brand identities and visual communication systems. Worked with performance metrics including CTR, conversion rates and ROI. Used A/B testing and iterative design to improve creative performance. Used generative AI tools to accelerate concept development and creative production.",
    highlights: [],
    placeholder: false,
  },
  {
    id: "exp-xr-developer",
    organisation: "",
    role: "XR Developer",
    period: "",
    summary:
      "Developing immersive VR/AR experiences using Unity and Unreal Engine. Building interactive 3D environments and real-time experiences.",
    highlights: [],
    placeholder: false,
  },
  {
    id: "exp-3d-vfx",
    organisation: "",
    role: "Animator, 3D Modeller & VFX Artist",
    period: "",
    summary:
      "Produced advanced 3D models and character animations using Maya and Blender. Created VFX using Houdini and industry-standard compositing tools. Performed texturing and digital sculpting with Substance Painter and ZBrush.",
    highlights: [],
    placeholder: false,
  },
  {
    id: "exp-graphic-designer",
    organisation: "",
    role: "Graphic Designer",
    period: "",
    // TODO — no description supplied for this role.
    summary: "",
    highlights: [],
    placeholder: false,
  },
  {
    id: "exp-data-ai",
    organisation: "",
    role: "Data Science & AI/ML Practitioner",
    period: "",
    summary:
      "Conducted Python-based data analysis, feature engineering and machine learning experiments. Applied statistical modelling for insights and predictive analytics. Growing expertise in TensorFlow, PyTorch and Scikit-learn.",
    highlights: [],
    placeholder: false,
  },
  {
    id: "exp-cyber-analyst",
    organisation: "",
    role: "Junior Cybersecurity Analyst",
    period: "",
    summary:
      "Studying ethical hacking through platforms including TryHackMe and related hands-on environments. Learning network defense, threat analysis and security tools. Practicing CTF-style challenges.",
    highlights: [],
    placeholder: false,
  },
];

/**
 * Professional development.
 *
 * The only place capability levels are stated. `weight` is a relative
 * visual measure with no number attached — never rendered as a percentage,
 * because a percentage would be a fabricated precision about a person.
 *
 * The Data Science and Cybersecurity weights are held deliberately low: both
 * were specified as growing/junior, and flattening them level with XR
 * Development would misrepresent him.
 */
export const professionalDevelopment: ProfessionalDevelopmentEntry[] = [
  {
    discipline: "software",
    label: "Software Engineering",
    level: "Advanced / Broad",
    weight: 0.92,
    note: "Several substantial systems across Go, TypeScript and Python; two deployed.",
  },
  {
    discipline: "ai",
    label: "Data & Applied AI",
    level: "Intermediate → Advanced",
    weight: 0.78,
    note: "An agent runtime in production, and client-scale analysis of 643,933 records.",
  },
  {
    discipline: "creative",
    label: "Creative",
    level: "Intermediate → Advanced",
    weight: 0.72,
    note: "Months of modelling and texturing; a shipped multi-week content programme.",
  },
  {
    discipline: "security",
    label: "Security Engineering",
    level: "Intermediate → Advanced",
    weight: 0.62,
    note: "Auth, authorisation and sandboxing built into real systems, plus a security pipeline.",
  },
  {
    discipline: "xr",
    label: "XR Development",
    level: "Growing",
    weight: 0.42,
    note: "Strong asset pipeline; the engine side is one coursework OpenXR scene.",
  },
];

/**
 * CERTIFICATIONS — confirmed by Keathan directly, and transcribed from his
 * own CV rather than paraphrased: nine Cisco Networking Academy credentials
 * and the CXI-Africa XR Developer Certificate.
 *
 * Note that "Junior Cybersecurity Analyst" is one of the Cisco credentials.
 * An earlier CV used it as a job title in its header, which overstated it in
 * one direction while understating the certification in the other.
 *
 * Issue dates were never supplied, so `issued` is empty and the component
 * prints the issuer alone. No date has been guessed.
 */
export const certifications: Certification[] = [
  { id: "cert-endpoint-security", name: "Endpoint Security", issuer: "Cisco Networking Academy", issued: "", placeholder: false },
  { id: "cert-network-defense", name: "Network Defense", issuer: "Cisco Networking Academy", issued: "", placeholder: false },
  { id: "cert-cyber-threat-management", name: "Cyber Threat Management", issuer: "Cisco Networking Academy", issued: "", placeholder: false },
  { id: "cert-ethical-hacker", name: "Ethical Hacker", issuer: "Cisco Networking Academy", issued: "", placeholder: false },
  { id: "cert-junior-cyber-analyst", name: "Junior Cybersecurity Analyst", issuer: "Cisco Networking Academy", issued: "", placeholder: false },
  { id: "cert-data-analytics", name: "Data Analytics", issuer: "Cisco Networking Academy", issued: "", placeholder: false },
  { id: "cert-networking-basics", name: "Networking Basics", issuer: "Cisco Networking Academy", issued: "", placeholder: false },
  { id: "cert-network-devices", name: "Network Devices & Initial Configuration", issuer: "Cisco Networking Academy", issued: "", placeholder: false },
  { id: "cert-python", name: "Python", issuer: "Cisco Networking Academy", issued: "", placeholder: false },
  {
    id: "cert-xr-developer",
    name: "XR Developer Certificate",
    issuer:
      "CXI-Africa (Centre for Digital Transformation and Innovation Africa)",
    issued: "",
    placeholder: false,
  },
];

/**
 * TRAINING — ongoing study. Verified from the cybersecurity description.
 */
export const training: TrainingEntry[] = [
  {
    id: "training-ethical-hacking",
    name: "Ethical hacking — hands-on practice",
    provider: "TryHackMe and related hands-on environments",
    period: "",
    inProgress: true,
    placeholder: false,
  },
];

/**
 * LANGUAGES — verified.
 */
export const languages: LanguageEntry[] = [
  { name: "English", level: "Native" },
  { name: "Afrikaans", level: "Proficient" },
];

/**
 * TIMELINE — the ordering is honest; the dates are unknown and therefore
 * empty, so the component omits the period line rather than printing a
 * placeholder. Project years do exist and are set per project above, dated
 * from repository history and file metadata rather than from memory.
 */
export const timeline: TimelineEntry[] = [
  {
    id: "tl-creative",
    period: "",
    title: "Creative and design practice",
    detail: "Brand identity, digital art, UI/UX and campaign creative.",
    discipline: "creative",
    placeholder: false,
  },
  {
    id: "tl-3d",
    period: "",
    title: "3D, animation and VFX",
    detail: "Modelling, character animation, sculpting, texturing and VFX.",
    discipline: "xr",
    placeholder: false,
  },
  {
    id: "tl-software",
    period: "",
    title: "Software development",
    detail: "Application and interface development.",
    discipline: "software",
    placeholder: false,
  },
  {
    id: "tl-data",
    period: "",
    title: "Data and AI/ML",
    detail: "Data analysis, visualisation and machine learning experiments.",
    discipline: "ai",
    placeholder: false,
  },
  {
    id: "tl-security",
    period: "Current",
    title: "Cybersecurity",
    detail: "Actively developing this capability.",
    discipline: "security",
    placeholder: false,
  },
];

/* ------------------------------------------------------------------ */
/* Currently building / learning                                       */
/* ------------------------------------------------------------------ */

export const currentlyBuilding: CurrentlyBuilding[] = [
  {
    id: "cb-at-leisure",
    title: "At Leisure — page-to-text quality",
    discipline: "software",
    status: "building",
    note: "Sharpening the on-device OCR pipeline: column detection, de-hyphenation, and how clean the text is once it is reassembled.",
    placeholder: false,
  },
  {
    id: "cb-kbot-devices",
    title: "Kbot — device control",
    discipline: "ai",
    status: "building",
    note: "Letting the assistant act on a paired phone, with every action behind an explicit approval.",
    placeholder: false,
  },
  {
    id: "cb-vantage",
    title: "Vantage — risk coverage",
    discipline: "security",
    status: "building",
    note: "Widening the risk-check surface and keeping the security pipeline green as it grows.",
    placeholder: false,
  },
  {
    id: "cb-xr-engine",
    title: "XR — the engine half",
    discipline: "xr",
    status: "studying",
    note: "Closing the gap between the asset pipeline, which is solid, and the runtime side, which is not yet.",
    placeholder: false,
  },
  {
    id: "cb-3d-renders",
    title: "3D — finishing and rendering",
    discipline: "creative",
    status: "building",
    note: "Taking the modelled interior and prop sets through lighting and render, so the work can be seen rather than described.",
    placeholder: false,
  },
];

/* ------------------------------------------------------------------ */
/* Beyond the code                                                     */
/* ------------------------------------------------------------------ */

export const beyond: BeyondEntry[] = [
  { id: "b-1", label: "3D", media: { kind: "image", src: "", alt: "", pending: true } },
  { id: "b-2", label: "VFX", media: { kind: "image", src: "", alt: "", pending: true } },
  { id: "b-3", label: "Motion", media: { kind: "image", src: "", alt: "", pending: true } },
  { id: "b-4", label: "Visual design", media: { kind: "image", src: "", alt: "", pending: true } },
];

/* ------------------------------------------------------------------ */
/* Selectors — keep filtering logic out of components                  */
/* ------------------------------------------------------------------ */

export function projectsByDiscipline(id: DisciplineId): Project[] {
  return projects.filter((p) => p.discipline === id);
}

export function skillGroupsByDiscipline(id: DisciplineId): SkillGroup[] {
  return skillGroups.filter((g) => g.discipline === id);
}

export function currentlyBuildingByDiscipline(
  id: DisciplineId,
): CurrentlyBuilding[] {
  return currentlyBuilding.filter((c) => c.discipline === id);
}

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
