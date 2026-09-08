/**
 * Per-stage scroll progress, as a plain mutable map.
 *
 * Same reasoning as scroll-state.ts: WebGL scenes read this every frame
 * inside useFrame. Routing it through React state would cause a render per
 * frame per world — the single most expensive mistake available here.
 *
 * ScrollTrigger writes; useFrame reads. Nothing subscribes.
 */

interface StageProgress {
  /** 0 → 1 across the stage's own scroll span. */
  progress: number;
  /** -1 → 1, where 0 means the stage is centred in the viewport. */
  centered: number;
  /** Whether the stage's trigger is currently active. */
  active: boolean;
}

const stages = new Map<string, StageProgress>();

const EMPTY: StageProgress = { progress: 0, centered: -1, active: false };

export function setStageProgress(
  id: string,
  next: Partial<StageProgress>,
): void {
  const current = stages.get(id) ?? { ...EMPTY };
  stages.set(id, { ...current, ...next });
}

export function getStageProgress(id: string): StageProgress {
  return stages.get(id) ?? EMPTY;
}

/** Convenience for the common case inside a shader uniform update. */
export function progressOf(id: string): number {
  return (stages.get(id) ?? EMPTY).progress;
}

export function clearStageProgress(id: string): void {
  stages.delete(id);
}
