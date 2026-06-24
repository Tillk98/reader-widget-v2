import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LingQStatusBar, type LingQStatusType } from './LingQStatusBar';
import './StatusPopover.css';

/** Gap between the anchor and the menu. */
const GAP_PX = 8;
/** Keep the menu this far from the viewport edges. */
const VIEWPORT_MARGIN_PX = 8;

export interface StatusPopoverProps {
  /** Element the menu is positioned alongside. Use a stable ref (object or memoised callback). */
  anchorRef: React.RefObject<HTMLElement | null>;
  status: LingQStatusType;
  onStatusChange: (status: LingQStatusType) => void;
  onClose: () => void;
  /** Restrict / reorder the rows. Defaults to all six statuses. */
  statuses?: LingQStatusType[];
  /**
   * Horizontal placement. `'beside'` (default) sits the menu 8px to the right of the
   * anchor (flipping left if it would overflow). `'over'` centers it horizontally on the
   * anchor so the menu overlays the tapped status badge (used by the review vocab list).
   */
  align?: 'beside' | 'over';
}

/**
 * Vertical status menu (Figma LingQStatusBar vertical, 4063:74418) anchored 8px to the
 * right of its anchor and vertically centered on it; flips to the left when there is no
 * room on the right. Portaled to <body> so it escapes scroll/overflow clipping, and
 * closes on an outside tap or Escape.
 *
 * (The horizontal term list has its own long-press variant of this menu that positions
 * below/above the card and is driven by a drag gesture — see HorizontalTermList.)
 */
export const StatusPopover: React.FC<StatusPopoverProps> = ({
  anchorRef,
  status,
  onStatusChange,
  onClose,
  statuses,
  align = 'beside',
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
    // Vertically centered on the anchor, clamped within the viewport.
    let top = a.top + a.height / 2 - ph / 2;
    top = Math.max(VIEWPORT_MARGIN_PX, Math.min(top, window.innerHeight - ph - VIEWPORT_MARGIN_PX));
    let left: number;
    if (align === 'over') {
      // Centered horizontally on the anchor so the menu overlays the tapped status badge.
      left = a.left + a.width / 2 - pw / 2;
    } else {
      // 8px to the right of the anchor; flip to the left if it would overflow.
      left = a.right + GAP_PX;
      if (left + pw + VIEWPORT_MARGIN_PX > window.innerWidth) {
        left = a.left - GAP_PX - pw;
      }
    }
    left = Math.max(VIEWPORT_MARGIN_PX, Math.min(left, window.innerWidth - pw - VIEWPORT_MARGIN_PX));
    setStyle({ position: 'fixed', left, top, visibility: 'visible' });
  }, [anchorRef, align]);

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
