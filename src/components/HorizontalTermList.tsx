import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LingQStatusBar, type LingQStatusType } from './LingQStatusBar';
import { LingQStatusButton } from './LingQStatusButton';
import type { VocabTermItem } from './VocabTermList';
import './HorizontalTermList.css';

/** Reserved space at the bottom of the viewport (reader bottom bar + safe area). */
const BOTTOM_RESERVED_PX = 96;
const POPOVER_GAP_PX = 8;
/** Left content inset of the list — the resting x of the first/anchored card. */
const LIST_INSET_PX = 16;
/** Hold duration before the status menu pops for the drag-to-select gesture. */
const LONG_PRESS_MS = 350;
/**
 * Touch slop: movement under this is treated as a stationary tap/hold, not a
 * scroll. Shared by the long-press cancel and the list's drag-scroll so a finger
 * tap (which always jitters a few px) never gets misread as a drag — which would
 * otherwise swallow the click and stop the status menu from opening on mobile.
 */
const PRESS_MOVE_CANCEL_PX = 10;
/** New words can only be sent to Known or Ignored via long-press. */
const NEW_WORD_STATUSES: LingQStatusType[] = ['Ignored', 'Known'];

/* ── Vertical status popover (Figma 4063:74418) — portaled, flips above when no room below ── */

interface StatusPopoverProps {
  anchorRef: React.RefObject<HTMLElement | null>;
  status: LingQStatusType;
  onStatusChange: (status: LingQStatusType) => void;
  onClose: () => void;
  /** Restrict / reorder the rows (e.g. Known + Ignored only for new words). */
  statuses?: LingQStatusType[];
  /** Tap menu closes on an outside tap; the long-press menu manages its own lifecycle. */
  closeOnOutside?: boolean;
}

const StatusPopover: React.FC<StatusPopoverProps> = ({
  anchorRef,
  status,
  onStatusChange,
  onClose,
  statuses,
  closeOnOutside = true,
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
    const bottomLimit = window.innerHeight - BOTTOM_RESERVED_PX;
    const roomBelow = a.bottom + POPOVER_GAP_PX + ph <= bottomLimit;
    const roomAbove = a.top - POPOVER_GAP_PX - ph >= 8;
    const flipUp = !roomBelow && roomAbove;
    let left = Math.min(a.left, window.innerWidth - pw - 8);
    left = Math.max(8, left);
    const top = flipUp ? a.top - POPOVER_GAP_PX - ph : a.bottom + POPOVER_GAP_PX;
    setStyle({ position: 'fixed', left, top, visibility: 'visible' });
  }, [anchorRef]);

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
    if (!closeOnOutside) return;
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
  }, [anchorRef, onClose, closeOnOutside]);

  return createPortal(
    // Portaled to <body>, but React still bubbles events through the component tree to the
    // TermCard that renders this menu — so a row tap would hit the card's onClick and
    // re-mark the word "New". Stop pointer/click here so the chosen status wins.
    <div
      ref={popRef}
      className="h-term-status-popover"
      style={style}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
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

/* ── Term card (Figma TermCard 2195:6556) ──────────────────────────────────── */

interface TermCardProps {
  item: VocabTermItem;
  status: LingQStatusType | undefined;
  isSelected: boolean;
  isOpen: boolean;
  onBadgeToggle: (wordId: string) => void;
  onOpenDetail: (wordId: string) => void;
  onStatusChange: (wordId: string, status: LingQStatusType) => void;
  onClosePopover: () => void;
  /** Suppress the list's horizontal drag-scroll while the long-press menu is active. */
  onPressActiveChange: (active: boolean) => void;
}

const TermCard: React.FC<TermCardProps> = ({
  item,
  status,
  isSelected,
  isOpen,
  onBadgeToggle,
  onOpenDetail,
  onStatusChange,
  onClosePopover,
  onPressActiveChange,
}) => {
  const rootRef = useRef<HTMLElement | null>(null);
  // Stable ref callback. An inline `ref={el => rootRef.current = el}` gets a fresh
  // identity every render, so React detaches it (current → null) then re-attaches
  // on each re-render — and a child's layout effect runs *before* the parent ref is
  // re-attached. That left the popover's recalc reading a null anchor on the render
  // that opens it, so it stayed hidden. (Masked in dev by StrictMode's extra effect
  // pass; broke in production.) A stable callback is only invoked on mount/unmount,
  // so rootRef stays populated across re-renders.
  const setRootRef = useCallback((el: HTMLElement | null) => {
    rootRef.current = el;
  }, []);
  const isTracked = status !== undefined;

  const [pressOpen, setPressOpen] = useState(false);
  const [hovered, setHovered] = useState<LingQStatusType | null>(null);
  const pressTimer = useRef<number | null>(null);
  const startPos = useRef<{ x: number; y: number } | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  /** Set when a long-press fired so the trailing click (tap action) is ignored. */
  const longPressFired = useRef(false);
  /** True once the pointer has moved onto a status row after the press menu opened.
   *  Used to distinguish a deliberate drag-to-select from a finger that never left the card. */
  const draggedToOptionRef = useRef(false);

  useEffect(() => () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  }, []);

  const clearTimer = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  /**
   * Resolve the status under the drag pointer. The press menu is a vertical list of
   * content-width pills separated by 8px gaps, so a pixel-exact elementFromPoint hit
   * test misses the gaps and any row narrower than the pointer's x — which made
   * drag-select skip rows and jitter on the longer (6-row) status list. Instead we
   * snap to the row nearest the pointer's Y, treating the list as vertical bands.
   */
  const statusAtPoint = (x: number, y: number): LingQStatusType | null => {
    // Only one press popover is open at a time (opening one closes the tap menu).
    const pop = document.querySelector('.h-term-status-popover');
    if (!pop) return null;
    const pr = pop.getBoundingClientRect();
    // Must be roughly over the menu horizontally; release well outside selects nothing.
    const X_SLOP = 24;
    if (x < pr.left - X_SLOP || x > pr.right + X_SLOP) return null;
    let best: HTMLElement | null = null;
    let bestDist = Infinity;
    for (const row of pop.querySelectorAll<HTMLElement>('[data-status]')) {
      const r = row.getBoundingClientRect();
      const dist = y < r.top ? r.top - y : y > r.bottom ? y - r.bottom : 0;
      if (dist < bestDist) {
        bestDist = dist;
        best = row;
      }
    }
    // Far above/below every row (e.g. still over the card) → no selection.
    if (!best || bestDist > 40) return null;
    return (best.getAttribute('data-status') as LingQStatusType | null) ?? null;
  };

  const closePressMenu = useCallback(() => {
    setPressOpen(false);
    setHovered(null);
    onPressActiveChange(false);
  }, [onPressActiveChange]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    longPressFired.current = false;
    startPos.current = { x: e.clientX, y: e.clientY };
    pointerIdRef.current = e.pointerId;
    clearTimer();
    pressTimer.current = window.setTimeout(() => {
      pressTimer.current = null;
      longPressFired.current = true;
      draggedToOptionRef.current = false; // reset — track movement only after menu opens
      onClosePopover(); // close any open tap menu
      onPressActiveChange(true);
      setHovered(isTracked ? (status ?? null) : null);
      setPressOpen(true);
      const id = pointerIdRef.current;
      if (id != null) rootRef.current?.setPointerCapture?.(id);
    }, LONG_PRESS_MS);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (pressOpen) {
      const s = statusAtPoint(e.clientX, e.clientY);
      if (s !== null) draggedToOptionRef.current = true;
      setHovered(s);
      return;
    }
    const sp = startPos.current;
    if (sp && pressTimer.current) {
      if (Math.hypot(e.clientX - sp.x, e.clientY - sp.y) > PRESS_MOVE_CANCEL_PX) {
        clearTimer();
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    clearTimer();
    if (pressOpen) {
      const s = statusAtPoint(e.clientX, e.clientY);
      if (draggedToOptionRef.current && s) {
        // Drag-to-select: pointer moved onto a status row then released → apply and close.
        onStatusChange(item.id, s);
        closePressMenu();
      } else {
        // Released without dragging to an option → keep menu open for a leisurely tap.
        setHovered(null);
      }
      rootRef.current?.releasePointerCapture?.(e.pointerId);
    }
    startPos.current = null;
  };

  const handlePointerCancel = (e: React.PointerEvent) => {
    clearTimer();
    if (pressOpen) {
      closePressMenu();
      rootRef.current?.releasePointerCapture?.(e.pointerId);
    }
    startPos.current = null;
  };

  const pressHandlers = {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerCancel,
    // Stop iOS from firing its long-press callout/selection, which would emit a
    // pointercancel and kill the hold before the status menu can open.
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  };

  const pressMenu = pressOpen ? (
    <StatusPopover
      anchorRef={rootRef}
      status={hovered ?? status ?? 'New'}
      statuses={isTracked ? undefined : NEW_WORD_STATUSES}
      closeOnOutside={true}
      onStatusChange={(s) => {
        onStatusChange(item.id, s);
        closePressMenu();
      }}
      onClose={closePressMenu}
    />
  ) : null;

  // New word (untracked): blue card, no badge. Tap → status-1 LingQ; long-press → Known / Ignore.
  if (!isTracked) {
    return (
      <button
        type="button"
        ref={setRootRef}
        className="h-term-card h-term-card--new"
        {...pressHandlers}
        onClick={(e) => {
          e.stopPropagation();
          if (longPressFired.current) {
            longPressFired.current = false;
            return;
          }
          onStatusChange(item.id, 'New');
        }}
        aria-label={`Add ${item.text} as a LingQ`}
      >
        <span className="h-term-card__text">
          <span className="h-term-card__term">{item.text}</span>
          {item.translation && <span className="h-term-card__meaning">{item.translation}</span>}
        </span>
        {pressMenu}
      </button>
    );
  }

  // LingQ (tracked): numbered badge opens the (persistent) tap menu; long-press opens the drag menu.
  return (
    <div
      ref={setRootRef}
      className={['h-term-card', isSelected && 'h-term-card--selected', (isOpen || pressOpen) && 'h-term-card--open']
        .filter(Boolean)
        .join(' ')}
      {...pressHandlers}
    >
      <LingQStatusButton
        status={status}
        state="focus"
        onClick={(e) => {
          e.stopPropagation();
          if (longPressFired.current) {
            longPressFired.current = false;
            return;
          }
          onBadgeToggle(item.id);
        }}
        aria-label={`Change status for ${item.text}`}
        aria-expanded={isOpen}
      />

      <button
        type="button"
        className="h-term-card__meta"
        onClick={(e) => {
          e.stopPropagation();
          if (longPressFired.current) {
            longPressFired.current = false;
            return;
          }
          onOpenDetail(item.id);
        }}
        aria-label={`Open ${item.text}`}
      >
        <span className="h-term-card__text">
          <span className="h-term-card__term">{item.text}</span>
          {item.translation && <span className="h-term-card__meaning">{item.translation}</span>}
        </span>
      </button>

      {isOpen && !pressOpen && (
        <StatusPopover
          anchorRef={rootRef}
          status={status}
          onStatusChange={(s) => onStatusChange(item.id, s)}
          onClose={onClosePopover}
        />
      )}
      {pressMenu}
    </div>
  );
};

export interface HorizontalTermListProps {
  items: VocabTermItem[];
  wordStatusMap: Record<string, LingQStatusType>;
  selectedWordId?: string | null;
  onOpenDetail: (wordId: string) => void;
  onStatusChange: (wordId: string, status: LingQStatusType) => void;
}

/**
 * Drag-scroll slop, matched to the card's long-press slop. Below this a finger
 * gesture stays a tap/hold (so the badge tap and long-press both fire); above it
 * the list scrolls and the trailing click is suppressed. A small value (e.g. 5px)
 * misreads ordinary touch jitter as a drag and eats taps on mobile.
 */
const DRAG_THRESHOLD_PX = PRESS_MOVE_CANCEL_PX;

export const HorizontalTermList: React.FC<HorizontalTermListProps> = ({
  items,
  wordStatusMap,
  selectedWordId,
  onOpenDetail,
  onStatusChange,
}) => {
  const [openId, setOpenId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ x: number; scrollLeft: number } | null>(null);
  const didDrag = useRef(false);
  /** True while a card's long-press menu is active — pauses the list's drag-scroll. */
  const pressActive = useRef(false);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const el = listRef.current;
    if (!el) return;
    dragStart.current = { x: e.clientX, scrollLeft: el.scrollLeft };
    didDrag.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pressActive.current) return;
    const start = dragStart.current;
    const el = listRef.current;
    if (!start || !el) return;
    const dx = e.clientX - start.x;
    if (Math.abs(dx) > DRAG_THRESHOLD_PX) {
      didDrag.current = true;
      el.scrollLeft = start.scrollLeft - dx;
    }
  };

  const handlePointerUp = () => {
    dragStart.current = null;
  };

  // Keep the list scrolled so the "current" word always lands at the same on-screen spot —
  // its left edge at the list's left content inset, matching the first card's resting position.
  useEffect(() => {
    if (!selectedWordId) return;
    const list = listRef.current;
    if (!list) return;
    const card = list.querySelector<HTMLElement>(`[data-word-id="${CSS.escape(selectedWordId)}"]`);
    if (!card) return;
    const listRect = list.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const delta = cardRect.left - listRect.left - LIST_INSET_PX;
    list.scrollTo({ left: Math.max(0, list.scrollLeft + delta), behavior: 'smooth' });
  }, [selectedWordId]);

  // Ignored words drop out of the sentence vocabulary list; Known words stay (shown as Known).
  const visible = items.filter((item) => wordStatusMap[item.id] !== 'Ignored');

  if (visible.length === 0) return null;

  return (
    <div
      ref={listRef}
      className="h-term-list"
      role="list"
      aria-label="Vocabulary terms"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClickCapture={(e) => {
        if (didDrag.current) {
          e.stopPropagation();
          didDrag.current = false;
        }
      }}
    >
      {visible.map((item) => (
        <div key={item.id} role="listitem" data-word-id={item.id}>
          <TermCard
            item={item}
            status={wordStatusMap[item.id]}
            isSelected={selectedWordId === item.id}
            isOpen={openId === item.id}
            onBadgeToggle={(id) => setOpenId((cur) => (cur === id ? null : id))}
            onOpenDetail={onOpenDetail}
            onStatusChange={onStatusChange}
            onClosePopover={() => setOpenId(null)}
            onPressActiveChange={(active) => {
              pressActive.current = active;
            }}
          />
        </div>
      ))}
      {/* Trailing spacer so the last words can still scroll to the left anchor position. */}
      <div className="h-term-list__tail" aria-hidden />
    </div>
  );
};
