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

export function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    mesh.geometry?.dispose();

    const material = mesh.material;
    if (Array.isArray(material)) material.forEach(disposeMaterial);
    else if (material) disposeMaterial(material);
  });

  object.removeFromParent();
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
