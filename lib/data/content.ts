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
 * Every non-placeholder project below is REAL, and was characterised from
 * the source files, repository or CV it belongs to rather than from memory.
 * The standing rule applies without exception: no invented project, metric,
 * certification, client or link.
 *
 * Entries carrying `placeholder: true` are the opposite claim, stated
 * openly: a slot held for work that exists but has not been written up yet.
 * The card labels them, so nobody mistakes one for finished work.
 *
 * WHAT IS DELIBERATELY ABSENT, and why:
 *
 *   - `media` is `pending: true` everywhere. There is real imagery on disk
 *     for the 3D and content work, but none of it has been brought in,
 *     sized or captioned yet. A pending marker renders as a composed frame;
 *     it never fabricates a screenshot.
 *
 *   - No accuracy, conversion or performance figure appears anywhere that
 *     it could not be reconciled against a file.
 *
 *   - Only verified links appear. Every URL here resolves to something that
 *     exists and is public.
 *
 *   - NEXUS and Atlas are stated as never deployed, in their own first
 *     lines, because they are not. Several specific claims their own
 *     documentation makes were left out after they failed verification
 *     against the source: Atlas's test and package counts, and NEXUS's
 *     audit-trail immutability, webhook replay and delivery pipeline. The
 *     rule is the same one as everywhere else in this file \u2014 a README is a
 *     claim, not evidence.
 *
 *   - Forge is absent deliberately, not by oversight. It is a real and
 *     substantial repository, but its two strongest claims are each already
 *     made better here by another project: a small pure core proved without
 *     infrastructure is Vantage's thesis, and correctness across processes
 *     that die independently is NEXUS's \u2014 and NEXUS drives real containers
 *     where Forge's worker only ever runs handlers it defines itself.
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
    slug: "nexus",
    title: "NEXUS",
    discipline: "software",
    summary:
      "A control plane for software delivery, built so several worker processes can compete for the same queue with no coordinator between them: a worker claims a job from Postgres under a lease, and a crashed worker is nothing more than a lease that expired. It runs against Docker or a local kind cluster and has never been pointed at anything beyond one machine.",
    role: "Sole author \u2014 Go services, schema, reconciliation, Kubernetes path",
    year: "2026",
    stack: ["Go", "PostgreSQL", "NATS JetStream", "Kubernetes", "Docker", "Next.js", "TypeScript"],
    repositoryUrl: "https://github.com/Keathan2609/nexus-control-plane",
    media: [{ kind: "image", src: "", alt: "", pending: true }],
    presentation: "expanded",
    caseStudy: [
      {
        heading: "Context",
        body: "Delivery tooling is a pile of scripts until something dies halfway through. The question this is built around is not how fast a pipeline runs but what is true afterwards if the process running it is killed at the worst possible moment \u2014 which is the moment it will eventually be killed at.",
      },
      {
        heading: "Claimed, never assigned",
        body: "There is no scheduler handing work out, because a scheduler is a thing that can itself go down and take the map of who-has-what with it. Workers compete for the same table: one UPDATE whose subquery selects FOR UPDATE SKIP LOCKED and takes a lease. No leader election, no worker registry, no partition map to keep in agreement with reality. A worker that dies holds a lease that stops being renewed, and that is the whole of the recovery story.",
      },
      {
        heading: "Earning the word healthy",
        body: "The deployment state table has no edge from DEPLOYING to HEALTHY. A release has to pass through VERIFYING and is accepted only after three consecutive successful probes against the running application, with one failure resetting the count to zero \u2014 so a release cannot be marked good because it started, only because it kept answering.",
      },
    ],
    technicalDetails: [
      "Workers claim jobs with one UPDATE over a FOR UPDATE SKIP LOCKED subquery, taking a lease rather than an assignment.",
      "Heartbeat and completion both carry AND worker_id = $2, so a worker whose lease was already reclaimed cannot resume ownership of work someone else is now running.",
      "Events reach NATS only through an outbox whose write function takes a transaction rather than a pool, so an event cannot be emitted outside the transaction that caused it.",
      "One live deployment per environment is a partial unique index, and promotion supersedes the previous release inside the same transaction that marks the new one healthy, so the index is never momentarily violated.",
      "GitHub webhooks are verified with HMAC-SHA256 and de-duplicated by a unique index on provider and delivery id, so a redelivery loses the race instead of starting a second build of the same commit.",
      "The Kubernetes path drives kubectl directly \u2014 apply, rollout status, and reading pod events when a rollout stalls \u2014 against a local kind cluster.",
      "Reconciliation is one ticker over nine independent steps, each failure logged and stepped past, so drift detection going wrong cannot stop leases being reclaimed.",
      "152 Go test functions across 16 files. Nine need live Postgres and NATS behind a build tag, so a clean checkout exercises the planner, state transitions and RBAC but not the deployment path \u2014 which is the half that matters most and the gap worth naming.",
    ],
    placeholder: false,
  },

  {
    slug: "freevoices",
    title: "FreeVoices",
    discipline: "software",
    summary:
      "An invoicing and quoting system for small businesses \u2014 customers, products, quotes, invoices, payments and a client portal \u2014 written once in Angular and shipped as both a website and an Android app, with a single Express service and a thirteen-table schema behind it.",
    role: "Sole author \u2014 product, Angular client, Express API, schema, release",
    year: "2026",
    stack: ["Angular", "Ionic", "Capacitor", "TypeScript", "Express", "MySQL", "PDFKit", "Chart.js"],
    repositoryUrl: "https://github.com/Keathan2609/freevoices",
    media: [{ kind: "image", src: "", alt: "", pending: true }],
    presentation: "expanded",
    caseStudy: [
      {
        heading: "Context",
        body: "Invoicing software is either expensive or it is a spreadsheet. The gap is a small business that needs to raise a quote, turn it into an invoice, send it, chase it when it goes unpaid, and keep a record that still balances afterwards \u2014 without paying per seat for the privilege. FreeVoices is that, as one codebase that runs in a browser and installs as an Android app.",
      },
      {
        heading: "One document, several states",
        body: "A quote and an invoice are the same record at different points in its life, so they share one documents table rather than two near-identical ones. Each document carries its line items, its tracking history and its payments separately, which keeps what was changed and what has actually been paid as two different facts instead of one hopeful status field.",
      },
      {
        heading: "The parts that run without you",
        body: "Three jobs run every night: one raises the invoices due to recur, one marks overdue invoices overdue, and one anonymises accounts that asked to be deleted. That last job is why the sign-in path has to handle a user whose password hash is deliberately null \u2014 a deleted account has to stay deleted without taking its invoice history with it, because the books still have to balance after someone leaves.",
      },
    ],
    technicalDetails: [
      "One Angular 18 codebase, delivered as a web app and as a Capacitor Android build.",
      "Thirteen-table MySQL schema with a forward-only migration runner supporting --status and --dry-run.",
      "Argon2 password hashing, with tiered rate limits on the auth routes specifically because every attempt costs an expensive verify.",
      "Google sign-in alongside local accounts, including the case where an account has no password hash at all.",
      "Server-side PDF invoices; logo uploads capped at 5 MB, restricted to JPEG and PNG, stored under unguessable filenames.",
      "Nightly jobs for recurring invoices, overdue marking and account anonymisation.",
      "Privacy policy, terms and an account-deletion route shipped as part of the product rather than bolted on for a store listing.",
    ],
    placeholder: false,
  },

  {
    slug: "atlas",
    title: "Atlas",
    discipline: "software",
    summary:
      "A multi-tenant team workspace \u2014 organisations, workspaces, projects, work items, members, API keys and an audit log \u2014 built around a single problem: making it structurally impossible for one tenant to read another\u2019s data, rather than something every query has to remember. It runs locally from a Docker stack and has never been deployed.",
    role: "Sole author \u2014 schema, isolation model, API, web client, tests",
    year: "2026",
    stack: ["TypeScript", "NestJS", "Prisma", "PostgreSQL", "Redis", "Next.js", "Turborepo", "Playwright"],
    repositoryUrl: "https://github.com/Keathan2609/atlas-multitenant-platform",
    media: [{ kind: "image", src: "", alt: "", pending: true }],
    presentation: "expanded",
    caseStudy: [
      {
        heading: "Context",
        body: "In a multi-tenant product the worst bug is not a crash, it is a query that quietly returns somebody else\u2019s rows. The usual defence is discipline \u2014 remember the tenant filter, every time, forever, including the developer who joins next year. Discipline is not a control. The whole design here is an attempt to make the mistake unavailable rather than merely discouraged.",
      },
      {
        heading: "Three layers that do not depend on each other",
        body: "Composite foreign keys carry the organisation id, so a cross-tenant reference is refused by Postgres whatever the application believes. A Prisma client extension intercepts every operation and injects the tenant filter \u2014 an extension rather than a repository wrapper, because a wrapper only protects the people who remember to use it, while a scoped client cannot issue an unscoped query at all. Above both, HTTP guards resolve the tenant before any service runs.",
      },
      {
        heading: "Making the rule impossible to forget",
        body: "A boot-time assertion reads Prisma\u2019s runtime data model and refuses to start the API if any model is registered neither as tenant-owned nor as deliberately excluded, each exclusion carrying its reason in code. So adding a table without deciding what it belongs to is not an oversight that ships \u2014 it is a server that will not boot.",
      },
    ],
    technicalDetails: [
      "Seven relations reference [organizationId, id] rather than id alone, so cross-tenant references are rejected by the database itself.",
      "Tenant scoping is a Prisma client extension intercepting $allOperations, not a repository wrapper that developers must remember to use.",
      "A boot-time assertion fails API startup if any model is registered as neither tenant-owned nor deliberately excluded.",
      "A hand-written ESLint AST selector bans unscoped findUnique and findFirst on tenant-owned models, and bans $queryRawUnsafe outright.",
      "The tenant guard returns the same 404 for an organisation that does not exist and one you are simply not a member of, so slug enumeration yields nothing; the real reason goes to the log.",
      "Owner-count changes run under Serializable isolation, because two concurrent demotions at a weaker level could each see two owners and leave the organisation with none.",
      "Argon2id at OWASP parameters with rehash on login, and a dummy hash verified on the user-not-found branch to close the timing oracle. Session tokens and API keys use SHA-256 \u2014 256 bits of CSPRNG output has no dictionary to attack, and a slow hash would only tax every request.",
      "220 declared test cases across 17 spec files, including suites against real Postgres and Redis that assert a cross-tenant read is indistinguishable from a nonexistent one.",
    ],
    placeholder: false,
  },

  /* ---------------------------------------------------------------- */
  /* XR                                                                */
  /* ---------------------------------------------------------------- */

  {
    slug: "orbital",
    title: "ORBITAL",
    discipline: "xr",
    summary:
      "A modular XR environment kit: a five-zone orbital research station built from 85 authored assets on a strict 0.5 m grid, so the pieces meet without a seam and arrive in Unity at the right scale on the first import.",
    role: "Author \u2014 modelling, modular system, specifications, Unity setup",
    year: "2026",
    stack: ["Blender", "Unity"],
    media: [{ kind: "image", src: "", alt: "", pending: true }],
    presentation: "expanded",
    caseStudy: [
      {
        heading: "Context",
        body: "A single hero model is a portfolio piece. A kit is a tool. ORBITAL was built as the second thing \u2014 enough modular geometry to assemble an entire station, under the constraints that make modular work genuinely modular rather than merely repetitive.",
      },
      {
        heading: "The grid is the discipline",
        body: "Every one of the 85 assets is authored to a 0.5 m grid. That single rule is what lets separate pieces meet without a seam, lets a corridor be extended by someone who never opened the source file, and makes scale survive the trip into the engine instead of being corrected by hand on import.",
      },
      {
        heading: "Handing it over",
        body: "The kit ships with asset, environment and render specifications, and a Unity project that consumes it. Documentation is the difference between a folder of meshes and something a team can build with: naming, pivots, scale, materials, and what each piece is for.",
      },
    ],
    technicalDetails: [
      "85 authored modular assets, all on a strict 0.5 m grid.",
      "A five-zone station layout assembled from the kit.",
      "Asset, environment and render specifications written alongside the geometry.",
      "A Unity project consuming the kit for real-time use.",
    ],
    placeholder: false,
  },

  /* ---------------------------------------------------------------- */
  /* CREATIVE                                                          */
  /* ---------------------------------------------------------------- */

  {
    slug: "identity-systems",
    title: "Identity systems \u2014 EMBER, FORM, KAERA, VANTA",
    discipline: "creative",
    summary:
      "Four self-directed identity systems, each taken well past the logo: colour, typography, applications and a website, so the mark gets tested in the places it would actually have to survive.",
    role: "Identity design and art direction",
    stack: ["Brand Identity Design", "Typography", "Adobe Creative Cloud", "Figma"],
    media: [{ kind: "image", src: "", alt: "", pending: true }],
    presentation: "compact",
    placeholder: false,
  },

  {
    slug: "websites",
    title: "Websites",
    discipline: "creative",
    summary:
      "Scroll-driven editorial and marketing sites, built rather than themed \u2014 including M Legacy, an editorial piece comparing two generations of BMW M3, and the site you are reading now.",
    role: "Design and build",
    year: "2025 \u2014 2026",
    stack: ["React", "Next.js", "Vite", "GSAP", "ScrollTrigger", "Lenis", "Three.js", "Tailwind CSS"],
    media: [{ kind: "image", src: "", alt: "", pending: true }],
    presentation: "expanded",
    caseStudy: [
      {
        heading: "The recurring brief",
        body: "Make a page that moves with the reader rather than at them. In practice that means the scroll position drives the composition \u2014 type, imagery and, where it earns its place, a WebGL layer \u2014 instead of elements animating on a timer the reader has no control over.",
      },
      {
        heading: "How they are built",
        body: "GSAP with ScrollTrigger for the choreography, Lenis for the scroll itself, and Three.js where a scene adds something a flat image cannot. This site goes furthest: one persistent WebGL canvas for the whole page, a single animation clock driving both the scroll and the scene, and semantic DOM underneath all of it so the content survives with the canvas switched off.",
      },
    ],
    placeholder: false,
  },

  {
    slug: "creative-pending",
    title: "Further creative work",
    discipline: "creative",
    summary:
      "More identity, 3D and campaign work is finished but not yet written up for this site. It will appear here with its own imagery rather than as a description of imagery.",
    stack: [],
    media: [{ kind: "image", src: "", alt: "", pending: true }],
    presentation: "compact",
    placeholder: true,
  },

  /* ---------------------------------------------------------------- */
  /* DATA & APPLIED AI                                                 */
  /* ---------------------------------------------------------------- */

  {
    slug: "data-platform-pending",
    title: "Data platform work",
    discipline: "ai",
    summary:
      "Ingestion, preparation, modelling and dashboards brought into one workflow for technical and non-technical users. In development; it will be written up here once it is finished rather than described while it moves.",
    stack: [],
    media: [{ kind: "image", src: "", alt: "", pending: true }],
    presentation: "compact",
    placeholder: true,
  },

  {
    slug: "modelling-forecasting-pending",
    title: "Modelling and forecasting",
    discipline: "ai",
    summary:
      "Machine-learning and forecasting work, with the documentation and visual reporting that made the findings usable by people who do not read notebooks. Write-up pending.",
    stack: [],
    media: [{ kind: "image", src: "", alt: "", pending: true }],
    presentation: "compact",
    placeholder: true,
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
    /*
     * Ordering is editorial, not alphabetical: the first four `primary`
     * entries are what the Software world prints as its signature line, so
     * they are the four languages the systems in this file actually run on.
     * Everything after that is ordered language → framework → data →
     * platform, which is roughly the order a reader would ask about it in.
     */
    skills: [
      { name: "Python", disciplines: ["software", "ai"], tier: "primary", note: "Pipelines, research services and automation", related: ["pandas", "FastAPI"] },
      { name: "TypeScript", disciplines: ["software"], tier: "primary", note: "Typed application development, front and back", related: ["ReactJS", "NestJS"] },
      { name: "Go", disciplines: ["software"], tier: "primary", note: "Services and control planes — the trading platform and the delivery control plane", related: ["PostgreSQL", "Docker"] },
      { name: "ReactJS", disciplines: ["software", "creative"], tier: "primary", note: "Interface development", related: ["Next.js", "TypeScript"] },

      { name: "JavaScript", disciplines: ["software"], tier: "primary", note: "Application logic", related: ["TypeScript", "Node.js"] },
      { name: "C#", disciplines: ["software", "xr"], tier: "secondary", note: "Engine and application code", related: ["Unity"] },
      { name: "C++", disciplines: ["software"], tier: "secondary", note: "Systems-level programming", related: ["C#"] },
      { name: "HTML", disciplines: ["software", "creative"], tier: "secondary", note: "Structure and semantics", related: ["CSS"] },
      { name: "CSS", disciplines: ["software", "creative"], tier: "secondary", note: "Layout and styling", related: ["HTML", "ReactJS"] },

      { name: "Next.js", disciplines: ["software", "creative"], tier: "primary", note: "Application and interface framework", related: ["ReactJS", "TypeScript"] },
      { name: "NestJS", disciplines: ["software"], tier: "secondary", note: "Typed backend services — the multi-tenant platform", related: ["TypeScript", "Prisma"] },
      { name: "Angular", disciplines: ["software"], tier: "secondary", note: "Application framework — the invoicing platform", related: ["TypeScript", "Ionic"] },
      { name: "Ionic", disciplines: ["software"], tier: "supporting", note: "Mobile-shaped UI on the web platform", related: ["Angular", "Capacitor"] },
      { name: "Capacitor", disciplines: ["software"], tier: "supporting", note: "One web codebase packaged as a native app", related: ["Angular"] },
      { name: "Node.js", disciplines: ["software"], tier: "secondary", note: "Server-side JavaScript", related: ["Express", "TypeScript"] },
      { name: "Express", disciplines: ["software"], tier: "secondary", note: "HTTP APIs", related: ["Node.js", "MySQL"] },
      { name: "FastAPI", disciplines: ["software", "ai"], tier: "secondary", note: "Python research and inference services", related: ["Python"] },

      { name: "SQL", disciplines: ["software", "ai"], tier: "primary", note: "Schema design and querying", related: ["PostgreSQL", "MySQL"] },
      { name: "PostgreSQL", disciplines: ["software"], tier: "primary", note: "The default relational store across these systems", related: ["SQL", "Row Level Security"] },
      { name: "MySQL", disciplines: ["software"], tier: "secondary", note: "Relational store", related: ["SQL"] },
      { name: "Redis", disciplines: ["software"], tier: "secondary", note: "Caching, queues and ephemeral state", related: ["PostgreSQL"] },
      { name: "Prisma", disciplines: ["software"], tier: "supporting", note: "Typed database access", related: ["PostgreSQL", "NestJS"] },
      { name: "Supabase", disciplines: ["software"], tier: "secondary", note: "Hosted Postgres, auth and sync", related: ["PostgreSQL", "Row Level Security"] },

      { name: "Docker", disciplines: ["software"], tier: "primary", note: "Containerised services and reproducible builds", related: ["CI/CD"] },
      { name: "CI/CD", disciplines: ["software", "security"], tier: "secondary", note: "Automated build, test and release", related: ["Docker", "Security CI"] },
      { name: "Git / GitHub", disciplines: ["software"], tier: "secondary", note: "Version control and collaboration", related: ["CI/CD"] },
      { name: "Playwright", disciplines: ["software"], tier: "secondary", note: "End-to-end browser testing", related: ["TypeScript", "CI/CD"] },
      { name: "Cloudflare Workers", disciplines: ["software"], tier: "secondary", note: "Edge runtime and deployment", related: ["TypeScript"] },
      { name: "Kubernetes", disciplines: ["software"], tier: "secondary", note: "Rollouts driven from the delivery control plane", related: ["Docker", "Go"] },
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
      { name: "Apache Spark", disciplines: ["ai"], tier: "supporting", note: "Distributed data processing", related: ["Python"] },
      { name: "MLflow", disciplines: ["ai"], tier: "secondary", note: "Experiment tracking and model registry", related: ["Python"] },
      { name: "Superset", disciplines: ["ai"], tier: "supporting", note: "Dashboards and exploration", related: ["Power BI"] },
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
 * EXPERIENCE — transcribed from Keathan's own CV (Keathan_Naidoo_CV.pdf),
 * which supplied the organisations, dates and descriptions that earlier
 * passes of this file did not have and correctly refused to invent.
 *
 * Order follows the CV's own order rather than strict reverse chronology:
 * four of the six roles are concurrent, and the CV leads with the one that
 * carries the most responsibility. That is his curation, not a sort bug.
 *
 * Nothing here is paraphrased upward. Where the CV says "part of the team",
 * so does this.
 */
export const experience: ExperienceEntry[] = [
  {
    id: "exp-lead-app-dev",
    organisation: "CXI-Africa",
    role: "Lead Application Developer",
    period: "Aug 2022 — Present",
    summary:
      "Lead XR application and learner management system development, combining C# logic, 3D assets, interfaces and learning workflows, from requirements through to user adoption.",
    highlights: [
      "Part of the team that built three different learner management systems for TVET colleges.",
      "Run implementation workshops and introduce new products to learners and stakeholders.",
    ],
    placeholder: false,
  },
  {
    id: "exp-senior-facilitator",
    organisation: "CXI-Africa",
    role: "Senior Facilitator (Part-time)",
    period: "Apr 2023 — Present",
    summary:
      "Deliver XR development and Cisco Networking Academy cybersecurity training across academic and industry settings. Currently delivering systems engineering training for CHIETA.",
    highlights: [
      "Trained lecturers from multiple TVET colleges.",
      "Supported lecturer upskilling at Tshwane University of Technology.",
      "Worked on programmes involving the U.S. Embassy, Tshimologong and MICT SETA.",
    ],
    placeholder: false,
  },
  {
    id: "exp-senior-technical-specialist",
    organisation: "CXI-Africa",
    role: "Senior Technical Specialist",
    period: "Jan 2025 — Present",
    summary:
      "Support user accounts, maintain and repair PCs, carry out updates and upgrades, and keep workplace systems secure and available.",
    highlights: [],
    placeholder: false,
  },
  {
    id: "exp-digital-strategist",
    organisation: "CXI-Africa",
    role: "Digital Strategist",
    period: "Aug 2025 — Present",
    summary:
      "Use campaign metrics to improve digital strategy and reporting.",
    highlights: [],
    placeholder: false,
  },
  {
    id: "exp-data-analyst",
    organisation: "Verifone",
    role: "Senior Data Analyst (Freelance)",
    period: "Sep 2025 — Jan 2026",
    summary:
      "Built a Python pipeline that brought regional datasets together for analysis and reporting: ingestion, cleaning, exploratory analysis and preparation.",
    highlights: [
      "Developed machine-learning and forecasting models, with documentation and visual reports that explained the findings to business stakeholders.",
    ],
    placeholder: false,
  },
  {
    id: "exp-creative-developer",
    organisation: "Kommar Technologies",
    role: "Creative Developer / Designer (Freelance)",
    period: "Mar 2022 — Present",
    summary:
      "Deliver application, data science and design projects, from exploratory analysis and model evaluation through to deployment.",
    highlights: [
      "Create brand identities, advertising creatives, landing pages, email templates and social campaigns.",
      "Use CTR, conversion and ROI metrics, A/B testing and iterative design to improve performance.",
    ],
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
 * XR was raised to Advanced on Keathan's own account of it: he runs the
 * entire pipeline himself rather than handing part of it off. It sits
 * second rather than first only because the positioning of this site is
 * software-led, which is a separate editorial decision from capability.
 */
export const professionalDevelopment: ProfessionalDevelopmentEntry[] = [
  {
    discipline: "software",
    label: "Software Engineering",
    level: "Advanced / Broad",
    weight: 0.95,
    note: "Several substantial systems across Go, TypeScript, Python and Angular; two deployed.",
  },
  {
    discipline: "xr",
    label: "XR Development",
    level: "Advanced",
    weight: 0.92,
    note: "The whole pipeline, single-handed — model, sculpt, texture, animate, and into the engine.",
  },
  {
    discipline: "creative",
    label: "Creative",
    level: "Intermediate → Advanced",
    weight: 0.78,
    note: "Identity systems taken through to applications and websites, plus campaign work measured on performance.",
  },
  {
    discipline: "ai",
    label: "Data & Applied AI",
    level: "Intermediate → Advanced",
    weight: 0.74,
    note: "Python pipelines, forecasting models and reporting delivered to a commercial client.",
  },
  {
    discipline: "security",
    label: "Security Engineering",
    level: "Intermediate → Advanced",
    weight: 0.62,
    note: "Auth, authorisation and sandboxing built into real systems, plus a security pipeline.",
  },
];

/**
 * CERTIFICATIONS — transcribed from Keathan's CV rather than paraphrased:
 * nine Cisco Networking Academy credentials, three AWS Skill Builder
 * credentials, and the CXI-Africa XR Developer Certificate.
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
  { id: "cert-aws-serverless", name: "Serverless — Demonstrated", issuer: "AWS Skill Builder", issued: "", placeholder: false },
  { id: "cert-aws-dataviz", name: "Data Visualization — Demonstrated", issuer: "AWS Skill Builder", issued: "", placeholder: false },
  { id: "cert-aws-app-networking", name: "Application Networking — Demonstrated", issuer: "AWS Skill Builder", issued: "", placeholder: false },
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

/* ------------------------------------------------------------------ */
/* Timeline                                                            */
/* ------------------------------------------------------------------ */

/**
 * TIMELINE — the five practices, dated from the CV's own role dates rather
 * than from memory. Where several roles feed one practice the range spans
 * them; where a practice is ongoing study rather than a dated role, it says
 * "Current" instead of inventing a start.
 */
export const timeline: TimelineEntry[] = [
  {
    id: "tl-creative",
    period: "2022 — Present",
    title: "Creative and design practice",
    detail:
      "Brand identity, digital art, UI/UX and campaign creative, delivered freelance through Kommar Technologies.",
    discipline: "creative",
    placeholder: false,
  },
  {
    id: "tl-software",
    period: "2022 — Present",
    title: "Application and systems development",
    detail:
      "Leading application and learner-management development at CXI-Africa, alongside independent platform and service work.",
    discipline: "software",
    placeholder: false,
  },
  {
    id: "tl-3d",
    period: "2022 — Present",
    title: "XR, 3D and real-time",
    detail:
      "Modelling, sculpting, texturing, animation and engine work — the full pipeline, plus XR training delivery.",
    discipline: "xr",
    placeholder: false,
  },
  {
    id: "tl-data",
    period: "2025 — 2026",
    title: "Data and AI/ML",
    detail:
      "Python pipelines, forecasting and machine-learning models, including freelance work for Verifone.",
    discipline: "ai",
    placeholder: false,
  },
  {
    id: "tl-security",
    period: "Current",
    title: "Cybersecurity",
    detail:
      "Cisco Networking Academy credentials, security engineering inside production systems, and ongoing hands-on practice.",
    discipline: "security",
    placeholder: false,
  },
];

/* ------------------------------------------------------------------ */
/* Currently building / learning                                       */
/* ------------------------------------------------------------------ */

/**
 * CURRENTLY BUILDING / LEARNING
 *
 * One entry per world, each explicitly unfinished. Nothing here is a
 * shipped achievement wearing a progress label.
 */
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
    id: "cb-data-lab",
    title: "CHIETA Data Lab",
    discipline: "ai",
    status: "building",
    note: "A data science platform bringing ingestion, preparation, modelling and dashboards into one workflow for both technical and non-technical users.",
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
    id: "cb-orbital",
    title: "ORBITAL — extending the kit",
    discipline: "xr",
    status: "building",
    note: "More zones, more modules, and the interaction layer that turns a built environment into something you can actually do things in.",
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
