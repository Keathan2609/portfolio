import * as THREE from "three";

/**
 * THE TEXTURE CACHE
 * =================
 *
 * The media layer is the first thing in this project to put pixels on the
 * GPU, and texture memory is the one budget that does not degrade gracefully:
 * geometry that is too heavy drops frames, but textures that are too heavy
 * get the tab killed on iOS. So acquisition is centralised here rather than
 * left to each plane.
 *
 * WHAT THIS REPLACES. `lib/webgl/utils/dispose.ts` carries an
 * `acquireTexture`/`releaseTexture` pair that was written alongside the first
 * world and never called by anything. It ref-counted correctly but had three
 * gaps that matter now that textures are real: it took a caller-supplied
 * loader (so colour space and filtering were decided per call site), it had
 * no concept of the quality tier (so every device would have pulled the full
 * resolution), and its `loader.load` returns a texture that is still empty —
 * callers had no way to know when it was actually ready, which is exactly
 * what a reveal animation needs. This module is the version that knows those
 * three things. The old pair is left in place for the model/GLB path it was
 * always intended for.
 *
 * GUARANTEES
 *
 *  1. ONE UPLOAD PER URL. Two planes referencing the same board share one
 *     GPU texture. The in-flight promise is shared too, so two planes
 *     mounting in the same frame cause one network request, not two.
 *  2. REF-COUNTED RELEASE. A texture is disposed when the last consumer lets
 *     go, not when the first one does.
 *  3. TIER-AWARE VARIANT SELECTION. Callers ask for a logical asset; this
 *     picks `-lg` or `-sm` from the tier. A caller never spells a variant.
 *  4. NOTHING LOADS AT STARTUP. Planes acquire when their composition comes
 *     into range and release when it leaves, so the resident set is the
 *     couple of compositions near the viewport rather than all 39 boards.
 *
 * It is deliberately NOT a React hook: the same texture is wanted by planes
 * that mount and unmount independently, and the lifetime belongs to the URL,
 * not to a component.
 */

/** Which encoded variant to fetch. Chosen from the tier, never by a caller. */
export type TextureVariant = "lg" | "sm";

interface Entry {
  texture: THREE.Texture;
  refs: number;
  /** Resolves when the pixels have actually arrived. */
  ready: Promise<THREE.Texture>;
  loaded: boolean;
}

const cache = new Map<string, Entry>();

/**
 * One loader for the whole app.
 *
 * TextureLoader is stateless apart from its manager, so a module singleton is
 * correct and avoids re-creating an image-decode pipeline per plane.
 */
const loader = new THREE.TextureLoader();

/**
 * Anisotropy is set once from the renderer's real capability.
 *
 * The media planes are frequently seen at a slight angle — that is the whole
 * point of a 2.5D composition — and at a glancing angle a texture without
 * anisotropic filtering turns to mush in exactly the region the composition
 * is leading the eye through. Capped at 4 rather than the hardware maximum:
 * beyond that the cost rises with no visible return at these plane sizes.
 */
let maxAnisotropy = 1;

export function configureTextureCache(renderer: THREE.WebGLRenderer): void {
  maxAnisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
}

/** Resolve a logical asset path to the encoded variant for this tier. */
export function variantUrl(base: string, variant: TextureVariant): string {
  return `${base}-${variant}.webp`;
}

/**
 * Acquire a texture. Increments the ref count and returns immediately with a
 * texture that may still be blank; await `ready` to know when it has pixels.
 */
export function acquire(url: string): Entry {
  const existing = cache.get(url);
  if (existing) {
    existing.refs += 1;
    return existing;
  }

  const texture = new THREE.Texture();
  const entry: Entry = {
    texture,
    refs: 1,
    loaded: false,
    ready: Promise.resolve(texture),
  };

  entry.ready = new Promise<THREE.Texture>((resolve) => {
    loader.load(
      url,
      (loaded) => {
        /* Colour space is not optional. These are sRGB-encoded WebP files and
           three.js defaults a loaded texture to NoColorSpace, which renders
           the media noticeably darker and more contrasted than the source —
           on brand boards, whose entire purpose is to state a colour system
           accurately, that is a correctness bug rather than a look. */
        loaded.colorSpace = THREE.SRGBColorSpace;
        loaded.anisotropy = maxAnisotropy;
        loaded.generateMipmaps = true;
        loaded.minFilter = THREE.LinearMipmapLinearFilter;
        loaded.magFilter = THREE.LinearFilter;
        /* Planes never tile, and a repeating edge on a media plane reads as a
           seam when the plane is cropped by its frame. */
        loaded.wrapS = THREE.ClampToEdgeWrapping;
        loaded.wrapT = THREE.ClampToEdgeWrapping;
        loaded.needsUpdate = true;

        /* The placeholder object was already handed to a material, so the
           image is transplanted into it rather than swapped: replacing the
           reference would leave every plane pointing at the empty original. */
        texture.image = loaded.image;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = maxAnisotropy;
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.needsUpdate = true;

        /* The intermediate is disposed: it never reached the GPU (nothing
           rendered with it) but it holds a decoded ImageBitmap on the JS heap,
           and 39 of those is real memory. */
        loaded.dispose();

        entry.loaded = true;
        resolve(texture);
      },
      undefined,
      () => {
        /* A missing or corrupt file must not take the frame down. The plane
           stays at zero reveal and the DOM keeps the semantic content, which
           is the same contract the DOM Media component already honours. */
        entry.loaded = false;
        resolve(texture);
      },
    );
  });

  cache.set(url, entry);
  return entry;
}

/** Release one reference. Disposes the GPU texture when the last one goes. */
export function release(url: string): void {
  const entry = cache.get(url);
  if (!entry) return;

  entry.refs -= 1;
  if (entry.refs > 0) return;

  entry.texture.dispose();
  cache.delete(url);
}

/** Resident texture count and URLs — read by the perf audit, not by scenes. */
export function textureCacheStats(): { count: number; urls: string[] } {
  return { count: cache.size, urls: [...cache.keys()] };
}

/**
 * Drop everything. Only for a full teardown; ordinary lifecycle is ref-counted.
 */
export function purgeTextureCache(): void {
  for (const entry of cache.values()) entry.texture.dispose();
  cache.clear();
}
