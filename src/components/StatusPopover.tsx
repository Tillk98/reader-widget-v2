import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LingQStatusBar, type LingQStatusType } from './LingQStatusBar';
import './StatusPopover.css';

/** Gap between the anchor and the menu. */
const GAP_PX = 8;
/** Keep the menu this far from the viewport edges. */
const VIEWPORT_MARGIN_PX = 8;
/** Reserved space at the bottom of the viewport (reader bottom bar + safe area) for `block`. */
const BOTTOM_RESERVED_PX = 96;

export interface StatusPopoverProps {
  /** Element the menu is positioned alongside. Use a stable ref (object or memoised callback). */
  anchorRef: React.RefObject<HTMLElement | null>;
  status: LingQStatusType;
  onStatusChange: (status: LingQStatusType) => void;
  onClose: () => void;
  /** Restrict / reorder the rows. Defaults to all six statuses. */
  statuses?: LingQStatusType[];
  /**
   * `side`  — 8px to the right of the anchor, vertically centered; flips left (default).
   * `block` — below the anchor, left-aligned; flips above when there's no room below
   *           (matches the sentence-mode term-card menu).
   */
  placement?: 'side' | 'block';
}

/**
 * Vertical status menu (Figma LingQStatusBar vertical, 4063:74418), portaled to <body> so it
 * escapes scroll/overflow clipping; closes on an outside tap or Escape. Positioning depends on
 * `placement`: `side` (default) sits 8px to the right of the anchor, vertically centered, flipping
 * left when there's no room; `block` sits below the anchor, left-aligned, flipping above when
 * there's no room below (the above/below behaviour the meaning popups and term cards use).
 *
 * (The horizontal term list has its own long-press variant of this menu that is driven by a
 * drag gesture — see HorizontalTermList.)
 */
export const StatusPopover: React.FC<StatusPopoverProps> = ({
  anchorRef,
  status,
  onStatusChange,
  onClose,
  statuses,
  placement = 'side',
}) => {
  const popRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({
    position: 'fixed',
    left: 0,
    top: 0,
    visibility: 'hidden',
  });

  const recalc = useCallback(() => {
    const pop = popRef.current;
    const anchor = anchorRef.current;
    if (!pop || !anchor) return;
    const a = anchor.getBoundingClientRect();
    const ph = pop.offsetHeight;
    const pw = pop.offsetWidth;

    if (placement === 'block') {
      // Left-aligned to the anchor, clamped within the viewport.
      let left = Math.min(a.left, window.innerWidth - pw - VIEWPORT_MARGIN_PX);
      left = Math.max(VIEWPORT_MARGIN_PX, left);
      // Below the anchor; flip above when there's no room below (matches term cards).
      const roomBelow = a.bottom + GAP_PX + ph <= window.innerHeight - BOTTOM_RESERVED_PX;
      const roomAbove = a.top - GAP_PX - ph >= VIEWPORT_MARGIN_PX;
      const flipUp = !roomBelow && roomAbove;
      const top = flipUp ? a.top - GAP_PX - ph : a.bottom + GAP_PX;
      setStyle({ position: 'fixed', left, top, visibility: 'visible' });
      return;
    }

    // Vertically centered on the anchor, clamped within the viewport.
    let top = a.top + a.height / 2 - ph / 2;
    top = Math.max(VIEWPORT_MARGIN_PX, Math.min(top, window.innerHeight - ph - VIEWPORT_MARGIN_PX));
    // 8px to the right of the anchor; flip to the left if it would overflow.
    let left = a.right + GAP_PX;
    if (left + pw + VIEWPORT_MARGIN_PX > window.innerWidth) {
      left = a.left - GAP_PX - pw;
    }
    left = Math.max(VIEWPORT_MARGIN_PX, left);
    setStyle({ position: 'fixed', left, top, visibility: 'visible' });
  }, [anchorRef, placement]);

  useLayoutEffect(() => {
    recalc();
  }, [recalc]);

  useEffect(() => {
    const onReflow = () => recalc();
    window.addEventListener('scroll', onReflow, true);
    window.addEventListener('resize', onReflow);
    return () => {
      window.removeEventListener('scroll', onReflow, true);
      window.removeEventListener('resize', onReflow);
    };
  }, [recalc]);

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (popRef.current?.contains(t) || anchorRef.current?.contains(t)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('pointerdown', onDown, true);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown, true);
      document.removeEventListener('keydown', onKey);
    };
  }, [anchorRef, onClose]);

  return createPortal(
    <div ref={popRef} className="status-popover" style={style}>
      <LingQStatusBar
        variant="vertical"
        status={status}
        statuses={statuses}
        onStatusChange={(s) => {
          onStatusChange(s);
          onClose();
        }}
      />
    </div>,
    document.body
  );
};
