import React, { useCallback, useEffect, useRef, useState } from 'react';
import './BottomSheet.css';

/** Past this downward drag (px) the sheet dismisses on release. */
const DRAG_DISMISS_PX = 64;
/** Past this upward drag (px) the sheet calls onSwipeUp (e.g. expand to full page). */
const SWIPE_UP_PX = 48;
/** Cap on how far the card follows an upward drag. */
const SWIPE_UP_MAX_PX = 140;
/** Movement (px) before a pointer-down is treated as a drag rather than a tap. */
const DRAG_START_PX = 6;
/** Keep mounted through the exit transition before unmounting. */
const EXIT_MS = 300;

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Accessible label for the dialog. */
  ariaLabel?: string;
  /** Show the grab handle at the top of the card (default true). */
  showDragBar?: boolean;
  /** `floating` (side margins, rounded) or `full` (full width, near-full height, rounded top). */
  variant?: 'floating' | 'full';
  /** Dragging up past a threshold fires this (e.g. expand into a full-page sheet). */
  onSwipeUp?: () => void;
  /**
   * Allow dragging the whole card (not just the handle) to expand/minimize.
   * Taps still pass through to buttons — a drag only starts after a few px of movement.
   * Use only when the card content does not scroll.
   */
  dragWholeCard?: boolean;
  /** Extra class on the card element. */
  cardClassName?: string;
}

/**
 * Reusable floating bottom sheet: scrim + rounded card sliding up from the bottom.
 * Dismisses on backdrop click, Escape, or dragging the handle down. Reused across reader menus.
 */
export const BottomSheet: React.FC<BottomSheetProps> = ({
  open,
  onClose,
  children,
  ariaLabel,
  showDragBar = true,
  variant = 'floating',
  onSwipeUp,
  dragWholeCard = false,
  cardClassName,
}) => {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStartY = useRef<number | null>(null);
  const dragStarted = useRef(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    setVisible(false);
    setDragY(0);
    const t = window.setTimeout(() => setMounted(false), EXIT_MS);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!mounted || !open) return;
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, [mounted, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const handleDragPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    dragStartY.current = e.clientY;
    dragStarted.current = false;
  }, []);

  const handleDragPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (dragStartY.current === null) return;
      const dy = e.clientY - dragStartY.current;
      // Wait for a few px of intent so taps on buttons still register as clicks.
      if (!dragStarted.current) {
        if (Math.abs(dy) < DRAG_START_PX) return;
        dragStarted.current = true;
        setDragging(true);
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      }
      if (dy > 0) {
        setDragY(dy);
      } else if (onSwipeUp) {
        setDragY(Math.max(dy, -SWIPE_UP_MAX_PX));
      } else {
        setDragY(0);
      }
    },
    [onSwipeUp]
  );

  const endDrag = useCallback(
    (e: React.PointerEvent) => {
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
      const started = dragStarted.current;
      const dy = dragStartY.current !== null ? e.clientY - dragStartY.current : 0;
      dragStartY.current = null;
      dragStarted.current = false;
      if (!started) return; // was a tap — let the click through
      setDragging(false);
      if (dy >= DRAG_DISMISS_PX) {
        onClose();
      } else if (onSwipeUp && dy <= -SWIPE_UP_PX) {
        setDragY(0);
        onSwipeUp();
      } else {
        setDragY(0);
      }
    },
    [onClose, onSwipeUp]
  );

  if (!mounted) return null;

  return (
    <div
      className={[
        'bottom-sheet',
        variant === 'full' && 'bottom-sheet--full',
        visible && 'bottom-sheet--visible',
      ]
        .filter(Boolean)
        .join(' ')}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      <button
        type="button"
        className="bottom-sheet__backdrop"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="bottom-sheet__panel">
        <div
          className={[
            'bottom-sheet__card',
            dragging && 'bottom-sheet__card--dragging',
            dragWholeCard && 'bottom-sheet__card--draggable',
            cardClassName,
          ]
            .filter(Boolean)
            .join(' ')}
          style={dragY !== 0 ? { transform: `translateY(${dragY}px)` } : undefined}
          onPointerDown={dragWholeCard ? handleDragPointerDown : undefined}
          onPointerMove={dragWholeCard ? handleDragPointerMove : undefined}
          onPointerUp={dragWholeCard ? endDrag : undefined}
          onPointerCancel={dragWholeCard ? endDrag : undefined}
        >
          {showDragBar && (
            <div
              className="bottom-sheet__drag-area"
              role="button"
              aria-label="Drag to expand or close"
              tabIndex={-1}
              onPointerDown={dragWholeCard ? undefined : handleDragPointerDown}
              onPointerMove={dragWholeCard ? undefined : handleDragPointerMove}
              onPointerUp={dragWholeCard ? undefined : endDrag}
              onPointerCancel={dragWholeCard ? undefined : endDrag}
            >
              <span className="bottom-sheet__drag-bar" />
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
};
