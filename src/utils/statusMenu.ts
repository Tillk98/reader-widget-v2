import type { LingQStatusType } from '../components/LingQStatusBar';

/** Horizontal slop: a pointer this far outside the menu still counts as "over" it. */
const X_SLOP_PX = 24;
/** A row must be within this vertical distance of the pointer to be picked. */
const Y_MAX_PX = 40;

/**
 * Resolve the status row under a drag pointer for a vertical status menu. The menu is a column
 * of content-width pills separated by gaps, so a pixel-exact elementFromPoint hit test misses
 * the gaps and any row narrower than the pointer's x. Instead we snap to the row nearest the
 * pointer's Y, treating the list as vertical bands. Returns null when the pointer is well
 * outside the menu (so releasing there selects nothing).
 *
 * Shared by the long-press drag-select in the meaning popups and mirrors the gesture in
 * sentence-mode term cards (HorizontalTermList, which keeps its own copy).
 */
export function statusRowAtPoint(menuRoot: Element | null, x: number, y: number): LingQStatusType | null {
  if (!menuRoot) return null;
  const pr = menuRoot.getBoundingClientRect();
  if (x < pr.left - X_SLOP_PX || x > pr.right + X_SLOP_PX) return null;
  let best: HTMLElement | null = null;
  let bestDist = Infinity;
  for (const row of menuRoot.querySelectorAll<HTMLElement>('[data-status]')) {
    const r = row.getBoundingClientRect();
    const dist = y < r.top ? r.top - y : y > r.bottom ? y - r.bottom : 0;
    if (dist < bestDist) {
      bestDist = dist;
      best = row;
    }
  }
  if (!best || bestDist > Y_MAX_PX) return null;
  return (best.getAttribute('data-status') as LingQStatusType | null) ?? null;
}
