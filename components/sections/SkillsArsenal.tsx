"use client";

import { useEffect, useId, useState } from "react";
import { Stage } from "@/components/layout/Stage";
import {
  clearSkillsFocus,
  setSkillsFocus,
} from "@/lib/webgl/environment/skills-focus";
import { RevealText } from "@/components/ui/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { skillGroups } from "@/lib/data/content";
import { disciplines, disciplinesById } from "@/lib/data/disciplines";
import type { DisciplineId, Skill } from "@/lib/data/types";
import { cn } from "@/lib/utils/cn";
import styles from "./skills.module.css";

/**
 * SKILLS ARSENAL — a system index.
 *
 * This replaces a floating constellation. The constellation was legible and
 * accessible, but it was the wrong instrument: a viewport-sized field seating
 * twenty-one labels cost an entire screen of vertical space to communicate a
 * list, and a diagram of connections is a claim about relationships a reader
 * has to decode rather than read. The overlaps it drew with lines are stated
 * here in words, on the row each skill sits on.
 *
 * The form is an index — five numbered rows, one per discipline, skills set
 * inline as a run of text. It reads top to bottom in a fraction of the height
 * and matches how the rest of the site presents structured information.
 *
 * Everything is real DOM text: reachable by Tab, findable with ctrl-F,
 * readable by a screen reader, present with JavaScript disabled. No skill is
 * behind an interaction — expanding a row reveals NOTES about skills that are
 * already on screen, never the skills themselves.
 *
 * Interaction, in order of how much it matters:
 *   - Nothing:  every skill name is visible, always.
 *   - Filter:   a discipline dims rows and skills that do not touch it.
 *   - Expand:   a row opens to show each skill's note and the worlds it spans.
 *   - Hover:    previews a note in the row's own readout. An accelerator only.
 */

/** Skills a discipline touches, wherever in the data they are grouped. */
function skillsTouching(id: DisciplineId): Skill[] {
  return skillGroups
    .flatMap((group) => group.skills)
    .filter((skill) => skill.disciplines.includes(id));
}

interface RowProps {
  index: number;
  panelId: string;
  label: string;
  discipline: DisciplineId;
  skills: Skill[];
  filter: DisciplineId | null;
  open: boolean;
  onToggle: () => void;
}

function SkillRow({
  index,
  panelId,
  label,
  discipline,
  skills,
  filter,
  open,
  onToggle,
}: RowProps) {
  const [preview, setPreview] = useState<Skill | null>(null);

  // A row dims when the filter names a discipline none of its skills touch.
  // Dimmed, never removed — the shape of the whole index is the point, and
  // dropping rows would make a filter feel like a different page.
  const rowDim =
    filter !== null && !skills.some((s) => s.disciplines.includes(filter));

  return (
    <li
      className={styles.row}
      data-dim={rowDim}
      data-open={open}
      style={
        {
          "--c-accent": `var(${disciplinesById[discipline].accentVar})`,
        } as React.CSSProperties
      }
    >
      <button
        type="button"
        className={styles.rowHead}
        aria-expanded={open}
        aria-controls={panelId}
        data-cursor={open ? "CLOSE" : "DETAIL"}
        onClick={onToggle}
      >
        <span className={styles.rowIndex} aria-hidden="true">
          {String(index).padStart(2, "0")}
        </span>
        <span className={styles.rowLabel}>{label}</span>
        <span className={styles.rowCount}>
          <span className="sr-only">{skills.length} tools. </span>
          <span aria-hidden="true">{skills.length}</span>
        </span>
        <span className={styles.rowMark} aria-hidden="true" />
      </button>

      {/* The skills themselves are never gated behind the toggle. */}
      <p className={styles.inline}>
        {skills.map((skill, i) => (
          <span key={skill.name}>
            {i > 0 && (
              <span className={styles.sep} aria-hidden="true">
                {" · "}
              </span>
            )}
            <span
              className={styles.skill}
              data-dim={filter !== null && !skill.disciplines.includes(filter)}
              onMouseEnter={() => setPreview(skill)}
              onMouseLeave={() => setPreview(null)}
            >
              {skill.name}
            </span>
          </span>
        ))}
      </p>

      {/* Hover readout. Reserved height, so previewing never shifts the page.
          aria-hidden because it is a pointer accelerator for notes that
          keyboard and screen-reader users reach through the expanded list. */}
      <p className={styles.preview} aria-hidden="true">
        {preview ? (
          <>
            <span className={styles.previewName}>{preview.name}</span>
            <span className={styles.previewNote}>{preview.note}</span>
          </>
        ) : null}
      </p>

      <div className={styles.notesWrap} id={panelId} hidden={!open}>
        <ul className={styles.notes}>
          {skills.map((skill) => (
            <li
              key={skill.name}
              data-tier={skill.tier ?? "secondary"}
              data-dim={filter !== null && !skill.disciplines.includes(filter)}
            >
              <span className={styles.noteName}>{skill.name}</span>
              <span className={styles.noteText}>{skill.note}</span>
              <span className={styles.noteWorlds}>
                {skill.disciplines
                  .map((d) => disciplinesById[d].shortName)
                  .join(" · ")}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}

export function SkillsArsenal() {
  const [filter, setFilter] = useState<DisciplineId | null>(null);
  const [openRow, setOpenRow] = useState<string | null>(null);
  const uid = useId();

  // Stated rather than drawn: how many tools a discipline actually reaches,
  // counted across every group. This is the claim the constellation was
  // making with cross-links.
  const crossCount = filter ? skillsTouching(filter).length : 0;

  /**
   * Let the environment behind this section lean toward whichever discipline
   * is being read about — Software reads as more structured, XR gains depth,
   * Data brings the signals out.
   *
   * Published to a module singleton rather than through context on purpose:
   * the environment reads it inside useFrame, and a context value would put a
   * provider re-render between the click and the world responding. It is also
   * strictly one-way. Nothing below depends on it, the skills themselves stay
   * ordinary accessible DOM, and with WebGL off the section is unchanged.
   */
  useEffect(() => {
    setSkillsFocus(filter);
    return clearSkillsFocus;
  }, [filter]);

  return (
    <Stage id="skills" ariaLabelledBy="skills-title">
      <div className={styles.head}>
        <Eyebrow label="Capability" />
        <RevealText
          id="skills-title"
          as="h2"
          text="Skills arsenal"
          className={styles.title}
        />
        <p className={styles.lead}>
          Every tool below connects to at least one other discipline. The
          overlaps are the argument.
        </p>
      </div>

      <div
        className={styles.filters}
        role="group"
        aria-label="Filter by discipline"
      >
        <button
          type="button"
          className={cn(styles.filter, filter === null && styles.filterOn)}
          aria-pressed={filter === null}
          onClick={() => setFilter(null)}
        >
          All
        </button>
        {disciplines.map((discipline) => (
          <button
            key={discipline.id}
            type="button"
            className={cn(
              styles.filter,
              filter === discipline.id && styles.filterOn,
            )}
            style={
              {
                "--c-accent": `var(${discipline.accentVar})`,
              } as React.CSSProperties
            }
            aria-pressed={filter === discipline.id}
            onClick={() =>
              setFilter(filter === discipline.id ? null : discipline.id)
            }
          >
            {discipline.shortName}
          </button>
        ))}
      </div>

      <p className={styles.readout} aria-live="polite">
        {filter
          ? `${crossCount} tools touch ${disciplinesById[filter].name}.`
          : " "}
      </p>

      <ol className={styles.index}>
        {skillGroups.map((group, i) => (
          <SkillRow
            key={group.id}
            index={i + 1}
            panelId={`${uid}-${group.id}`}
            label={group.label}
            discipline={group.discipline}
            skills={group.skills}
            filter={filter}
            open={openRow === group.id}
            onToggle={() => setOpenRow(openRow === group.id ? null : group.id)}
          />
        ))}
      </ol>
    </Stage>
  );
}
