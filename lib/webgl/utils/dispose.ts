import * as THREE from "three";

/**
 * Explicit GPU teardown.
 *
 * React unmounting a component removes it from the scene graph but does NOT
 * free the GPU-side buffers behind it. With five worlds on one persistent
 * canvas, skipping this is what produces "the site gets slower the longer
 * you browse" and, on iOS, an eventual tab kill.
 *
 * Write the dispose path alongside the first world, not after the fifth.
 */

function disposeMaterial(material: THREE.Material) {
  for (const value of Object.values(material)) {
    if (value instanceof THREE.Texture) value.dispose();
  }
  material.dispose();
}

/**
 * Frees the GPU buffers behind a subtree. It does NOT touch the scene graph,
 * and that distinction cost a long debugging session.
 *
 * This used to end with `object.removeFromParent()`, which looks like tidy
 * teardown and is in fact a trap. React in development mounts a component,
 * runs its effects, tears those effects down, and runs them again — so the
 * cleanup fires once on a component that is still very much mounted. R3F
 * attaches an object to its parent during RENDER, not in an effect, so the
 * remount never puts it back. The result is a subtree that is detached from
 * the scene while every other signal says it is healthy: refs populated,
 * matrices finite, materials live, `visible` true, no warning and no error.
 *
 * That is precisely how the hero object spent a long time rendering nothing.
 * Read from inside the frame loop, its parent chain was ["Group"] — no scene
 * above it — while an identical probe mesh placed one level up drew fine.
 *
 * Detaching was never this function's job either: React removes the object
 * when it genuinely unmounts. Freeing the buffers is the part React does not
 * do, and that is all this does now.
 */
export function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    mesh.geometry?.dispose();

    const material = mesh.material;
    if (Array.isArray(material)) material.forEach(disposeMaterial);
    else if (material) disposeMaterial(material);
  });
}

/**
 * Texture cache keyed by URL.
 *
 * Two worlds referencing the same asset should upload it to the GPU once.
 * Entries are ref-counted so releasing one consumer does not pull the
 * texture out from under another.
 */
const textureCache = new Map<
  string,
  { texture: THREE.Texture; refs: number }
>();

export function acquireTexture(
  url: string,
  loader: THREE.TextureLoader,
): THREE.Texture {
  const existing = textureCache.get(url);
  if (existing) {
    existing.refs += 1;
    return existing.texture;
  }

  const texture = loader.load(url);
  textureCache.set(url, { texture, refs: 1 });
  return texture;
}

export function releaseTexture(url: string) {
  const entry = textureCache.get(url);
  if (!entry) return;

  entry.refs -= 1;
  if (entry.refs <= 0) {
    entry.texture.dispose();
    textureCache.delete(url);
  }
}
