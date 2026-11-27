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
 *   - `media` is `pending: true` only where there is genuinely nothing to
 *     show yet: At Leisure, the three deliberate placeholders, and the
 *     security entry. Everything else now carries a real asset, and each
 *     one is what it says it is — a render, a capture of a running build,
 *     or a diagram declared as a diagram. A pending marker renders as a
 *     composed frame; it never fabricates a screenshot.
 *
 *     At Leisure is still pending for a specific reason worth recording:
 *     the deployed app's Discover tab cannot load, because it calls
 *     www.gutenberg.org from the browser and is refused for want of an
 *     Access-Control-Allow-Origin header. A screenshot of it today would
 *     be a screenshot of an error state.
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
      "A single-operator automated trading platform where every order passes a pure risk engine before it can reach a venue. Paper trading only: it has never been pointed at real money, and the architecture is built around that constraint.",
    role: "Sole author — architecture, Go services, Python research layer, security pipeline",
    year: "2025 — 2026",
    stack: ["Go", "PostgreSQL", "Redis", "Python", "FastAPI", "pandas", "Prometheus"],
    repositoryUrl: "https://github.com/Keathan2609/vantage",
    /* DIAGRAMS, not screenshots, and labelled as such on the page.

       This system has no interface worth photographing and has never been
       deployed, so the honest options were a composed placeholder frame or
       a drawing of the thing itself. A staged terminal or a mocked-up
       dashboard would have been the dishonest option.

       Three boards rather than one, so the entry reads like a readme: the
       shape of the thing first, then two decisions inside it worth a
       reader's time. Each board is captioned, because alt text serves
       somebody who cannot see the picture and a caption tells everybody
       why it is there.

       Vantage is the one of the three checked out on this machine, so these
       were drawn from the source: the eleven order states and the shape of
       the transition table from internal/domain/order.go, the check names
       and the count from internal/domain/risk.go. That count is also how
       the previously claimed 27 was found to be 20. */
    media: [
      {
        kind: "image",
        src: "/media/projects/software/vantage-architecture-lg.webp",
        alt: "A diagram of Vantage’s order path: strategies, then a consensus layer, then a highlighted risk engine — one pure function running 20 named checks plus a five-check authority ceiling, with every check evaluated — and only then the venue. A dashed route bypassing the engine is crossed out and labelled “no path around it”.",
        ratio: "16 / 9",
        caption:
          "Diagram — the order path. Nothing reaches a venue without passing the risk engine first.",
      },
      {
        kind: "image",
        src: "/media/projects/software/vantage-checks-lg.webp",
        alt: "A diagram listing Vantage’s risk checks by the names they carry in code, grouped as gates, market conditions, loss and book down one column and the order’s own limits and exposure down another, with the five authority-ceiling checks in a highlighted panel. A note records that the engine never short-circuits: every check runs on every order.",
        ratio: "16 / 9",
        caption:
          "Diagram — the twenty checks and the five ceilings above them, by the names they carry in the code.",
      },
      {
        kind: "image",
        src: "/media/projects/software/vantage-states-lg.webp",
        alt: "A diagram of Vantage’s order state machine: the path an order takes when nothing goes wrong — CREATED, VALIDATING, ACCEPTED, SUBMITTED, PARTIALLY_FILLED, FILLED — with PARTIALLY_FILLED looping back to itself; the four terminal states below it; and FAILED shown apart as still recoverable, to FILLED, PARTIALLY_FILLED, CANCELLED or REJECTED, through reconciliation against the venue.",
        ratio: "16 / 9",
        caption:
          "Diagram — eleven states, four of them terminal, and why FAILED is deliberately not one of them.",
      },
    ],
    presentation: "expanded",
    caseStudy: [
      {
        heading: "The problem",
        body: "Automated trading is a domain where a quiet bug spends real money. The system is built around one idea: make the dangerous part small, pure and impossible to skip. Strategies generate orders, a consensus layer agrees them, and a risk engine then judges them, without exception, before anything leaves the building.",
      },
      {
        heading: "The risk engine",
        body: "The risk engine is a single pure function. It evaluates every check on every order instead of stopping at the first failure, so a refusal comes back as a complete account of what is wrong with the order. Twenty named checks sit behind it, with a separate five-check trading-authority ceiling layer above them. Money is never a float: it is decimal end to end. The order pipeline is an explicit state machine, not a scatter of booleans.",
      },
      {
        heading: "Proving it",
        body: "73 of 180 Go files are tests, and in at least one case the test file is larger than the implementation it covers. Fills are reconciled against the venue and runs replay deterministically, which is the only practical way to debug a system whose inputs never repeat. A ten-job security pipeline runs static analysis, secret scanning, dependency and container audits, and a dynamic scan over it.",
      },
    ],
    technicalDetails: [
      "Risk engine is one pure function evaluating all checks per order, so a refusal reports every violation, not only the first.",
      "20 named risk checks, plus a separate five-check trading-authority ceiling layer.",
      "Decimal money throughout: no floating point anywhere in the ledger.",
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
      "An offline-first reader for books you already own (PDF, EPUB and plain text) that holds your position to the character and can turn a photographed page into clean, restylable text without the image ever leaving your device.",
    role: "Sole author — product, engineering, deployment, Android build",
    year: "2026",
    stack: ["TypeScript", "React", "Vite", "Supabase", "IndexedDB", "tesseract.js", "Cloudflare Pages"],
    liveUrl: "https://atleisure.pages.dev",
    media: [{ kind: "image", src: "", alt: "", pending: true }],
    presentation: "expanded",
    caseStudy: [
      {
        heading: "What it assumes",
        body: "Reading apps tend to assume a connection and a shop. This one assumes neither: it opens files you already have, works with the network off, and keeps your place to the character. Most of the work, though, went somewhere less obvious: making a photograph of a page readable.",
      },
      {
        heading: "The OCR pipeline",
        body: "Recognition itself is the easy half of this. A photographed page arrives with uneven lighting, a curved gutter, sometimes two columns, and words broken across lines. The pipeline estimates paper brightness across a coarse grid and smooths it to correct the lighting, detects the gutter so a spread becomes two pages, separates columns, strips running heads, and rejoins hyphenated words before a single character is shown. All of it runs on the device.",
      },
      {
        heading: "Shipping it",
        body: "It installs as a PWA, and there is a signed Android build wrapped as a Trusted Web Activity, distributed from the site itself instead of through a store. The release script reads the signing password from a file, never the command line, and re-patches a manifest flag the generator insists on resetting on every build.",
      },
    ],
    technicalDetails: [
      "OCR runs entirely on-device: no server ever sees the page.",
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
    /* DIAGRAMS, not screenshots, and labelled as such on the page.

       This system has no interface worth photographing and has never been
       deployed, so the honest options were a composed placeholder frame or
       a drawing of the thing itself. A staged terminal or a mocked-up
       dashboard would have been the dishonest option.

       Three boards rather than one, so the entry reads like a readme: the
       shape of the thing first, then two decisions inside it worth a
       reader's time. Each board is captioned, because alt text serves
       somebody who cannot see the picture and a caption tells everybody
       why it is there. */
    media: [
      {
        kind: "image",
        src: "/media/projects/software/nexus-architecture-lg.webp",
        alt: "A diagram of how NEXUS hands out work: three workers all pointing at a single Postgres jobs table that holds the claim statement, an UPDATE over a FOR UPDATE SKIP LOCKED subquery taking a lease and not an assignment. A note explains that a dead worker is simply a lease that stops being renewed. Below, the deployment states run DEPLOYING to VERIFYING to HEALTHY, gated on three consecutive probes.",
        ratio: "16 / 9",
        caption:
          "Diagram — how work is taken, and what a release has to do before it may be called healthy.",
      },
      {
        kind: "image",
        src: "/media/projects/software/nexus-lease-lg.webp",
        alt: "A diagram of the NEXUS lease: claim takes it, heartbeat extends it, completion ends it, and every one of those statements carries the clause AND worker_id = $2. Below, a worker whose lease was already reclaimed finds that its late heartbeat or completion matches zero rows.",
        ratio: "16 / 9",
        caption:
          "Diagram — claim, heartbeat and completion all carry the same clause, and that clause is the whole defence.",
      },
      {
        kind: "image",
        src: "/media/projects/software/nexus-outbox-lg.webp",
        alt: "A diagram of the NEXUS outbox: one transaction holding both the state change and the outbox row, the row written by a function that takes a transaction and not a connection pool; a relay then reads the outbox and publishes to NATS.",
        ratio: "16 / 9",
        caption:
          "Diagram — the outbox, where a type signature does the work a written convention would have done badly.",
      },
    ],
    presentation: "expanded",
    caseStudy: [
      {
        heading: "The question behind it",
        body: "Delivery tooling is a pile of scripts until something dies halfway through. The question this is built around is what remains true afterwards, if the process running a pipeline is killed at the worst possible moment. Given enough runs, that is the moment it will be killed at.",
      },
      {
        heading: "Claimed, never assigned",
        body: "There is no scheduler handing work out, because a scheduler is a thing that can itself go down and take the map of who-has-what with it. Workers compete for the same table: one UPDATE whose subquery selects FOR UPDATE SKIP LOCKED and takes a lease. That removes the leader election, the worker registry and the partition map that would otherwise all have to be kept in agreement with reality. A worker that dies holds a lease that stops being renewed, and that is the whole of the recovery story.",
      },
      {
        heading: "Earning the word healthy",
        body: "The deployment state table has no edge from DEPLOYING to HEALTHY. A release has to pass through VERIFYING and is accepted only after three consecutive successful probes against the running application, with one failure resetting the count to zero. It is not enough for a release to start; it has to keep answering.",
      },
    ],
    technicalDetails: [
      "Workers claim jobs with one UPDATE over a FOR UPDATE SKIP LOCKED subquery, taking a lease, not an assignment.",
      "Heartbeat and completion both carry AND worker_id = $2, so a worker whose lease was already reclaimed cannot resume ownership of work someone else is now running.",
      "Events reach NATS only through an outbox whose write function takes a transaction and not a pool, so an event cannot be emitted outside the transaction that caused it.",
      "One live deployment per environment is a partial unique index, and promotion supersedes the previous release inside the same transaction that marks the new one healthy, so the index is never momentarily violated.",
      "GitHub webhooks are verified with HMAC-SHA256 and de-duplicated by a unique index on provider and delivery id, so a redelivery loses the race instead of starting a second build of the same commit.",
      "The Kubernetes path drives kubectl directly (apply, rollout status, and reading pod events when a rollout stalls) against a local kind cluster.",
      "Reconciliation is one ticker over nine independent steps, each failure logged and stepped past, so drift detection going wrong cannot stop leases being reclaimed.",
      "152 Go test functions across 16 files. Nine need live Postgres and NATS behind a build tag, so a clean checkout exercises the planner, state transitions and RBAC but not the deployment path, which is the half that matters most and the gap worth naming.",
    ],
    placeholder: false,
  },

  {
    slug: "freevoices",
    title: "FreeVoices",
    discipline: "software",
    summary:
      "An invoicing and quoting system for small businesses, covering customers, products, quotes, invoices, payments and a client portal. It is written once in Angular and shipped as both a website and an Android app, with a single Express service and a thirteen-table schema behind it.",
    role: "Sole author \u2014 product, Angular client, Express API, schema, release",
    year: "2026",
    stack: ["Angular", "Ionic", "Capacitor", "TypeScript", "Express", "MySQL", "PDFKit", "Chart.js"],
    repositoryUrl: "https://github.com/Keathan2609/freevoices",
    /* The running application, captured from its own production bundle
       served locally — not a mock-up and not a design file.

       It is the sign-in page because everything past it is behind an
       account, and the right screenshot of an invoicing product is
       emphatically NOT somebody's real invoices. The same capture appears
       under Websites, where this is one of the sites in the list. */
    media: [
      {
        kind: "image",
        src: "/media/projects/websites/freevoices-hero-lg.webp",
        alt: "FreeVoices running: a dark split layout reading \"Invoicing for Africa — Professional invoicing free\" over a short feature list — invoices, quotes and receipts, PDF generation and email delivery, a customer payment portal, POPIA compliance — with a sign-in panel on the right.",
        ratio: "16 / 10",
      },
    ],
    presentation: "expanded",
    caseStudy: [
      {
        heading: "The gap",
        body: "Invoicing software is either expensive or it is a spreadsheet. The gap is a small business that needs to raise a quote, turn it into an invoice, send it, chase it when it goes unpaid, and keep a record that still balances afterwards, all without paying per seat for the privilege. FreeVoices is that, as one codebase that runs in a browser and installs as an Android app.",
      },
      {
        heading: "One document, several states",
        body: "A quote and an invoice are the same record at different points in its life, so they share one documents table instead of two near-identical ones. Each document carries its line items, its tracking history and its payments separately, which keeps what was changed and what has actually been paid as two different facts, where one hopeful status field would have blurred them together.",
      },
      {
        heading: "The parts that run without you",
        body: "Three jobs run every night: one raises the invoices due to recur, one marks overdue invoices overdue, and one anonymises accounts that asked to be deleted. That last job is why the sign-in path has to handle a user whose password hash is deliberately null. A deleted account has to stay deleted without taking its invoice history with it, because the books still have to balance after someone leaves.",
      },
    ],
    technicalDetails: [
      "One Angular 18 codebase, delivered as a web app and as a Capacitor Android build.",
      "Thirteen-table MySQL schema with a forward-only migration runner supporting --status and --dry-run.",
      "Argon2 password hashing, with tiered rate limits on the auth routes specifically because every attempt costs an expensive verify.",
      "Google sign-in alongside local accounts, including the case where an account has no password hash at all.",
      "Server-side PDF invoices; logo uploads capped at 5 MB, restricted to JPEG and PNG, stored under unguessable filenames.",
      "Nightly jobs for recurring invoices, overdue marking and account anonymisation.",
      "Privacy policy, terms and an account-deletion route shipped as part of the product, not bolted on for a store listing.",
    ],
    placeholder: false,
  },

  {
    slug: "atlas",
    title: "Atlas",
    discipline: "software",
    summary:
      "A multi-tenant team workspace covering organisations, workspaces, projects, work items, members, API keys and an audit log, built around a single problem: making it structurally impossible for one tenant to read another\u2019s data, so that it stops being something every query has to remember. It runs locally from a Docker stack and has never been deployed.",
    role: "Sole author \u2014 schema, isolation model, API, web client, tests",
    year: "2026",
    stack: ["TypeScript", "NestJS", "Prisma", "PostgreSQL", "Redis", "Next.js", "Turborepo", "Playwright"],
    repositoryUrl: "https://github.com/Keathan2609/atlas-multitenant-platform",
    /* DIAGRAMS, not screenshots, and labelled as such on the page.

       This system has no interface worth photographing and has never been
       deployed, so the honest options were a composed placeholder frame or
       a drawing of the thing itself. A staged terminal or a mocked-up
       dashboard would have been the dishonest option.

       Three boards rather than one, so the entry reads like a readme: the
       shape of the thing first, then two decisions inside it worth a
       reader's time. Each board is captioned, because alt text serves
       somebody who cannot see the picture and a caption tells everybody
       why it is there. */
    media: [
      {
        kind: "image",
        src: "/media/projects/software/atlas-architecture-lg.webp",
        alt: "A diagram of Atlas’s tenant isolation: a request passing three stacked, independent layers — HTTP guards that resolve the tenant, a Prisma client extension that injects the tenant filter, and composite foreign keys on [organizationId, id] that Postgres itself enforces — before reaching tenant data, with a note that each layer holds if the other two are removed.",
        ratio: "16 / 9",
        caption:
          "Diagram — the three isolation layers a request passes before it reaches any tenant data.",
      },
      {
        kind: "image",
        src: "/media/projects/software/atlas-enforcement-lg.webp",
        alt: "A diagram of Atlas’s three enforcement points: at boot, an assertion that refuses to start the API if a model is registered neither as tenant-owned nor as deliberately excluded; at lint, a hand-written ESLint AST selector banning unscoped findUnique and findFirst on tenant-owned models and banning $queryRawUnsafe outright; and at the database, seven relations keyed on [organizationId, id] that Postgres enforces itself.",
        ratio: "16 / 9",
        caption:
          "Diagram — the same rule enforced at boot, at lint and in the database, so removing one still leaves two.",
      },
      {
        kind: "image",
        src: "/media/projects/software/atlas-choices-lg.webp",
        alt: "A diagram of four decisions in Atlas where the obvious implementation was rejected: the same 404 for an organisation that does not exist and one you are simply not a member of; Argon2id with a dummy hash verified on the user-not-found branch; SHA-256 rather than a slow hash for session tokens and API keys; and owner-count changes run under Serializable isolation.",
        ratio: "16 / 9",
        caption:
          "Diagram — four decisions where the obvious implementation would have been the wrong one.",
      },
    ],
    presentation: "expanded",
    caseStudy: [
      {
        heading: "The worst bug",
        body: "The worst bug in a multi-tenant product is a query that quietly returns somebody else\u2019s rows. The usual defence against it is discipline: remember the tenant filter, every time, forever, including the developer who joins next year. Discipline wears off, so the whole design here is an attempt to make the mistake unavailable in the first place.",
      },
      {
        heading: "Three layers that do not depend on each other",
        body: "Composite foreign keys carry the organisation id, so a cross-tenant reference is refused by Postgres whatever the application believes. A Prisma client extension intercepts every operation and injects the tenant filter. It is an extension and not a repository wrapper, because a wrapper only protects the people who remember to use it, while a scoped client cannot issue an unscoped query at all. Above both, HTTP guards resolve the tenant before any service runs.",
      },
      {
        heading: "Making the rule impossible to forget",
        body: "A boot-time assertion reads Prisma\u2019s runtime data model and refuses to start the API if any model is registered neither as tenant-owned nor as deliberately excluded, each exclusion carrying its reason in code. Adding a table without deciding what it belongs to therefore never ships as an oversight; it shows up immediately as a server that will not boot.",
      },
    ],
    technicalDetails: [
      "Seven relations reference [organizationId, id] and not id alone, so cross-tenant references are rejected by the database itself.",
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
    /* Real renders, finally wired up. These have been sitting in
       public/media/projects/orbital since September, correctly named and
       already optimised at two sizes, referenced by nothing — the data
       layer said `pending` while the pictures were on disk the whole time.
       Every alt below describes a frame that was opened and looked at. */
    media: [
      {
        kind: "image",
        src: "/media/projects/orbital/environment-lg.webp",
        alt: "A corridor inside the station, lit by ceiling strips, looking through a bulkhead toward the glowing reactor.",
        ratio: "16 / 9",
      },
      {
        kind: "video",
        src: "/media/projects/orbital/reactor-turntable.mp4",
        poster: "/media/projects/orbital/reactor-turntable-poster-lg.webp",
        alt: "The reactor assembly turning slowly on its base.",
        ratio: "16 / 9",
      },
      {
        kind: "image",
        src: "/media/projects/orbital/reactor-hero-lg.webp",
        alt: "The reactor: a caged sphere held inside a ring frame on an octagonal base, lit from within.",
        ratio: "16 / 9",
      },
      {
        kind: "image",
        src: "/media/projects/orbital/modular-kit-lg.webp",
        alt: "The modular kit laid out flat — wall panels, doors, a column, floor tiles, rails and a lit strip.",
        ratio: "16 / 9",
      },
      {
        kind: "image",
        src: "/media/projects/orbital/console-hero-lg.webp",
        alt: "A control console with angled screens showing bar readouts, plus knobs, switches and a joystick.",
        ratio: "16 / 9",
      },
    ],
    presentation: "expanded",
    caseStudy: [
      {
        heading: "Why a kit",
        body: "It is easy enough to model one hero object and call it a portfolio piece. ORBITAL was built to be a tool instead: enough modular geometry to assemble an entire station, under the constraints that separate genuinely modular work from work that is merely repetitive.",
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
    /* The catalogue. ORBITAL is one project made of four subjects, and as a
       flat gallery it was five pictures in a row with nothing to say which
       belonged to what. Every frame below was opened and looked at before
       its alt was written — which is how two of them turned out not to be
       what their filenames implied: `environment-detail` is a console
       installed in a corridor, and `wireframe` is a clay render of the kit
       laid out flat, not a wireframe. */
    entriesLabel: "The kit, piece by piece",
    entries: [
      {
        id: "station",
        title: "The station",
        summary: "Five zones, assembled from the kit and lit.",
        body:
          "The assembled result, which is the only real test of a modular set: the corridors, bulkheads and fittings here are instances of the same pieces catalogued below, placed on the grid rather than modelled for the shot.",
        media: [
          {
            kind: "image",
            src: "/media/projects/orbital/environment-lg.webp",
            alt: "A corridor inside the station, lit by ceiling strips, looking through a bulkhead toward the glowing reactor.",
            ratio: "16 / 9",
          },
          {
            kind: "image",
            src: "/media/projects/orbital/environment-detail-lg.webp",
            alt: "A control console built into a dim corridor, its angled screens showing pale blue bar readouts, with a warm strip light on the wall behind it.",
            ratio: "16 / 9",
          },
        ],
      },
      {
        id: "reactor",
        title: "The reactor",
        summary: "The station's one hero object, inside and out.",
        body:
          "A caged sphere held in a ring frame on an octagonal base. The clay render is the same geometry without materials — the form has to read before any texture is applied, and this is where that gets checked.",
        media: [
          {
            kind: "image",
            src: "/media/projects/orbital/reactor-hero-lg.webp",
            alt: "The reactor: a caged sphere held inside a ring frame on an octagonal base, lit from within.",
            ratio: "16 / 9",
          },
          {
            kind: "image",
            src: "/media/projects/orbital/reactor-detail-lg.webp",
            alt: "Close on the reactor's core — an inner column lit by cyan strips, seen between the uprights of the cage and the ring frame.",
            ratio: "16 / 9",
          },
          {
            kind: "video",
            src: "/media/projects/orbital/reactor-turntable.mp4",
            poster: "/media/projects/orbital/reactor-turntable-poster-lg.webp",
            alt: "The reactor assembly turning slowly on its base.",
            ratio: "16 / 9",
          },
          {
            kind: "image",
            src: "/media/projects/orbital/technical-reactor-lg.webp",
            alt: "The same reactor as untextured grey geometry on a plain ground, showing the ring frame, cage and panelled base without materials.",
            ratio: "16 / 9",
          },
        ],
      },
      {
        id: "kit",
        title: "The modular kit",
        summary: "85 assets, every one authored to a 0.5 m grid.",
        body:
          "Laid out flat, which is how a kit is actually reviewed: wall panels, doors, a column, floor and grate tiles, rails and lit strips, each sized so that any two of them meet without a seam.",
        media: [
          {
            kind: "image",
            src: "/media/projects/orbital/modular-kit-lg.webp",
            alt: "The modular kit laid out flat — wall panels, doors, a column, floor tiles, rails and a lit strip.",
            ratio: "16 / 9",
          },
          {
            kind: "image",
            src: "/media/projects/orbital/wireframe-lg.webp",
            alt: "The same kit as untextured grey geometry: a row of upright wall and door panels with a column and a hatch, and four floor tiles below — plain, grated, one with a recessed strip and one carrying pipework.",
            ratio: "16 / 9",
          },
        ],
      },
      {
        id: "console",
        title: "The console",
        summary: "The piece of set dressing that has to hold a close-up.",
        body:
          "Angled screens, knobs, switches and a joystick. Most of the kit is built to be seen in passing; this one is built to be stood in front of, so it carries detail the corridor panels do not need.",
        media: [
          {
            kind: "image",
            src: "/media/projects/orbital/console-hero-lg.webp",
            alt: "A control console with angled screens showing bar readouts, plus knobs, switches and a joystick.",
            ratio: "16 / 9",
          },
        ],
      },
    ],
    placeholder: false,
  },

  /* ---------------------------------------------------------------- */
  /* CREATIVE                                                          */
  /* ---------------------------------------------------------------- */

  {
    slug: "identity-systems",
    title: "Identity systems",
    discipline: "creative",
    summary:
      "Four self-directed identity systems \u2014 EMBER Coffee, FORM Performance Nutrition, Ka\u00e9ra and VANTA Properties \u2014 each taken well past the logo into colour, typography, applications and a website, so the mark gets tested where it would actually have to survive.",
    role: "Identity design and art direction",
    stack: ["Brand Identity Design", "Typography", "Adobe Creative Cloud", "Figma"],
    /* The card cover is a 2\u00d72 composite of the four final showcase boards,
       built from those four files and nothing else. It replaced EMBER's
       showcase board, which had been standing in for all four and quietly
       claiming the whole entry was a coffee brand.

       The four identities are ENTRIES rather than four projects in the
       creative rail: they are one body of self-directed work, and splitting
       them would have put four brand cards beside "Websites" as though each
       had been a separate engagement. Every board below was opened and
       looked at before its alt text was written. */
    media: [
      {
        kind: "image",
        src: "/media/projects/brand/identity-systems-cover-lg.webp",
        alt: "The four identities side by side: EMBER Coffee in warm brown, FORM Performance Nutrition in black and lime, VANTA Properties in charcoal and gold, and Ka\u00e9ra in deep blue.",
        ratio: "16 / 9",
      },
    ],
    presentation: "expanded",
    caseStudy: [
      {
        heading: "Four briefs, no client",
        body: "Four self-directed identities in four unrelated sectors: a specialty coffee roastery, a sports nutrition line, a skincare brand and a property developer. Self-directed is the point here and not an apology for it. A brief invented in-house can be held to a standard a client brief rarely allows, and nothing here had to survive a committee.",
      },
      {
        heading: "Past the logo",
        body: "A mark on a white page proves very little. Each of these is built out as a system \u2014 a palette with usage ratios, a type scale, applications, a website and a social kit \u2014 and then assembled into a final board showing all of it at once. That board is the test: an identity either holds together across a business card, a shopfront, a phone screen and a paper bag, or it quietly falls apart on one of them.",
      },
      {
        heading: "What four proves",
        body: "One identity demonstrates taste. Four in unrelated sectors demonstrate range, and more usefully they demonstrate that the method is portable. The same sequence of brief, research, moodboard, sketches, concepts and final system produced a warm roastery and a clinical skincare brand without either of them ending up looking like the other.",
      },
    ],
    entriesLabel: "The four identities",
    entries: [
      {
        id: "ember",
        title: "EMBER Coffee",
        summary: "A specialty coffee roastery. “Roasted with intent.”",
        body:
          "Warm browns against charcoal, Playfair Display over Suisse Int’l. The hardest surface for this one was packaging: a flame mark that works at signage size still has to survive being printed small on a bag seam, which is what the icon-only variant exists for.",
        media: [
          {
            kind: "image",
            src: "/media/projects/brand/ember/showcase-lg.webp",
            alt: "EMBER Coffee, the final board: the identity across a laptop showing the site, a phone, coffee bags, a cup, hanging signage, an apron and a row of social posts.",
            ratio: "600 / 359",
          },
          {
            kind: "image",
            src: "/media/projects/brand/ember/logo-lg.webp",
            alt: "EMBER Coffee's logo board: the wordmark with its flame mark, secondary and icon-only versions, black-and-white variants, clear space, minimum size, incorrect usage, and the mark over six backgrounds.",
            ratio: "1024 / 683",
          },
          {
            kind: "image",
            src: "/media/projects/brand/ember/palette-lg.webp",
            alt: "EMBER Coffee's colour palette: Ember Brown, Roast, Golden Crema and two background tones, each with hex, RGB and CMYK values and a usage note, over a neutral extended ramp.",
            ratio: "1024 / 683",
          },
          {
            kind: "image",
            src: "/media/projects/brand/ember/typography-lg.webp",
            alt: "EMBER Coffee's type board: Playfair Display for headings against Suisse Int’l for body, with weights, a heading scale, and the two shown working together on a page and a phone.",
            ratio: "1024 / 683",
          },
          {
            kind: "image",
            src: "/media/projects/brand/ember/applications-lg.webp",
            alt: "EMBER Coffee applied: business cards, letterhead, email signature, coffee bags, product labels, cups, a menu, hanging signage, social posts, t-shirts, coasters and a paper bag.",
            ratio: "1024 / 683",
          },
          {
            kind: "image",
            src: "/media/projects/brand/ember/website-lg.webp",
            alt: "EMBER Coffee's website board: homepage, about, shop and product pages on desktop, three mobile views, and the component set — buttons, form elements, navigation, icons and the type scale.",
            ratio: "1024 / 683",
          },
          {
            kind: "image",
            src: "/media/projects/brand/ember/social-lg.webp",
            alt: "EMBER Coffee's social board: an Instagram profile and feed, stories, LinkedIn and Facebook posts, promotional graphics and digital ad banners.",
            ratio: "1024 / 683",
          },
          {
            kind: "image",
            src: "/media/projects/brand/ember/process-lg.webp",
            alt: "EMBER Coffee's process board: brief, research, moodboard, sketches, three logo concepts and the final identity.",
            ratio: "1024 / 607",
          },
        ],
      },
      {
        id: "form",
        title: "FORM Performance Nutrition",
        summary: "Sports nutrition. “Built for performance. Made for progress.”",
        body:
          "Black with a single acid lime accent, Anton over Inter. A supplement tub is read at arm’s length in a crowded aisle, so the system is built around one loud colour used sparingly and a condensed display face that still lands at a glance.",
        media: [
          {
            kind: "image",
            src: "/media/projects/brand/form/showcase-lg.webp",
            alt: "FORM Performance Nutrition, the final board: whey and creatine tubs, a shaker, packaging, business cards, apparel and a gym bag, with the website and social previews beneath.",
            ratio: "3 / 2",
          },
          {
            kind: "image",
            src: "/media/projects/brand/form/logo-lg.webp",
            alt: "FORM's logo board: the italic wordmark with its accent tick, secondary and icon-only versions, black and white variants, clear space, minimum sizes, and the logo over six backgrounds.",
            ratio: "1024 / 621",
          },
          {
            kind: "image",
            src: "/media/projects/brand/form/palette-lg.webp",
            alt: "FORM's palette: Performance Black, Steel Grey, Graphite, Performance Lime and Pure White, over a supporting set of blue, teal, orange and red, each with hex, RGB and CMYK values.",
            ratio: "1024 / 683",
          },
          {
            kind: "image",
            src: "/media/projects/brand/form/typography-lg.webp",
            alt: "FORM's type board: Anton for headlines against Inter for body, with styles, heading examples and both alphabets set out in full.",
            ratio: "1024 / 683",
          },
          {
            kind: "image",
            src: "/media/projects/brand/form/applications-lg.webp",
            alt: "FORM applied: business card, letterhead, email signature, whey and creatine packaging, product labels, social posts, an Instagram profile, a poster, a brochure, apparel and signage.",
            ratio: "1024 / 683",
          },
          {
            kind: "image",
            src: "/media/projects/brand/form/website-lg.webp",
            alt: "FORM's website board: homepage, about, all-products and product-detail pages on desktop, a mobile view, and the UI component set.",
            ratio: "1024 / 683",
          },
          {
            kind: "image",
            src: "/media/projects/brand/form/social-lg.webp",
            alt: "FORM's social board: Instagram feed posts, stories, LinkedIn and Facebook posts, a profile, banner graphics and promotional ad designs.",
            ratio: "1024 / 683",
          },
          {
            kind: "image",
            src: "/media/projects/brand/form/process-lg.webp",
            alt: "FORM's process board: brief, research with a competitor analysis, moodboard, sketches, concepts and the final identity on packaging.",
            ratio: "1024 / 683",
          },
        ],
      },
      {
        id: "kaera",
        title: "Kaéra",
        summary: "Premium skincare, Cape Town. “Advanced skin science. Pure intent.”",
        body:
          "A six-tone blue palette running Midnight to Ice, Cormorant Garamond over Suisse Int’l. Clinical and calm at once — the self-set brief was a brand that can make a scientific claim without looking like a pharmacy.",
        media: [
          {
            kind: "image",
            src: "/media/projects/brand/kaera/showcase-lg.webp",
            alt: "Kaéra, the final board: skincare bottles and jars on stone, a laptop showing the site, a phone, business cards, a brochure, an envelope and a shopping bag, all in deep blue.",
            ratio: "3 / 2",
          },
          {
            kind: "image",
            src: "/media/projects/brand/kaera/logo-lg.webp",
            alt: "Kaéra's logo board: the primary wordmark, a secondary lockup and a circular K mark, black-and-white versions, variations, clear space, minimum size, and the logo over five backgrounds.",
            ratio: "1024 / 819",
          },
          {
            kind: "image",
            src: "/media/projects/brand/kaera/palette-lg.webp",
            alt: "Kaéra's palette: Midnight, Blue, Mist, Ice, Pure and Slate with hex, RGB and CMYK values, a usage breakdown ring, gradients, and the colours shown in application.",
            ratio: "1024 / 683",
          },
          {
            kind: "image",
            src: "/media/projects/brand/kaera/typography-lg.webp",
            alt: "Kaéra's type board: Cormorant Garamond for headings against Suisse Int’l for body, with both alphabets, a heading scale, and the pair shown on a page and a phone.",
            ratio: "1024 / 683",
          },
          {
            kind: "image",
            src: "/media/projects/brand/kaera/applications-lg.webp",
            alt: "Kaéra applied, across three parts: stationery and business essentials, product labels, packaging boxes, a shopping bag, social posts, a poster, a brochure, apparel and signage.",
            ratio: "1024 / 683",
          },
          {
            kind: "image",
            src: "/media/projects/brand/kaera/website-lg.webp",
            alt: "Kaéra's website board: homepage, about, product listing and product detail on desktop, mobile views, and the UI component set.",
            ratio: "1024 / 683",
          },
          {
            kind: "image",
            src: "/media/projects/brand/kaera/process-lg.webp",
            alt: "Kaéra's process board: brief, research with a competitor landscape, moodboard, sketches, concepts and the final identity.",
            ratio: "1024 / 683",
          },
        ],
      },
      {
        id: "vanta",
        title: "VANTA Properties",
        summary: "Premium residential property. “Exceptional spaces. Considered living.”",
        body:
          "Charcoal, warm stone and satin gold, Cormorant Garamond over Montserrat, with the gold held to roughly five per cent of any layout. The V monogram is the whole identity compressed: architectural, and still legible at the size of an app icon.",
        media: [
          {
            kind: "image",
            src: "/media/projects/brand/vanta/showcase-lg.webp",
            alt: "VANTA Properties, the final board: the identity across stationery, the website, mobile, print, signage and social, in charcoal and gold.",
            ratio: "16 / 9",
          },
          {
            kind: "image",
            src: "/media/projects/brand/vanta/logo-lg.webp",
            alt: "VANTA Properties' logo board: the V monogram with the wordmark, secondary and icon versions, variations, clear space and minimum size, black-and-white versions, and the logo over architecture, stone and marble.",
            ratio: "1024 / 683",
          },
          {
            kind: "image",
            src: "/media/projects/brand/vanta/palette-lg.webp",
            alt: "VANTA's palette: Charcoal, Warm Stone, Sand, Ivory, Satin Gold and Deep Black, each with hex, RGB, CMYK and a Pantone match, plus tints and a usage ratio guide.",
            ratio: "1024 / 683",
          },
          {
            kind: "image",
            src: "/media/projects/brand/vanta/typography-lg.webp",
            alt: "VANTA's type board: Cormorant Garamond for headings against Montserrat for body, with a full type scale and the pair shown on a property card.",
            ratio: "1024 / 819",
          },
          {
            kind: "image",
            src: "/media/projects/brand/vanta/applications-lg.webp",
            alt: "VANTA applied: business cards, letterhead, email signature, social posts, a stationery suite, signage, a brochure, an Instagram profile, posters and a web banner.",
            ratio: "1024 / 683",
          },
          {
            kind: "image",
            src: "/media/projects/brand/vanta/website-lg.webp",
            alt: "VANTA's website board: homepage, about and property-listing pages on desktop, three mobile views, and the UI component set.",
            ratio: "1024 / 683",
          },
          {
            kind: "image",
            src: "/media/projects/brand/vanta/social-lg.webp",
            alt: "VANTA's social board: a curated Instagram grid, stories, LinkedIn and Facebook posts, a profile and banner, and promotional ad designs.",
            ratio: "4 / 3",
          },
          {
            kind: "image",
            src: "/media/projects/brand/vanta/process-lg.webp",
            alt: "VANTA's process board: brief, research, moodboard, sketches, concepts and the final identity, with the journey from insight to execution along the foot.",
            ratio: "1024 / 683",
          },
        ],
      },
    ],
    placeholder: false,
  },

  {
    slug: "websites",
    title: "Websites",
    discipline: "creative",
    summary:
      "Sites that were built from scratch and not themed: FreeVoices, an invoicing product for South African businesses, M Legacy, an editorial piece comparing two generations of BMW M3, and the site you are reading now.",
    role: "Design and build",
    year: "2025 \u2014 2026",
    stack: ["Angular", "React", "Next.js", "Vite", "GSAP", "ScrollTrigger", "Lenis", "Three.js", "Tailwind CSS"],
    /* Two captures, both of running builds rather than mock-ups.

       FreeVoices leads, because a product someone signs into is a harder
       thing to have built than a portfolio and a more honest first
       impression of the work. It is its own entry under software
       engineering as well; the overlap is deliberate, since it is
       simultaneously a product and one of the sites in this list.

       The capture is the sign-in page because that is the app's public
       face \u2014 everything past it is behind an account, and a screenshot of
       someone's real invoices is not a thing to put in a portfolio. */
    media: [
      {
        kind: "image",
        src: "/media/projects/websites/freevoices-hero-lg.webp",
        alt: "FreeVoices running: a dark split layout reading \"Invoicing for Africa \u2014 Professional invoicing free\" over a short feature list, with a sign-in panel on the right.",
        ratio: "16 / 10",
      },
      {
        kind: "image",
        src: "/media/projects/websites/portfolio-hero-lg.webp",
        alt: "The hero of this portfolio, live: the name set large inside a drifting mass of smoke, with the five disciplines indexed down the right.",
        ratio: "800 / 574",
      },
    ],
    presentation: "expanded",
    caseStudy: [
      {
        heading: "The recurring brief",
        body: "Make a page that moves with the reader instead of at them. In practice that means the scroll position drives the composition: type, imagery and, where it earns its place, a WebGL layer. The alternative is elements animating on a timer the reader has no control over.",
      },
      {
        heading: "How they are built",
        body: "GSAP with ScrollTrigger for the choreography, Lenis for the scroll itself, and Three.js where a scene adds something a flat image cannot. This site goes furthest: one persistent WebGL canvas for the whole page, a single animation clock driving both the scroll and the scene, and semantic DOM underneath all of it so the content survives with the canvas switched off.",
      },
      {
        heading: "When the brief is not editorial",
        body: "FreeVoices is the counterexample, and it is in this list for that reason. Nobody wants a scroll-driven narrative while they are issuing an invoice: it is an Angular application with routes for invoices, quotes, customers, products and reports, and the design work there went into making a dense, repetitive task quick. Nothing about it is cinematic. Knowing which of the two a brief is asking for is most of the job.",
      },
    ],
    placeholder: false,
  },

  {
    slug: "creative-pending",
    title: "Further creative work",
    discipline: "creative",
    summary:
      "More identity, 3D and campaign work is finished but not yet written up for this site. It will appear here once there is imagery to show with it.",
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
      "Ingestion, preparation, modelling and dashboards brought into one workflow for technical and non-technical users. Still in development, so the write-up waits until it has settled.",
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
      "A service that lets a cloud-hosted AI assistant run commands on your own machine, which is a security problem first and a feature second, and is built in that order.",
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
        body: "Commands execute as argument arrays and never as a shell string, which removes an entire class of injection instead of filtering for it. Execution is confined to allowed roots with denied executables, timeouts and output caps, and is wrapped in an operating-system job object so a spawned process tree can be killed as a unit. A three-mode policy decides whether each command runs, asks, or is refused outright; in ask mode it requires a one-time token minted only after a human clicks Approve. Outbound fetching is off by default, read-only when enabled, and blocks private address ranges.",
      },
    ],
    technicalDetails: [
      "argv-only execution: no shell string is ever constructed, which removes shell injection as a category.",
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
    note: "The whole pipeline, single-handed: model, sculpt, texture, animate, and into the engine.",
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
      "Modelling, sculpting, texturing, animation and engine work, plus XR training delivery.",
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
    note: "Taking the modelled interior and prop sets through lighting and render, so there is something to look at and not just a description of it.",
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
