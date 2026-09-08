# Keathan Naidoo Portfolio — Technical Research & Architecture Decisions

Research phase output. No code written, nothing installed.
Date: 2026-08-19. All versions verified against the npm registry on this date.

---

## 0. Assumption being made

"Discipline worlds" is read as: N discrete themed sections (each with its own palette,
typography treatment, 3D/shader identity and content), connected by an authored
transition rather than a hard cut. Whether these are **routes** or **scroll sections**
is the single biggest architectural fork and is called out in §4 and §9. Everything
below works for both, but the pinning strategy differs.

---

## 1. Repository findings

### REF-01 — pmndrs/react-three-fiber
R3F is a **React reconciler for Three.js**, not a wrapper. `<mesh />` literally
constructs `new THREE.Mesh()`; props map onto instance properties, and `attach`
wires children into parent slots. Consequences that matter here:

- The scene graph is **declarative and diffable** — swapping a whole discipline
  world is a React state change, not manual `scene.remove()` bookkeeping.
- `useFrame` subscribes to R3F's own RAF loop, which runs **outside React render**.
  Animating via `useFrame` + refs costs zero re-renders. Animating via `setState`
  per frame is the single most common R3F performance mistake.
- `frameloop` has three modes: `"always"` (default), `"demand"` (renders only on
  `invalidate()`), and `"never"` (renders only on manual `advance(time)`).
  **`"never"` is the key to true scroll/WebGL sync** — see §3.
- Events are raycast-based, opt-in per object, and can be re-hosted onto a DOM
  container via `eventSource` + `eventPrefix` — required when the canvas is a
  fixed background layer behind DOM content.
- Version pairing is strict: **fiber 9 ↔ React 19**, fiber 8 ↔ React 18.

**Verdict:** genuinely worth it here. Manual Three.js for a multi-world portfolio
means hand-rolling mount/unmount, disposal and state sync for every world. R3F
deletes that entire class of work.

### REF-02 — pmndrs/drei
Grab-bag of abstractions over R3F. Peer deps on 10.x: `react ^19`, `@react-three/fiber ^9`,
`three >=0.159`. Tree-shakes per-import, but individual imports drag heavy transitive
deps (`troika-three-text`, `@mediapipe/tasks-vision`, `hls.js`, `three-mesh-bvh`) — so
the rule is **import narrowly, audit the bundle after each addition**.

Worth using:
- `<View>` / `<View.Port>` — multiple independent scenes tracked to DOM elements in
  **one canvas**, via `gl.scissor`. This is the load-bearing primitive for discipline worlds.
- `<PerformanceMonitor>` + `<AdaptiveDpr>` — runtime DPR/quality degradation.
- `useTexture` / `useGLTF` / `useVideoTexture` — suspense-based loaders with preload.
- `<Environment>` (prefer a small local `.hdr`, never the CDN presets in production).
- `<PerspectiveCamera makeDefault>`, `<Preload all />`, `<Instances>`, `<Bvh>`.

Explicitly **not** worth using: `<ScrollControls>` (§3), `<OrbitControls>` (a portfolio
should not hand the camera to the visitor), `<Html>` (breaks the DOM-owns-content rule),
`<Loader>` (build a branded one).

### REF-03 — greensock/GSAP
Version **3.15.0**. Since the Webflow acquisition (license effective 2025-04-30),
**all plugins — ScrollTrigger, SplitText, ScrollSmoother, MorphSVG — are free on
public npm**, commercial use included. The only restrictions are on building a
competing no-code animation tool and reverse-engineering. No `.npmrc` token, no
private registry.

React integration is `@gsap/react`'s **`useGSAP()`** hook (2.1.2), which is the
non-negotiable part:
- Drop-in for `useLayoutEffect`, SSR-safe (`useIsomorphicLayoutEffect` internally).
- Auto-creates a `gsap.context()` and **auto-reverts every animation, ScrollTrigger
  and DOM mutation on unmount** — which is what makes StrictMode double-invoke and
  route changes survivable.
- `scope: containerRef` confines selector strings to that subtree — mandatory when
  the same component renders once per discipline.
- Animations created *after* the hook body (click handlers, `setTimeout`) are **not**
  auto-tracked; they must be wrapped in `contextSafe()`.
- Every file using it needs `"use client"` under the App Router.

ScrollTrigger capabilities relevant to the brief: `pin` (with `pinSpacing`),
`scrub` (numeric scrub = inertial lag), `snap`, `containerAnimation` (for
horizontal sub-tracks), `toggleActions`, and `ScrollTrigger.create` returning
handles for `.refresh()` / `.kill()`. SplitText handles per-char/word/line text
reveals and now correctly re-splits on resize with `autoSplit`.

### REF-04 — darkroomengineering/lenis
Version **1.3.26**, actively maintained (published this month). Not a scroll
hijacker — it **lerps the real `window.scrollY`**, so sticky, anchor links,
`scroll-margin`, browser find-in-page and the scrollbar all keep working. That
distinction is why it is preferable to Locomotive Scroll.

Critical facts:
- Ships `lenis/react` with `<ReactLenis>` and `useLenis(cb, deps, priority)`.
- **Respects `prefers-reduced-motion` by default** — smoothing off, programmatic
  scrolls become instant jumps. Exposed as `lenis.prefersReducedMotion`.
- Must be driven by exactly one RAF: either `autoRaf: true`, or `autoRaf: false`
  plus a manual `lenis.raf(timeMs)` call. **For GSAP integration it must be `false`.**
- CSS `scroll-snap` is not supported; use the Lenis snap plugin if snapping is needed.

Documented GSAP wiring (this is the canonical pattern, adapted to React):
```js
lenis.on('scroll', ScrollTrigger.update)
gsap.ticker.add((time) => lenis.raf(time * 1000))
gsap.ticker.lagSmoothing(0)
```

### REF-05 — 14islands/r3f-scroll-rig
Solves exactly the DOM ↔ Scroll ↔ WebGL problem in the brief. Core concepts:

- **`<GlobalCanvas>`** — one persistent canvas for the whole app lifetime. No context
  loss on navigation, shared renderer/textures.
- **`<UseCanvas>`** — a tunnel: a DOM-side component pushes Three.js children into
  the global canvas while mounted, and pulls them out on unmount.
- **`<ScrollScene>`** — measures a DOM element via `getBoundingClientRect()` once,
  then keeps it tracked with IntersectionObserver + ResizeObserver, and positions/scales
  a mesh so **1 CSS pixel = 1 world unit**.
- **`<ViewportScrollScene>`** — same, but with its own camera/lights/env per element
  (scissored viewport). Directly analogous to a "discipline world".
- **`<SmoothScrollbar>`** — wraps Lenis, and crucially drives the WebGL frame from
  the same tick so there is zero drift between a DOM element and its WebGL twin.

**But:** latest release is **8.15.0, published 2024-12-04** — roughly 20 months stale
as of today. Peer ranges (`@react-three/fiber >=8`, `@react-three/drei >=9`, `react >=18`)
were authored for the R3F 8 / React 18 era, well before fiber 9.7 and drei 10.7. It also
pulls a sizeable dependency tail: `query-string`, `@types/query-string` (a runtime dep,
which is a smell), `@juggle/resize-observer`, `supports-webp`, `vecn`, `debounce`,
`zustand`, `react-intersection-observer`, `@14islands/lerp`, `suspend-react`, `lenis`.
And it takes ownership of both the canvas and the scroll layer.

**Verdict: do not install. Steal the three ideas.** They are ~200 lines of our own code
(persistent canvas, `useTrackedElement`, unit-matched camera) with zero version risk
and no lost control over the two systems the whole site depends on.

### REF-06 — adrianhajdin/3d-portfolio
React 19 + **Vite** + Tailwind + R3F + drei + GSAP ScrollTrigger. Useful as proof that
this stack ships, and for its explicit "mobile optimized 3D experience" split. But it is
a tutorial build: flat `src/components` with one component per page section, content
hardcoded inside JSX, and no data layer. **Take the stack, reject the structure** —
hardcoded content is exactly what makes a portfolio painful to update in month three.

### REF-07 — darkroomengineering/satus
The most instructive reference. A production studio starter: **Next.js 16 + React 19,
App Router, TypeScript strict, Tailwind v4 + CSS Modules, GSAP, Lenis, Tempus,
Theatre.js, optional R3F**, with Storybook, Playwright and Lighthouse CI.

The two ideas worth adopting verbatim:
1. **`components/` = UI, `lib/` = everything else** (`lib/hooks`, `lib/webgl`,
   `lib/styles`, `lib/integrations`). Dead simple, scales, no bikeshedding.
2. **WebGL is an opt-in module under `lib/webgl/`, not a baked-in default.** The site
   is architected to work with the canvas removed. That is the correct posture for a
   portfolio that must survive a low-end phone and a recruiter with an ad-blocker.

It also confirms the RAF thesis: they route *everything* through a single orchestrator
(Tempus). We'll use `gsap.ticker` for the same purpose — one less dependency.

---

## 2. Recommended stack

| Layer | Choice | Version (2026-08-19) |
|---|---|---|
| Framework | **Next.js, App Router** | 16.3.0 |
| React | React | 19.2.x |
| Language | TypeScript (strict) | 5.x |
| Styling | CSS Modules + design tokens in plain CSS custom properties | — |
| Scroll | `lenis` | 1.3.26 |
| Animation | `gsap` + `@gsap/react` | 3.15.0 / 2.1.2 |
| 3D | `three` + `@react-three/fiber` + `@react-three/drei` | 0.185.1 / 9.7.0 / 10.7.8 |

### Why Next.js over Vite

The 3D work is 100% client-side either way, so this is *not* decided by rendering.
It is decided by everything around the 3D:

- **Discoverability.** A portfolio is a sales document that gets googled and pasted
  into Slack/LinkedIn/WhatsApp. Per-route `metadata`, `generateMetadata`, and dynamic
  OG image generation are first-class in Next and hand-rolled in Vite.
- **Media pipeline.** `next/image` (AVIF/WebP, correct `sizes`, blur placeholders) and
  `next/font` (self-hosted, zero layout shift) directly attack the two biggest perf
  risks in §7. Vite equivalents are all third-party and manual.
- **Routing.** If disciplines become routes, App Router gives prefetching, nested
  layouts (the persistent canvas lives in the root layout and survives navigation),
  and `loading.tsx` boundaries for free.
- **Turbopack is stable and default in 16**, so the historical "Vite is faster in dev"
  argument is largely gone.
- **Deployment is unconstrained** — `output: 'export'` produces a static bundle for any
  host if Vercel isn't wanted.

Cost: `"use client"` on essentially every animated component, and a hydration pass Vite
doesn't have. Both are acceptable and manageable.

**When Vite would be the right call instead:** if this is deliberately a single-page,
single-route, no-SEO, no-CMS experience and you want the absolute minimum ceremony.
That is a legitimate choice — just make it deliberately now, because migrating later is
a real cost.

### `next.config.ts` requirements
- `transpilePackages: ['three']` — Next 13.1+ requirement for the three.js add-on ecosystem.
- Do **not** blanket-disable SSR. Use `dynamic(..., { ssr: false })` only on the canvas
  root, so the DOM content still server-renders.

---

## 3. Recommended animation architecture

### The one rule: a single RAF drives everything

Three systems each want their own frame loop — Lenis, GSAP, and R3F. If they run
independently, WebGL objects lag their DOM counterparts by up to a frame, which
reads as visible jitter on any pinned/tracked element. **GSAP's ticker becomes the
single clock; Lenis and R3F both subscribe to it.**

Ownership chain:

```
gsap.ticker (the only RAF)
  └─> lenis.raf(time * 1000)          // Lenis lerps window.scrollY
        └─> lenis 'scroll' event
              └─> ScrollTrigger.update()   // all DOM scroll animation
  └─> r3fAdvance(time)                 // Canvas frameloop="never"
```

Concretely:

1. `<ReactLenis root options={{ autoRaf: false }} ref={lenisRef}>` wraps the app in
   the root layout.
2. A `ScrollProvider` client component does, once, on mount:
   - `gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText)`
   - `lenis.on('scroll', ScrollTrigger.update)`
   - `gsap.ticker.add(update)` where `update(time)` calls `lenis.raf(time * 1000)`
   - `gsap.ticker.lagSmoothing(0)` — **required**; otherwise GSAP silently clamps
     large deltas after a tab blur and Lenis and ScrollTrigger desynchronise.
   - full teardown on unmount (`gsap.ticker.remove`, `lenis.off`).
3. `ScrollTrigger.normalizeScroll()` must stay **off** — it fights Lenis for the
   scroll position. Same for `ScrollTrigger.scrollerProxy`: unnecessary, because
   Lenis drives the native scroller rather than a transformed container.
4. **Do not use ScrollSmoother.** It is free now, but it and Lenis solve the same
   problem and cannot coexist. Lenis wins here because we need to read a single
   authoritative scroll value into WebGL.

### Component-level animation
Every animation lives inside `useGSAP` with a `scope`, never a bare `useEffect`:

```tsx
'use client'
const root = useRef<HTMLElement>(null)
const { contextSafe } = useGSAP(() => {
  const tl = gsap.timeline({
    scrollTrigger: { trigger: root.current, start: 'top 70%', scrub: 1 },
  })
  tl.from('.line', { yPercent: 110, stagger: 0.06 })
}, { scope: root, dependencies: [slug], revertOnUpdate: true })
```

This gives automatic ScrollTrigger cleanup on unmount — which is the difference
between a site that survives ten route changes and one that leaks triggers until
scrolling stutters.

### Choreography conventions to fix now
- **Timelines, not stacked tweens.** One master timeline per scroll act, labelled,
  so timing is editable in one place.
- **`scrub: 1`** (numeric, not `true`) for scroll-linked motion — the ~1s catch-up
  is what makes it feel expensive rather than mechanical.
- **Pinning:** exactly one pinned trigger per act, with `pinSpacing: true`. Nested
  pins are the #1 source of layout jumps. Pin a wrapper, animate its children.
- **Text:** SplitText with `autoSplit: true`, and *always* restore on unmount —
  split text is invisible to screen readers if left un-reverted after an error.
- **Refresh discipline:** call `ScrollTrigger.refresh()` after fonts load and after
  any late-loading media resizes the document. Register triggers in a stable order.
- **Masking:** CSS `clip-path` / `overflow: hidden` wrappers animated by GSAP —
  cheaper and more reliable than canvas-based masking for DOM content.

---

## 4. Recommended 3D / WebGL architecture

### Where 3D genuinely earns its place
Only four places. Everything else is DOM.

1. **Hero signature object** — the one bespoke thing that says "this person can build
   what others can't". Highest ROI per byte on the whole site.
2. **Discipline-world transitions** — a fullscreen shader (displacement / RGB shift /
   feedback warp) driven by a single normalized progress value. This is the effect
   that cannot be faked in CSS, and it is the reason WebGL is in this project at all.
3. **Project media treatment** — project thumbnails as WebGL planes with scroll-driven
   distortion, hover ripple, and a shared-element morph into the case study.
4. **Ambient world backdrops** — a per-discipline particle field or gradient-noise
   shader, scissored to its section.

### Where it must NOT be used
Text, navigation, layout, buttons, forms, case-study body copy, or anything a
screen reader or Google needs to read. **The DOM owns content; WebGL owns treatment.**
This single rule is what makes the accessibility and SEO strategies in §7–8 possible
rather than aspirational.

### The structure

**One persistent canvas.** A single `<Canvas>` mounted in the root layout, `position: fixed`,
`inset: 0`, `z-index: 0`, `pointer-events: none`, behind the DOM. Never unmounted, so
there is no WebGL context loss on route change and textures/geometry stay warm.
DOM content sits above it with `z-index: 1` and a transparent background where the
canvas should show through.

**Scenes are tunnelled in from DOM components.** Rather than one giant scene file, each
section declares its own 3D content and pushes it into the global canvas while mounted —
drei's `<View>` + `<View.Port />` does exactly this via `gl.scissor`, giving each
discipline world its own camera, lights and environment inside the one canvas.
`eventSource={containerRef}` + `eventPrefix="client"` re-hosts pointer events onto the
DOM wrapper so both layers stay interactive.

**Sync is manual and exact.** `<Canvas frameloop="never">`, and the `ScrollProvider`
calls R3F's `advance(time)` from the same `gsap.ticker` callback, *after* `lenis.raf()`.
Scroll position is written into a plain module-level object (or a Zustand store read via
`getState()` inside `useFrame`, never via a hook subscription) so no React render happens
per frame.

**Unit matching.** DOM-tracked meshes use 1 world unit = 1 CSS pixel, by deriving the
camera FOV from the viewport:
`fov = 2 * Math.atan(viewportHeight / (2 * cameraZ)) * 180 / Math.PI`.
Then a tracked element's mesh is simply `scale=[rect.width, rect.height, 1]` at
`position=[rect.left + rect.width/2 - vw/2, -(rect.top + rect.height/2) + vh/2, 0]`.
A `useTrackedElement(ref)` hook wraps this with ResizeObserver + IntersectionObserver.

### Should r3f-scroll-rig be used directly? — **No.**
- Last publish 2024-12-04; peer ranges predate R3F 9 / drei 10 / React 19.
- Twelve runtime dependencies, several of which we'd otherwise never ship.
- It owns the canvas *and* the scroll layer — the two things this site's identity
  depends on most, and the two places we'll need bespoke behaviour for the
  discipline transitions.
- Its actual value is three ideas, all reimplementable in ~200 lines we control.

**Use it as the spec, not the dependency.** If a prototype proves the custom tracking
is genuinely harder than expected, revisit — but start custom.

---

## 5. Recommended dependencies

**Install (core):**
- `next`, `react`, `react-dom`, `typescript`
- `gsap`, `@gsap/react`
- `lenis`
- `three`, `@types/three`, `@react-three/fiber`, `@react-three/drei`

**Install only when a specific need appears (justify each):**
- `zustand` — cross-component 3D/UI state. Only if prop-drilling actually hurts;
  R3F already bundles it transitively, but declare it explicitly if used directly.
- `@react-three/postprocessing` + `postprocessing` — **only** if bloom/DOF is required.
  Discipline transitions should first be attempted as a single custom fullscreen
  shader quad, which is far cheaper than an EffectComposer stack.
- `@studio-freight/hamo` or a small `useResizeObserver` — or write ~30 lines.
- `next-sitemap` — if project pages become numerous.

**Do NOT install:**

| Package | Reason |
|---|---|
| `@14islands/r3f-scroll-rig` | Stale (2024-12), pre-R3F-9 peers, heavy dep tail, takes ownership of canvas + scroll. Replicate its techniques instead. |
| `gsap` ScrollSmoother | Duplicates Lenis; cannot coexist. Pick Lenis. |
| `locomotive-scroll` | Superseded by Lenis; transforms a container, breaking sticky/anchors/find-in-page. |
| `framer-motion` / `motion` | Second animation runtime with its own RAF. GSAP + ScrollTrigger covers 100% of the brief. Choose one. |
| `@react-spring/*` | Same — third physics/animation runtime. |
| `drei` `<ScrollControls>` | Hijacks scroll into its own transformed container. Incompatible with Lenis, and it hides DOM content from crawlers. |
| `drei` `<OrbitControls>` | Hands camera authorship to the visitor; wrecks art direction and breaks scroll on touch. |
| `drei` `<Html>` | Puts content inside WebGL. Violates the DOM-owns-content rule. |
| `theatre.js` | Excellent (satus uses it) but an editor-plus-runtime for a solo build. GSAP timelines are enough. |
| `react-scroll-parallax`, `aos`, `rellax` | Redundant with ScrollTrigger; each adds a scroll listener that fights Lenis. |
| `styled-components` / `emotion` | Runtime CSS-in-JS + App Router = hydration and streaming friction. CSS Modules are free. |
| `three-stdlib` (direct) | Already a drei dependency; adding it directly risks two three.js example copies. |

---

## 6. Recommended folder structure

Adapted from satus's `components/` vs `lib/` split — UI in one place, everything
else in the other.

```
portfolio/
├─ app/
│  ├─ layout.tsx                  # ScrollProvider + GlobalCanvas + <html lang>
│  ├─ page.tsx                    # landing
│  ├─ work/
│  │  ├─ page.tsx                 # index
│  │  └─ [slug]/page.tsx          # case study (generateStaticParams)
│  ├─ disciplines/[slug]/page.tsx # if worlds become routes
│  ├─ about/page.tsx
│  ├─ contact/page.tsx
│  ├─ opengraph-image.tsx
│  └─ globals.css
│
├─ components/                    # UI only. One folder per component.
│  ├─ layout/                     # Header, Footer, Nav, PageTransition
│  ├─ ui/                         # Button, Marquee, Cursor, Reveal, MediaFrame
│  ├─ sections/                   # Hero, DisciplineWorld, WorkGrid, ProcessTimeline
│  └─ a11y/                       # SkipLink, MotionToggle, VisuallyHidden
│     └─ Button/
│        ├─ index.tsx
│        └─ button.module.css
│
├─ lib/
│  ├─ webgl/                      # ALL 3D. Deletable without breaking the site.
│  │  ├─ GlobalCanvas.tsx         # fixed <Canvas frameloop="never">
│  │  ├─ scenes/                  # HeroObject, WorldBackdrop, MediaPlane
│  │  ├─ materials/               # typed ShaderMaterial factories
│  │  ├─ shaders/                 # *.vert / *.frag
│  │  ├─ hooks/                   # useTrackedElement, useScrollUniform, useQualityTier
│  │  └─ utils/                   # fovForViewport, disposeObject, texture cache
│  │
│  ├─ scroll/
│  │  ├─ ScrollProvider.tsx       # Lenis + GSAP ticker + R3F advance — the single RAF
│  │  └─ useScrollState.ts        # module-level store, no per-frame React renders
│  │
│  ├─ animation/
│  │  ├─ register.ts              # gsap.registerPlugin, one place
│  │  ├─ easings.ts               # named custom eases
│  │  ├─ presets.ts               # fadeUp, maskReveal, charStagger
│  │  └─ transitions/             # world-to-world choreography
│  │
│  ├─ hooks/                      # useMediaQuery, useReducedMotion, useIsTouch
│  ├─ data/                       # ← the content layer
│  │  ├─ disciplines.ts           # id, name, palette, shader, camera, copy
│  │  ├─ projects.ts              # slug, discipline, media[], role, year, links
│  │  ├─ profile.ts               # bio, socials, CV
│  │  └─ types.ts
│  ├─ styles/                     # tokens.css, typography.css, reset.css
│  └─ utils/                      # clamp, lerp, mapRange, cn
│
├─ public/
│  ├─ fonts/  images/  video/  models/  hdr/
│
└─ docs/                          # this file, plus decisions log
```

**The load-bearing convention:** `lib/data/*.ts` is typed and is the **only** place
content lives. Sections render from it; nothing is hardcoded in JSX. Adding a project
becomes one object literal, and swapping to a CMS later becomes one function change.
This is precisely what REF-06 gets wrong.

---

## 7. Performance strategy

| Risk | Mitigation |
|---|---|
| **WebGL — fill rate / DPR** | Cap `dpr={[1, 2]}`; on low tier force `1`. `<PerformanceMonitor>` + `<AdaptiveDpr pixelated>` to degrade under load. Never render fullscreen postprocessing on mobile. |
| **WebGL — draw calls** | One persistent canvas, never per-section canvases. `<Instances>` for repeated geometry. Merge static geometry. Target <100 draw calls. |
| **WebGL — offscreen work** | Only tick the active discipline world. `useFrame` early-returns when its section's IntersectionObserver reports out-of-view. `frameloop="never"` means we choose when to render at all. |
| **WebGL — memory leaks** | Explicit `dispose()` for geometries/materials/textures/RTs on world unmount. A shared texture cache keyed by URL. Leaked RTs are the classic cause of "it gets slower the longer you browse". |
| **WebGL — context loss** | Handle `webglcontextlost`, and never mount/unmount the canvas on navigation. |
| **Video** | `muted playsinline preload="metadata"`, poster frame always. AV1/WebM with an H.264 fallback. Play only when in view (IntersectionObserver), pause on `visibilitychange`. **No autoplaying video above the fold** — it competes with the hero shader for the first-paint budget. Never ship a video >3 MB without a hard reason. |
| **Generated / large imagery** | `next/image` with AVIF + WebP, explicit `sizes`, blur placeholder. Compress source assets *before* commit. For WebGL textures use power-of-two, mipmapped, and KTX2/Basis for anything over ~1 MB. |
| **Smooth scrolling** | Lenis costs a `transform`-free lerp of native scroll — cheap. The real cost is what's *hooked* to it: avoid layout-triggering properties in scrubbed tweens (animate `transform`/`opacity`, never `top`/`width`/`height`). Batch DOM reads. |
| **Large transitions** | Precompile shaders and preload the incoming world's assets *before* the transition starts (`useGLTF.preload`, `<Preload all />`, drei `useTexture.preload`). A transition that hitches at frame 1 is worse than no transition. |
| **3D environments** | Draco/Meshopt-compress every GLTF. Local `.hdr` at 512–1k, never drei's CDN presets in production. Bake lighting into textures where possible; real-time shadows are the most expensive thing on the list — prefer `<ContactShadows>` or a baked plane. |
| **Bundle size** | `dynamic(() => import(...), { ssr: false })` for the canvas so three.js (~600 KB min) is never in the initial chunk. Audit with `@next/bundle-analyzer` after every drei addition. Route-split per discipline. |
| **Fonts** | `next/font` self-hosted, `display: swap`, subset. Then `ScrollTrigger.refresh()` on `document.fonts.ready`. |

**Budgets to hold to (mid-tier mobile, 4G):** LCP < 2.5 s · INP < 200 ms · CLS < 0.1 ·
initial JS < 300 KB gzipped (excluding the lazy WebGL chunk) · sustained 60 fps desktop,
30 fps floor on mobile.

**Quality tiers.** Decide once at boot from `navigator.hardwareConcurrency`,
`deviceMemory`, DPR and a coarse-pointer check; expose as `useQualityTier()` →
`'high' | 'medium' | 'low' | 'none'`. `'none'` renders the static DOM site with no canvas
at all. Every 3D feature reads this tier rather than checking device conditions ad hoc.

---

## 8. Accessibility strategy

Non-negotiable, and cheap if designed in now rather than retrofitted.

**Reduced motion.** `prefers-reduced-motion: reduce` is honoured at three layers:
1. Lenis disables smoothing automatically (built in) — verify, don't assume.
2. `gsap.matchMedia()` with a `'(prefers-reduced-motion: reduce)'` branch: scrubbed
   parallax and scale become instant state changes; entrance animations become a
   short opacity fade or nothing; **all pinning is removed** (pinning is disorienting
   and it's the most common vestibular-trigger failure).
3. WebGL drops to `'low'`/`'none'` tier — no camera motion, no continuous shader
   animation, no auto-playing video.

Plus a **visible in-page motion toggle** in the header/footer that overrides the OS
setting in both directions and persists to `localStorage` — many people have never set
the OS preference.

**Keyboard navigation.**
- A real "Skip to content" link, first in tab order, visible on focus.
- Visible `:focus-visible` rings everywhere; never `outline: none` without a replacement.
- **Scroll-jacked or pinned sections must be keyboard-traversable.** If a discipline
  world only advances on scroll, add explicit prev/next controls and make Tab into a
  section scroll it into view (`lenis.scrollTo(el, { immediate: prefersReducedMotion })`).
  Focus moving to an off-screen element *must* bring it into view — this is the single
  most common failure in scroll-driven portfolios.
- Logical DOM order = visual order. No `tabindex > 0`.
- Route change: move focus to the new `<h1>` and announce via a live region.

**Touch devices.**
- Hover-only interactions must have a tap equivalent; no information behind hover.
- Tap targets ≥ 44×44 px.
- Don't fight native touch scrolling — Lenis defaults to native on touch for a reason;
  enabling `syncTouch` degrades feel on iOS. Leave it off.
- Custom cursor: desktop + fine pointer only.
- Test `100dvh` vs `100vh` for the mobile URL bar, and re-`ScrollTrigger.refresh()` on
  orientation change.

**Screen readers.**
- The canvas is decorative: `aria-hidden="true"` + `pointer-events: none` + no tab stop.
- Every meaningful visual must exist as real DOM text. If a discipline's name only
  exists as a WebGL texture, it does not exist.
- SplitText must be reverted on unmount, and split containers given `aria-label` with
  the full string so per-character spans aren't read letter-by-letter.
- Semantic landmarks (`header`/`nav`/`main`/`footer`), one `<h1>` per page, ordered headings.
- Meaningful `alt` on project imagery; captions/transcripts for any video carrying information.
- Colour contrast ≥ 4.5:1 for body text **in every discipline palette** — this is where
  strongly art-directed worlds usually fail. Audit each palette at design time.

**Fallback rendering.**
- Feature-detect WebGL; on failure render a static poster image per section. The site
  must be complete and beautiful with the canvas removed — that is the acceptance test.
- No-JS: the DOM content still renders and reads (a real benefit of the Next.js choice).
- Respect Save-Data / `connection.effectiveType` → `'low'` tier.
- `<noscript>` styles that reveal any elements animation would otherwise have hidden —
  **never let `opacity: 0` initial states become permanently invisible content if
  GSAP fails to initialise.** Use `gsap.set()` from JS, or a `.js-enabled` body class,
  rather than hiding in CSS.

---

## 9. Implementation risks

1. **The route-vs-scroll fork for discipline worlds.** Routes give clean code-splitting,
   deep links, per-world SEO and simple memory management, but transitions must survive
   navigation (persistent canvas + View Transitions / manual overlay). One long scroll
   gives the most seamless transitions but risks a huge single page, heavy pinning, and
   poor deep-linking. **Decide before writing any code** — retrofitting is expensive.
   Recommendation: routes, with the persistent canvas making transitions feel continuous.

2. **RAF ownership drift.** The moment any library adds its own `requestAnimationFrame`
   or scroll listener, sync breaks and jitter appears. Enforce as a hard rule: one ticker,
   reviewed on every dependency addition. This is why framer-motion is banned above.

3. **ScrollTrigger measurement staleness.** Late-loading fonts, images and video change
   document height after triggers are created, silently shifting every start/end.
   Mitigate with explicit dimensions on all media, and `ScrollTrigger.refresh()` after
   `document.fonts.ready` and after asset load. Budget real debugging time here.

4. **Pinning + `position: fixed` canvas interactions.** Pinned sections create transformed
   ancestors; anything expecting `fixed` inside a pin will misbehave. Keep the canvas
   outside all pinned subtrees, at the root.

5. **Memory growth across worlds.** Without disciplined disposal, browsing 4–5 worlds
   accumulates GPU memory until Safari on iOS kills the tab. Write the dispose path
   *with* the first world, not after the fifth.

6. **Mobile is the real target.** A large share of portfolio traffic is a phone opened
   from a link in a message. The desktop experience is the showreel; the mobile one is
   what most people actually see. Design the `'low'` tier as a first-class deliverable,
   not a degraded afterthought.

7. **Scope inflation.** Every world multiplies the shader, asset, transition, a11y and
   QA surface. Constrain the count early, and share one transition system across all
   of them rather than authoring bespoke transitions per pair.

8. **iOS Safari specifics.** `100vh` and URL-bar resize, WebGL memory ceilings, video
   autoplay policy, and no WebGL2 guarantees on very old devices. Test on real hardware,
   not just responsive mode.

9. **Content readiness.** The architecture is ready long before the copy, project imagery
   and case-study writing are. The `lib/data/` layer exists specifically so the build can
   proceed against placeholder data without rework — but the site cannot ship until that
   content is real.

10. **Version pinning.** R3F 9.7 peers `react >=19 <19.3`. Next 16.3 ships React 19.2 —
    compatible today, but a future React 19.3 in a Next minor could break the peer range.
    Pin exact versions in `package.json` and upgrade deliberately.
