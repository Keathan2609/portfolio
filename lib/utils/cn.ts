type ClassValue = string | number | null | undefined | false;

/** Minimal class joiner. CSS Modules only — no Tailwind merge semantics needed. */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}
