import { disciplines } from "@/lib/data/disciplines";
import type { DisciplineId } from "@/lib/data/types";

/**
 * Which discipline the Skills Arsenal is currently filtered to.
 *
 * Same reasoning as scroll-state and pointer-state: the environment reads this
 * every frame inside useFrame, and routing it through React context would put
 * a provider re-render between a filter click and the world responding to it.
 * Nothing subscribes; the section writes, the environment reads.
 *
 * DELIBERATELY NARROW. The brief is explicit that the skills list stays
 * ordinary accessible DOM — no constellation, no floating labels, no skills
 * as WebGL objects. This carries one integer so the environment can lean
 * toward the discipline being read about, and carries nothing else. Remove it
 * and the Skills section is unchanged in every respect that matters.
 */

const order = disciplines.map((d) => d.id);

/** -1 when no filter is active, i.e. "ALL". */
let focus = -1;

export function setSkillsFocus(id: DisciplineId | null): void {
  focus = id === null ? -1 : order.indexOf(id);
}

export function readSkillsFocus(): number {
  return focus;
}

/** Called when the section unmounts, so a stale filter cannot outlive it. */
export function clearSkillsFocus(): void {
  focus = -1;
}
