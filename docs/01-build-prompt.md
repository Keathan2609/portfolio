# Claude Code Build Prompt — Keathan Naidoo Portfolio

Paste the block below into Claude Code as a single first turn.

---

## Objective

Build the complete, production-quality immersive portfolio website for **Keathan Naidoo** — one continuous scroll journey through five discipline worlds, ending in a hire-me conclusion. The website itself is the portfolio piece: it must be evidence that one person can combine software engineering, XR, AI/data science, creative design and cybersecurity into a single coherent digital product.

The visitor reaction we are engineering for is: *"This guy can build absolutely anything."*
Primary audience: employers, recruiters, technology companies, collaborators.
Tone ratio: **70% premium / 30% experimental** — premium always wins ties.

**Build it. Do not produce a plan, a wireframe, or a static landing page and stop.** Write the files, run the app, inspect it, fix what breaks, iterate until it matches the target. The deliverable is a working polished site, not a proposal.

**Do not ask me for confirmation between implementation steps unless you encounter a genuinely blocking ambiguity or destructive action. Make reasonable decisions yourself.** Where the spec is silent, choose whatever best serves: premium + immersive + technically impressive + performant + professional. Do not ask questions that design judgement can answer.

## Session Strategy

Continue in this project. Before writing any code:

1. Read `docs/00-architecture-research.md` in full — it is the technical foundation and its conclusions are binding.
2. Read `app/`, `components/`, `lib/` in full. The foundation phase is **already complete**. Inventory what exists before you touch anything.
3. Use a subagent for any file-heavy research or verification sweep so intermediate output stays out of main context.

## Context — what already exists. DO NOT RE-SCAFFOLD.

This is **not** a greenfield project. `create-next-app` has already run, dependencies are installed, and the architectural foundation is built, validated and passing. Re-scaffolding would destroy working code.

**Installed and pinned** (exact versions — do not upgrade or reinstall without cause):
`next@16.3.1` · `react@19.2.8` · `react-dom@19.2.8` · `three@0.185.1` · `@react-three/fiber@9.7.0` · `@react-three/drei@10.7.8` · `gsap@3.15.0` · `@gsap/react@2.1.2` · `lenis@1.3.26` · `typescript` · `@types/three` · `eslint-config-next`

**Already built and working — extend these, do not rewrite them:**

- `lib/scroll/ScrollProvider.tsx` — the single animation clock. GSAP ticker → `lenis.raf` → scroll event → `scrollState` + `ScrollTrigger.update()` → `runFrame` → R3F `advance()`. `lagSmoothing(0)` set, `normalizeScroll` deliberately off. The `<Clock>` child consumes `useLenis()` — this placement is load-bearing; a parent reading the ref gets `undefined`.
- `lib/animation/frame.ts` — frame bus decoupling the clock from three.js so R3F stays out of the main bundle.
- `lib/scroll/scroll-state.ts` — mutable module singleton (`scroll`, `velocity`, `progress`, `direction`, `limit`, `isScrolling`). Read this inside `useFrame`. Never route per-frame scroll through React state.
- `lib/animation/register.ts` — single GSAP plugin registration point. Register new plugins (SplitText, Observer) here only.
- `lib/animation/MotionProvider.tsx` — reduced-motion resolution via `useSyncExternalStore` + `data-motion` on `<html>`.
- `lib/performance/quality.ts` + `QualityProvider.tsx` — the HIGH/MEDIUM/LOW/NONE tier system. Detection memoised at module scope, runs once. `degrade()` floors at LOW.
- `lib/webgl/GlobalCanvas.tsx` + `CanvasRoot.tsx` + `WebGLView.tsx` — one persistent canvas, `frameloop="never"`, `dynamic(ssr:false)`, `pointer-events: none`, `eventSource` on the app shell, drei `View`/`View.Port` per region.
- `lib/webgl/utils/camera.ts` (pixel-unit FOV math) and `utils/dispose.ts` (GPU teardown + ref-counted texture cache).
- `lib/hooks/` — `useMediaQuery`, `useInView`, `useIsHydrated`.
- `lib/styles/` — `tokens.css`, `reset.css`, `typography.css`, `layout.css`.
- `lib/data/` — `types.ts`, `disciplines.ts`, `journey.ts`, `profile.ts`, `content.ts`. Typed, mostly empty, ready to populate.
- `components/layout/` — `AppShell`, `Header`, `JourneyNav`, `SkipLink`, `Stage`, `Footer`.
- `components/sections/` — `Opening`, `Hero`, `Intro`, `DisciplineWorld`, `SkillsArsenal`, `CurriculumVitae`, `HireMe` (all structural stubs).
- `components/ui/` — `MotionToggle`, `Pending`.
- `app/` — `layout.tsx`, `page.tsx`, `providers.tsx`, `globals.css`.

**Two things you must replace, not build around:**

- `lib/webgl/scenes/PlaceholderAtmosphere.tsx` — a wireframe icosahedron marked `SCAFFOLDING`. It exists only to prove the mount/track/tier path. Delete it once real world scenes exist.
- `components/ui/Pending` — dev-only "content pending" marker. Remove each usage as real content or placeholder copy lands.

**Known non-obvious facts, already discovered the hard way — do not re-derive:**

- Under `frameloop="never"`, R3F's `advance(t)` takes **seconds**, not milliseconds. It computes `delta = timestamp - clock.elapsedTime` and `elapsedTime` is in seconds. Passing ms gives every `useFrame` a ~16.7 *second* delta.
- Rendering a raw `<script>` tag inside the React tree breaks hydration on React 19 (it is not executed client-side). `next/script` with `beforeInteractive` does **not** avoid this. Reduced-motion default is therefore expressed in pure CSS (`@media (prefers-reduced-motion: reduce) { :root:not([data-motion="full"]) {...} }`), with `data-motion` layering the in-page override on top. Keep it that way.
- Any client-only content must be gated behind `useIsHydrated()` or it produces a hydration mismatch.
- **The in-app browser pane does not composite.** `requestAnimationFrame` fires **0 times**, which also kills `ResizeObserver` and `IntersectionObserver`, and screenshots time out. Scroll, view mounting, canvas sizing and animation will all appear broken there and are not. A dev-only `window.__knp` bridge exists (exposed from `ScrollProvider`, stripped in production) with `{ lenis, gsap, ScrollTrigger, scrollState, tick }` — pump `tick(t)` manually and dispatch a synthetic `resize` event to verify behaviour headlessly. Do not chase phantom bugs in that environment, and do not claim visual smoothness you have not actually observed.

## Non-negotiable rules — read before writing anything

**Never invent personal information.** Not employers, degrees, universities, clients, awards, certifications, years of experience, user counts, revenue, performance statistics, project outcomes, or URLs. Where a fact is unknown, write a polished editable placeholder that is obviously a placeholder — never a claim that reads as a real achievement. Keathan does **not** have a degree; the site must not imply otherwise, and must not contain a separate education section.

**No Lorem Ipsum.** Placeholder copy must be polished, in-voice, and structurally obvious as replaceable.

**DOM owns content. WebGL owns treatment.** Headings, navigation, project descriptions, CV, skills, contact details and links live in the DOM, always. WebGL may only carry hero objects, ambient environments, transitions, project visual planes and atmospheric effects. WebGL must never contain essential information. The site must be complete and beautiful with the canvas removed entirely — that is the acceptance test.

**Do NOT install:** `@14islands/r3f-scroll-rig`, Framer Motion, GSAP ScrollSmoother, Locomotive Scroll, React Spring, Theatre.js, styled-components, drei `ScrollControls`. The research concluded r3f-scroll-rig has useful *concepts* — persistent canvas, DOM/WebGL sync, DOM-tracked 3D, viewport-aware cameras — which are already implemented natively here. Do not add any dependency not already installed without stopping to ask.

**Do NOT build:** a blog · a separate "Selected Work" section (projects live inside their discipline worlds) · a downloadable/PDF CV · a contact form · a conventional large navbar · a fake loading screen · a photograph of Keathan · a separate logo.

**Do NOT produce these aesthetics:** excessive neon · glowing blobs · generic glassmorphism · giant rounded cards everywhere · excessive gradients · cliché cyberpunk · Matrix rain · hooded-hacker or skull imagery · endless green terminal text · excessive particles · unnecessary UI chrome · template dashboards · walls of text · meaningless animation. Every effect must have a reason. Do not overuse orange or green.

**Premium principle:** do not confuse complexity with quality. One sophisticated transition beats ten random effects. One beautiful typographic composition beats twenty floating cards. One excellent 3D object beats a scene full of meaningless geometry. Use restraint.

**Only build what this spec describes.** Do not add features, routes, abstractions, config, or files beyond it.

## Scope

- **Work in:** `app/`, `components/`, `lib/`, `public/`, `docs/`, `next.config.ts`
- **Do NOT touch:** `package-lock.json` (except as a side effect of an approved install), `node_modules/`, `.claude/`, `tsconfig.json`, `eslint.config.mjs`, `docs/00-architecture-research.md`
- Never give yourself a global instruction without a path anchor.

## The journey — one continuous page

The primary experience is **one continuous scroll journey**, not separate discipline routes. The order is fixed and already encoded in `lib/data/journey.ts`:

```
OPENING → HERO → PERSONAL INTRO
→ 01 / SOFTWARE ENGINEERING
→ 02 / XR DEVELOPMENT
→ 03 / AI / DATA SCIENCE
→ 04 / CREATIVE / DESIGN
→ 05 / CYBERSECURITY
→ SKILLS ARSENAL → CV → HIRE ME → FOOTER
```

Discipline worlds must feel like different environments **within the same universe**. Individual project case studies may later use routes; the main journey never fragments.

## Person and positioning

- **Name:** Keathan Naidoo
- **Email:** keathan179@gmail.com
- **Profiles:** Behance · GitHub · LinkedIn · TryHackMe · Kaggle — use clearly-marked placeholder URLs. Do not invent real ones.

Keathan is a multidisciplinary technical and creative builder spanning: software engineering, full-stack, web, XR, AI, data science, machine learning, data visualisation, automation, APIs, systems, cloud/infrastructure, graphic design, UI/UX, 3D, motion, VFX, cybersecurity, ethical hacking.

Communicate breadth without looking unfocused. The message is **"Different disciplines. One builder."**

## Experience levels — represent honestly, display subtly

Integrate levels into metadata or typography. **No large badges** reading "SENIOR" / "INTERMEDIATE". Context without visual dominance.

**XR DEVELOPMENT — Advanced.** Broad capability across the whole pipeline: XR application development, Unity, Unreal Engine, C#, 3D modelling, environment creation, UI/UX, animation, VFX, materials, texturing, Substance Painter, Maya, Blender, ZBrush, interactive experiences, end-to-end XR production. The world should communicate: *concept → 3D → interaction → development → final experience.*

**SOFTWARE ENGINEERING — Advanced / Broad.** Frontend, backend, full-stack systems, web applications, APIs, automation, AI agents, system architecture, databases, cloud, infrastructure, product development. Technologies: HTML5, CSS, JavaScript, TypeScript, React, Python, SQL, C#, C++, Azure, Kubernetes, Apache Superset. **Do not invent additional technologies.**

**AI / DATA SCIENCE — Intermediate → Advanced.** EDA, data cleaning, statistical analysis, forecasting, machine learning, predictive modelling, data visualisation, dashboards, applied AI, data-driven systems. Visual process: *RAW DATA → EDA → MODELLING → FORECASTING → PREDICTION → VISUALISATION.*

**CREATIVE / DESIGN — Advanced.** Graphic design, UI/UX, branding, visual identity, motion, 3D, VFX, illustration, typography, composition. Tools: Adobe Creative Cloud, Figma, Maya, Blender, ZBrush, Substance Painter. Treat design as a complete professional discipline, not a side skill.

**CYBERSECURITY — Currently Developing.** Honest representation is mandatory. Keathan is actively building this capability and studying ethical hacking. Areas: penetration testing, ethical hacking, CTFs, bug bounty research, SOC analysis, security analysis. Tone: *"I am actively building this capability"* — never *"I am already an expert."* Do not position him as a senior security professional. Include TryHackMe as a profile.

## Design system

Dark foundation: near-black backgrounds, sophisticated dark neutrals, controlled accents, strong typography, generous negative space, subtle atmospheric lighting. Tokens already exist in `lib/styles/tokens.css` — extend that system rather than introducing parallel values. No magic numbers in components.

World accents (treat as one system, not five isolated palettes):
- Software — electric / deep blue
- XR — violet / ultraviolet
- AI / Data — cyan / cool spectral
- Creative — a sophisticated editorial accent
- Cybersecurity — a sophisticated cold/security tone, **not** cliché green

**Typography is a primary visual tool.** Large type dominates the hero, discipline introductions, major statements and the final CTA. Small type carries metadata, technologies, navigation and supporting information. Use type to create rhythm. No separate logo. Keathan's name appears prominently mainly in the **hero** and **footer**.

## Section specifications

**OPENING.** Short, cinematic, typographic, minimal, elegant, purposeful. **Not a fake loading screen** — never "INITIALIZING...", "LOADING SYSTEM...", "CONNECTING...". Build it from typography, abstract geometry, light, layering, motion and atmospheric form, then transition naturally into the hero. It must be skippable or complete quickly. Never make a visitor wait.

**HERO.** Establishes `KEATHAN NAIDOO` and `I BUILD. ABSOLUTELY ANYTHING.` Art-directed, not stacked text. Cinematic. No photograph — use an abstract/generated environment: 3D object, spatial geometry, interface fragments, data, architectural forms, light, atmospheric objects, subtle particles. The visual supports the typography; **the name is the hero.** This is one of the few places WebGL may opt into interaction.

**PERSONAL INTRO.** First-person, immediately after the hero. **Not a services grid.** Communicates who Keathan is, what he builds, his multidisciplinary nature, and why the disciplines belong together. Tone: confident + intelligent + human + technical. Ban corporate cliché — no "passionate professional", "results-driven individual", "dynamic team player". Editable placeholder copy is fine.

**DISCIPLINE INTRO FORMAT.** Deliberately minimal, e.g.:
```
01 / SOFTWARE ENGINEERING
I build products, systems and infrastructure from interface to backend.
```
One short introductory line per world. No opening essays. An "in and out" moment.

**01 SOFTWARE ENGINEERING WORLD.** A sophisticated digital systems environment: application interfaces, architecture, system diagrams, data flows, infrastructure, code fragments used sparingly, abstract digital structures. Do not fill the page with code. It should feel like a living system. Project placeholders (1–2, clearly placeholders, never presented as completed work):
- `ENTERPRISE OPERATIONS PLATFORM` — "A placeholder full-stack system demonstrating the final project presentation format." — `REACT · TYPESCRIPT · PYTHON · SQL · API`
- `AUTOMATION INTELLIGENCE SYSTEM` — `PYTHON · API · AUTOMATION · AI`

**02 XR WORLD.** Should be one of the most visually impressive worlds. Transition into spatial 3D: geometry, environments, lighting, VFX, materials, depth, animation, spatial interfaces, camera movement. Communicates end-to-end XR capability. Placeholders:
- `XR INTERACTIVE EXPERIENCE` — `UNITY · C# · BLENDER · VFX`
- `IMMERSIVE TRAINING ENVIRONMENT` — `UNREAL ENGINE · MAYA · ZBRUSH · SUBSTANCE PAINTER`

Build the architecture and a polished placeholder visual treatment now; generated imagery arrives later.

**03 AI / DATA WORLD.** Transition from spatial into data. Visual concepts: data streams, predictive curves, dynamic charts, particles becoming datasets, network structures, forecasting trajectories, statistical patterns. **Not a generic dashboard.** Placeholders:
- `PREDICTIVE FORECASTING ENGINE` — `PYTHON · SQL · ML · FORECASTING`
- `DECISION INTELLIGENCE DASHBOARD` — `PYTHON · SQL · DATA VISUALIZATION`

**04 CREATIVE / DESIGN WORLD.** Must feel significantly different from the others. Typography, editorial composition, graphic design, visual identity, motion, 3D, art direction, abstract visual forms. **Not a Behance clone.** Large visual compositions, not card-heavy UI. Placeholders:
- `BRAND IDENTITY SYSTEM` — `ADOBE CREATIVE CLOUD · FIGMA`
- `3D / MOTION EXPERIMENT` — `BLENDER · MAYA · ZBRUSH · SUBSTANCE PAINTER`

**05 CYBERSECURITY WORLD.** Sophisticated security environment. Use network topology, security infrastructure, threat maps, system relationships, controlled terminal typography, dark technical architecture. Display `CYBERSECURITY` / `CURRENTLY DEVELOPING`. Editable activity placeholders: CTF Challenge, Penetration Testing Lab, SOC Investigation, Bug Bounty Research. Include TryHackMe.

**TRANSITION SYSTEM — one of the most important parts of the site.** Do **not** reuse the same fade between worlds. Each transition gets a distinct mechanic that communicates the conceptual relationship between the disciplines:
- Software → XR: digital interfaces and system architecture expand into spatial geometry
- XR → AI/Data: 3D space fragments into particles and reorganises into data structures
- AI/Data → Creative: charts and data flatten into typography and graphic composition
- Creative → Cybersecurity: graphic compositions break into structured networks and system relationships

Cinematic but performant. GSAP and WebGL where appropriate. Precompile shaders and preload incoming assets before a transition starts — a transition that hitches on frame one is worse than no transition.

**SKILLS ARSENAL.** The main technology section, interactive. **Not a logo grid.** Visual concept: a technical constellation — skills cluster, orbit, connect, respond to hover and selection, and highlight based on the currently visible discipline. Hover may reveal name, category, related discipline, short description. Keep the interaction legible, not elaborate. Exact categories and skills — **do not invent additional skills**:

```
PROGRAMMING          HTML5, CSS, JavaScript, TypeScript, React, Python, SQL, C#, C++
XR / 3D              Unity, Unreal Engine, Maya, Blender, ZBrush, Substance Painter
DESIGN               Adobe Creative Cloud, Figma
CLOUD / INFRA        Azure, Kubernetes, Apache Superset
DATA / AI            Python, SQL, Machine Learning, Forecasting, Data Visualization, Applied AI
SECURITY             Penetration Testing, CTFs, SOC Analysis, Bug Bounty, Ethical Hacking
```

**CV / PROFESSIONAL PROFILE.** Lives inside the website. **No PDF, no download button.** Polished and interactive, containing: PROFILE (editable summary) · EXPERIENCE (editable placeholders, no invented employers) · PROFESSIONAL DEVELOPMENT (XR: Advanced · Software Engineering: Advanced/Broad · Data Science: Intermediate→Advanced · Cybersecurity: Currently Developing) · CERTIFICATIONS (editable placeholders) · TRAINING (editable placeholders) · TIMELINE (visual professional timeline). **No education section.**

**CURRENTLY BUILDING / LEARNING.** Small section integrated near the CV, titled exactly that. Editable examples: cybersecurity development, AI experiment, XR prototype, automation experiment. Clearly marked as placeholders — never presented as completed achievements.

**BEYOND THE CODE.** A small visual moment reinforcing creative range — 3D, VFX, motion, visual design, creative experiments. Not another giant portfolio category; a reminder of the range behind the engineering.

**HIRE ME.** The conclusion of the journey. Opens with `HAVE AN IDEA?` / `LET'S BUILD IT.` — large, typographic, dramatic. Then `KEATHAN NAIDOO` and `keathan179@gmail.com`. Then minimal typographic links: `BEHANCE` `GITHUB` `LINKEDIN` `TRYHACKME` `KAGGLE`, with strong hover interactions. **No contact form. No generic "Get in touch" card.**

**FOOTER.** Minimal. Name prominent. Relevant professional links. Do not overload it.

## Interaction systems

**NAVIGATION.** No conventional large navbar. A minimal system giving access to Software · XR · AI/Data · Creative · Cybersecurity · Skills · CV · Hire Me. It should feel integrated into the experience; the visitor still primarily follows the curated scroll. Extend the existing `JourneyNav`.

**JOURNEY INDICATOR.** Subtle, persistent, updates on scroll, never dominates: `01 SOFTWARE` · `02 XR` · `03 AI / DATA` · `04 CREATIVE` · `05 CYBER`.

**CURSOR.** Custom desktop cursor, subtle, not oversized. Contextual states: normal `•` · project `VIEW` · interactive `EXPLORE` · navigation `OPEN`. Disable or simplify on touch. **The cursor must never be required for interaction.**

**HORIZONTAL MOVEMENT.** The site stays primarily vertical. Use horizontal movement selectively — project showcases, visual galleries, creative compositions, specific immersive moments. Never make the whole site horizontal. Use ScrollTrigger `containerAnimation` for horizontal sub-tracks.

**PROJECT SYSTEM.** Reusable architecture supporting: title, description, role, technologies, images, video, case study, links, outcome, technical information. Small projects render as visual + title + description + technology. Larger projects expand into a full-screen case study / takeover / overlay. Choose the right presentation per project. The media system must eventually support screenshots, videos, 3D renders, diagrams, UI, code, architecture and process images — build the presentation system now, content lands later.

**GENERATED VISUALS (Higgsfield, later).** Design to accommodate generated assets for hero cinematics, discipline environments, transition visuals and atmospheric moments. Build a clean media system so final assets drop in over placeholders: still images, short video loops, poster frames. Do not build the site around hundreds of assets. Lazy-load media, never autoplay large video everywhere, optimise everything.

## Animation and WebGL architecture

Use the clock that already exists. **Do not introduce a second RAF loop, scroll listener, or animation runtime.** Every new animation goes through `useGSAP` with a `scope` ref so it self-cleans on unmount; never a bare `useEffect`. Use timelines, not stacked tweens. Numeric `scrub` (e.g. `scrub: 1`) for scroll-linked motion. One pinned trigger per act with `pinSpacing: true` — nested pins cause layout jumps. Call `ScrollTrigger.refresh()` after fonts and late media settle.

One persistent canvas at the app root, already built. Worlds declare a `<WebGLView>`; drei `View` scissors that DOM region out of the shared canvas. **Never mount a second canvas or unmount the root one between disciplines.** Read scroll from `scrollState` inside `useFrame` — never from React state. Gate each world's `useFrame` on its in-view state so five worlds never tick at once. Dispose GPU resources explicitly on unmount using `lib/webgl/utils/dispose.ts`.

WebGL is **non-interactive by default**. Individual scenes opt in via `<WebGLView interactive>` — hero object, skills visualisation, a specific project visual. The WebGL layer must never globally interfere with normal page interaction.

## Performance

Performance is critical, not a polish-phase afterthought. Implement: `next/image` with AVIF/WebP and responsive `sizes` · lazy loading · dynamic imports · WebGL code splitting · video poster frames · lazy video loading · explicit 3D resource disposal · mobile fallbacks · reduced motion.

Every WebGL feature must read the existing **HIGH / MEDIUM / LOW / NONE** tier via `useQuality()`. **Do not scatter device checks through the application** — the tier is the single source of truth. Budgets: LCP < 2.5s · INP < 200ms · CLS < 0.1 · initial JS < 300KB gzipped excluding the lazy WebGL chunk · 60fps desktop, 30fps floor mobile.

## Accessibility

The portfolio must remain complete and beautiful without WebGL. Semantic HTML · keyboard navigation · visible focus states · appropriate contrast in **every** discipline palette · reduced motion honoured · screen-reader-readable content · accessible interactive controls. Focus moving to an off-screen element must bring it into view. Pinned and scroll-driven sections must be keyboard-traversable. Split text must carry an `aria-label` with the full string and be reverted on unmount. The canvas stays `aria-hidden`.

## Responsive

Desktop is the primary experience; build it first. Mobile **intentionally simplifies** WebGL, cursor, complex transitions, horizontal scrolling, video and large 3D environments — while still feeling like the same portfolio. **Do not simply shrink desktop layouts**; re-lay them. Use `100dvh`, not `100vh`.

## Data architecture

All content is data-driven through `lib/data/`: disciplines, projects, skills, experience, certifications, training, links, currently-building items. Keathan must be able to replace every piece of content later **without touching a component**. Nothing hardcoded in JSX.

## Code quality

TypeScript throughout · reusable components · clear naming · sensible separation of concerns · minimal dependencies · clean hooks · reusable animation utilities · reusable WebGL utilities.

Avoid: giant components · duplicated animation logic · unnecessary state · unnecessary global state · fragile DOM selectors · magic numbers scattered through components.

## Validation — run these, fix what fails

```
npx tsc --noEmit
npx eslint .
npx next build
npm run dev
```

Then verify, and report honestly on each: desktop scrolling · mobile behaviour · keyboard navigation · reduced motion · WebGL fallback (tier NONE) · navigation · journey indicator · project interactions · skills interaction · CV · Hire Me links · no horizontal overflow · no console errors · no hydration warnings.

Do not leave obvious runtime or build errors unresolved. If you cannot verify something in this environment, say so explicitly rather than asserting it works.

## Implementation order

You have autonomy over exact sequencing, but progress roughly:

**FOUNDATION** (already done — verify, extend, do not rebuild): architecture · design system · typography · Lenis · GSAP · WebGL · quality tiers
**→ EXPERIENCE:** opening · hero · intro · navigation · journey indicator
**→ WORLDS:** software · XR · AI/data · creative · cybersecurity, with their distinct transitions
**→ SYSTEMS:** projects · skills arsenal · CV · currently building · beyond the code
**→ END:** hire me · footer
**→ POLISH:** performance · accessibility · responsive · animation refinement · error fixing

**Do not stop after any one phase.** The objective is the complete working website.

## Acceptance criteria

- [ ] `npx tsc --noEmit`, `npx eslint .` and `npx next build` all pass clean
- [ ] Dev server runs with no console errors and no hydration warnings
- [ ] All 12 journey stages render in order on one continuous page, no separate discipline routes
- [ ] Each of the five worlds has a distinct visual identity, atmosphere, motion language and composition
- [ ] Each of the four world-to-world transitions uses a **different** mechanic
- [ ] Exactly one WebGL canvas exists, mounted once, never unmounted between disciplines
- [ ] Canvas is `pointer-events: none` by default; only explicitly-opted-in views accept pointers
- [ ] With WebGL disabled (quality tier NONE), the site is complete, readable and beautiful
- [ ] All content — headings, projects, skills, CV, contact, links — is present in the SSR HTML with scripts stripped
- [ ] Skills Arsenal is interactive, constellation-style, highlights by active discipline, and contains exactly the listed skills
- [ ] CV renders all six blocks with no education section and no download button
- [ ] Hire Me shows the CTA, name, `keathan179@gmail.com`, and five typographic profile links — no form
- [ ] Custom cursor works on desktop, is disabled/simplified on touch, and is never required for interaction
- [ ] Reduced motion removes pinning and scrubbed motion, and caps the WebGL tier
- [ ] Keyboard navigation reaches every interactive element with visible focus, and focus follows the viewport
- [ ] Mobile is re-laid rather than scaled down; no horizontal overflow at 375px
- [ ] Zero invented employers, degrees, certifications, clients, awards, statistics, outcomes or URLs
- [ ] No Lorem Ipsum; all placeholder copy is polished and obviously replaceable
- [ ] All content is editable from `lib/data/` without touching components
- [ ] `PlaceholderAtmosphere` and `Pending` are removed once superseded

## Stop conditions

Stop and ask before:
- Adding **any** dependency not already installed
- Deleting any file outside `lib/webgl/scenes/PlaceholderAtmosphere.tsx` and `components/ui/Pending/`
- Modifying `tsconfig.json`, `eslint.config.mjs`, or `package-lock.json` directly
- Re-running `create-next-app`, or any operation that would overwrite the existing foundation
- Working outside the Scope paths
- Any change that would put content inside WebGL, or require WebGL for the site to be complete

## Progress

After each completed step, output one line: `✅ [what was done] — [file(s) affected]`.
Report failures with the actual error output. If a test fails, say so. If you skipped something, say so. Do not report completion until the acceptance criteria are genuinely met.

## Final quality bar

The finished site must not feel like *"an AI made me a portfolio."* It must feel like a highly skilled technical/creative person built an experimental digital product to represent themselves — the website itself becoming evidence of the capability it describes.

A visitor understands what Keathan does within seconds. A visitor who explores discovers far more depth. The emotional progression is: **INTEREST → CURIOSITY → EXPLORATION → IMPRESSED → I WANT TO HIRE THIS PERSON.**

The complete experience communicates ENGINEERING + XR + DATA + AI + DESIGN + SECURITY + ART without reading as seven unrelated careers.

**DIFFERENT DISCIPLINES. ONE BUILDER.**
**KEATHAN NAIDOO — I BUILD ABSOLUTELY ANYTHING.**
