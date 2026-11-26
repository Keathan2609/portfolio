/**
 * WHERE TO PUT THE VISITOR WHEN THEY COME BACK.
 *
 * WHY THE BROWSER CANNOT DO THIS FOR US
 *
 * Next restores scroll on a back navigation by calling `window.scrollTo`.
 * Lenis does not read window.scrollY — it holds its own animated target and
 * drives the real scroll position toward it every frame from the GSAP
 * ticker. So a restore writes a position that Lenis immediately animates
 * away from, and the visitor watches the page slide from where they wanted
 * to be to wherever Lenis thought it was. Browser restoration is not
 * unreliable here; it is actively wrong.
 *
 * So the anchor is recorded explicitly on the way out and consumed on the
 * way in, and the return is performed through Lenis itself.
 *
 * WHAT IS RECORDED, AND WHY IT IS THE SECTION RATHER THAN THE CARD
 *
 * The discipline section, not the project card. In the horizontal worlds a
 * card lives inside a `pin: true` + `pinSpacing: true` track, where the
 * card's document position is the pin spacer rather than anywhere the card
 * visibly is. Scrolling "to the card" there lands confidently in the wrong
 * place. The section is the largest unit that is always correct, and
 * correct beats precise.
 *
 * sessionStorage rather than history state: it survives a full reload and a
 * restored tab, costs nothing, and is scoped to the tab so two windows
 * cannot overwrite each other's anchor. Every access is wrapped — a private
 * window or blocked site data makes these throw, and failing to remember
 * where someone was should never break navigating.
 */

const KEY = "knp:return-anchor";

export interface ReturnAnchor {
  /** The project that was opened. Kept for the highlight, not the scroll. */
  slug: string;
  /** Slug of the discipline SECTION to land on — the scroll target. */
  section: string;
}

export function rememberReturn(anchor: ReturnAnchor): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(anchor));
  } catch {
    /* No session storage. The visitor lands at the top instead, which is
       a worse return but not a broken one. */
  }
}

/**
 * Read and clear in one step.
 *
 * Clearing matters: without it, every later arrival at the homepage — a
 * logo click, a fresh load in a restored tab — would jump to a discipline
 * the visitor last looked at some time ago, which reads as the page
 * refusing to start at the beginning.
 */
export function takeReturn(): ReturnAnchor | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    sessionStorage.removeItem(KEY);
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof (parsed as ReturnAnchor).section === "string" &&
      typeof (parsed as ReturnAnchor).slug === "string"
    ) {
      return parsed as ReturnAnchor;
    }
    return null;
  } catch {
    return null;
  }
}
