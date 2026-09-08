"use client";

import { useSyncExternalStore } from "react";

/** Never changes, so React never re-subscribes or re-reads on updates. */
const subscribe = () => () => {};

/**
 * False during SSR and during hydration; true on every render after.
 *
 * useSyncExternalStore returns the *server* snapshot throughout hydration,
 * which is precisely the guarantee needed here: client-only content (the
 * WebGL canvas) must be absent from the first client render so it matches
 * the server HTML, then appear on the render immediately after.
 *
 * This is why it is used rather than a `useState(false)` + `useEffect`
 * pair — same behaviour, but without a setState inside an effect and the
 * cascading render that comes with it.
 */
export function useIsHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
