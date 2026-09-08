# Generated asset strategy (Higgsfield)

**Nothing has been generated.** This document decides what to spend
generations on, and in what order, so the budget goes to assets that
materially change the experience.

## The governing constraint

Generations are limited. The portfolio should rest on a *small number of
exceptional* cinematic assets rather than a large number of adequate ones.
An adequate generated image is worse than no image at all here — the WebGL
worlds already carry the atmosphere, and a mediocre plate would dilute them.

## Priority order

**01 — HERO.** One exceptional cinematic environment.

> **Recommendation: generate this last, or not at all.** The hero is
> currently a bespoke 3D object — a displaced icosahedron under a structural
> cage, responding to the pointer, fading as the section leaves. It is
> generative, interactive, and unmistakably built rather than sourced. A
> static plate behind the name would be *less* impressive, not more, and
> would undercut the site's central claim. If a hero plate is generated, it
> should be a subtle depth layer *behind* the object, not a replacement for
> it. Slot: `public/media/hero/`.

**02 — XR.** One exceptional spatial environment. **Highest value of the
five.** The XR world is the one where a real rendered environment says
something the procedural cage cannot: that Keathan builds *environments*,
with materials and lighting, not just geometry. Slot:
`public/media/worlds/xr/`.

**03 — CREATIVE.** One exceptional editorial/visual composition. Second
highest value. The creative world is currently four gradient plates — the
one place where the generative approach is weakest, because art direction is
exactly what a plate can demonstrate and a shader cannot. Slot:
`public/media/worlds/creative/`.

**04 — AI / DATA.** One exceptional abstract data environment. Lower value:
the live forecast-trajectory scene already reads as data, and it *moves*,
which a still cannot. Generate only if the world feels thin in review. Slot:
`public/media/worlds/data/`.

**05 — CYBERSECURITY.** One exceptional security/network environment. Lowest
value of the five, and the highest cliché risk — most generated security
imagery lands on padlocks, hooded figures and green terminals, all of which
are explicitly banned. The existing sweep-over-topology scene avoids that by
construction. Generate only with a tightly art-directed prompt. Slot:
`public/media/worlds/security/`.

**06 — TRANSITIONS.** **Do not generate.** All four transitions are
mechanical — extrusion, fragmentation, flattening, structural break — and
each one *transforms* between two states. A generated still cannot do that;
inserting one would replace a mechanism with a picture of a mechanism. Only
revisit if a transition is judged to fail on real hardware.

## Suggested spend

| Priority | Asset | Generate? |
|---|---|---|
| 1 | XR environment | Yes |
| 2 | Creative composition | Yes |
| 3 | AI / Data environment | Only if the world reads thin |
| 4 | Security environment | Only with tight art direction |
| 5 | Hero depth layer | Only if it sits behind the 3D object |
| — | Transitions | No |

**Two generations get the largest return.** Four is a reasonable ceiling.

## Art-direction constraints for every prompt

Carry these from the design system — they are the difference between an
asset that belongs and one that looks bought:

- Near-black ground (`#0a0a0c`), never pure black
- One accent per world: XR violet `#9d5cff` · Creative `#ff6b3d` ·
  AI/Data cyan `#00c2a8` · Security cold steel `#5c86a8` ·
  Software electric blue `#4f7cff`
- Restrained, atmospheric, generous negative space
- **No** neon, glowing blobs, glassmorphism, gradients-as-decoration,
  cyberpunk styling, Matrix rain, hooded figures, skulls, or terminal text
- No text or lettering inside the image — typography is DOM, always
- The composition must leave the left third quiet: the DOM copy sits there

## After generating

1. Export at the master width in `public/media/README.md`.
2. Drop into the matching folder.
3. Point the data field at it and remove `pending: true`.
4. Nothing else changes.
