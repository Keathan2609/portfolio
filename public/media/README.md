# Media

Every visual on the site is referenced from `lib/data/` by a path under this
folder. Dropping in a file and pointing a data field at it is the whole
process — no component is ever edited to add a visual.

Anything not yet supplied renders a composed placeholder frame (a measured
grid with a quiet label), never a broken image.

## Where each folder is used

| Folder | Referenced from | Slot |
|---|---|---|
| `hero/` | *not yet wired* — the hero is currently a generated 3D object | Reserved for a cinematic hero plate if one is ever preferred over the WebGL object |
| `worlds/software/` | `lib/data/disciplines.ts` → future `media` field | Software Engineering world atmosphere |
| `worlds/xr/` | as above | XR world atmosphere |
| `worlds/data/` | as above | AI / Data world atmosphere |
| `worlds/creative/` | as above | Creative / Design world atmosphere |
| `worlds/security/` | as above | Cybersecurity world atmosphere |
| `projects/` | `lib/data/content.ts` → `projects[].media[]` | Project card visual + case-study hero + gallery |
| `beyond/` | `lib/data/content.ts` → `beyond[].media` | The four "Beyond the code" frames |

> The five `worlds/` folders exist ahead of their data field on purpose. The
> worlds are currently rendered entirely in WebGL and need no bitmap; the
> folders are here so a generated environment plate can be introduced
> without inventing a structure at that moment.

## How to add a visual

Set the asset on the relevant entry in `lib/data/content.ts`:

```ts
media: [
  {
    kind: "image",
    src: "/media/projects/my-project-hero.avif",
    alt: "Describe what the image shows, for screen readers",
    ratio: "16 / 10",       // optional; the slot has a sensible default
  },
]
```

Drop `pending: true` once the real file exists. That single flag is the
difference between the placeholder frame and the real asset.

`media[0]` is the primary visual — it fills the project card and the
case-study hero. **Every further entry becomes the case-study gallery.**

## Asset specifications

**Images** — supply the largest sensible master; Next.js generates AVIF and
WebP derivatives at the widths the layout actually asks for.

| Slot | Master width | Ratio |
|---|---|---|
| Case-study hero | 2560px | 21 / 9 |
| Project card | 1600px | 16 / 10 (expanded) · 4 / 3 (compact) |
| Gallery | 1600px | 4 / 3 |
| Beyond the code | 1200px | 3 / 4 |
| World atmosphere | 2560px | 16 / 9 |

Derivative widths are declared in `next.config.ts` (`deviceSizes` /
`imageSizes`). Quality is fixed at 82 — declared in `qualities`, so any
other value 404s rather than quietly generating a second set of files.

`alt` is required on every image. Use `""` **only** for a visual that adds
nothing a sighted visitor would miss; it is then hidden from assistive tech.

**Video** — reserved for major moments, never used as decoration.

```ts
{
  kind: "video",
  src: "/media/projects/my-project.webm",
  srcLow: "/media/projects/my-project-720.webm",  // optional, LOW tier
  poster: "/media/projects/my-project-poster.avif", // REQUIRED
  alt: "",
}
```

- **A poster frame is mandatory.** It is what a visitor sees before playback
  begins and it is the entire visual on the LOW quality tier, where video is
  switched off completely.
- Encode AV1 or VP9 in WebM. Keep loops under 3 MB.
- Video is muted, `playsInline`, `preload="metadata"`, and only plays while
  in view and while the tab is visible. Never autoplays off-screen.

**3D** — `kind: "model"` is accepted by the data layer today and renders the
placeholder frame until a scene is registered for it. Use GLB, Draco or
Meshopt compressed, under 2 MB.

## Naming

`{slug}-{slot}.{ext}` — e.g. `enterprise-operations-platform-hero.avif`,
`enterprise-operations-platform-gallery-01.avif`. Poster frames take the
video's name plus `-poster`.
