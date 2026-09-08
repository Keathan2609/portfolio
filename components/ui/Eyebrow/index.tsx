import { cn } from "@/lib/utils/cn";
import styles from "./eyebrow.module.css";

/**
 * The section marker: a hairline rule and a mono label, optionally preceded
 * by a two-digit index.
 *
 * It appeared at the head of five sections with the same markup and nearly —
 * but not exactly — the same CSS copied into each module. Small drifts in
 * gap and rule width had already crept in, which is precisely how a system
 * stops reading as a system. One component now, one set of rules.
 *
 * The rule is decorative and hidden from assistive tech; the label is real
 * text and is read.
 */
export function Eyebrow({
  label,
  index,
  className,
}: {
  label: string;
  /** Two-digit discipline index, shown before the rule. */
  index?: string;
  className?: string;
}) {
  return (
    <p className={cn(styles.eyebrow, className)}>
      {index && <span className={styles.index}>{index}</span>}
      <span className={styles.rule} aria-hidden="true" />
      <span className={styles.label}>{label}</span>
    </p>
  );
}
