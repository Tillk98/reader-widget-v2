import React, { useRef, useEffect, useCallback, useLayoutEffect, useState } from 'react';
import type { LingQStatusType } from './LingQStatusBar';
import { LingQStatusButton } from './LingQStatusButton';
import { StatusPopover } from './StatusPopover';
import { WordDetailBottomSheet } from './WordDetailBottomSheet';
import { statusRowAtPoint } from '../utils/statusMenu';
import './ReaderPopUp.css';

/** Hold duration before a long-press on the popup opens the status menu. */
const LONG_PRESS_MS = 350;
/** Movement under this keeps a press a hold; above it cancels (matches the term-card slop). */
const PRESS_MOVE_CANCEL_PX = 10;

interface ReaderPopUpProps {
  wordId: string;
  wordText: string;
  wordTranslation?: string;
  wordTransliteration?: string;
  /** Re-query on each layout/scroll so the popup stays aligned (e.g. transcript scroll, transforms). */
  resolveAnchorElement: () => HTMLElement | null;
  wordStatus?: LingQStatusType;
  onWordStatusChange?: (status: LingQStatusType) => void;
  onClose: () => void;
  /** Fired when the user opens the meanings / word-detail bottom sheet (popup bubble is unmounted). */
  onWordDetailSheetOpen?: () => void;
  /** True when the viewport is ≥768px (tablet/desktop surface). */
  isTablet?: boolean;
  /** True when the word detail is shown as a floating side panel instead of a bottom sheet. */
  panelMode?: boolean;
  /** Toggle between panel and bottom-sheet presentation. */
  onTogglePanelMode?: () => void;
}

export const ReaderPopUp: React.FC<ReaderPopUpProps> = ({
  wordId,
  wordText,
  wordTranslation,
  wordTransliteration,
  resolveAnchorElement,
  wordStatus = 'New',
  onWordStatusChange,
  onClose,
  onWordDetailSheetOpen,
  isTablet,
  panelMode,
  onTogglePanelMode,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const pressTimer = useRef<number | null>(null);
  const pressStart = useRef<{ x: number; y: number } | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  /** Set when a long-press fired so the trailing click (expand) is ignored. */
  const longPressFired = useRef(false);
  /** True once the pointer has dragged onto a status row after the press menu opened. */
  const draggedToOptionRef = useRef(false);
  /** Status row currently under the drag pointer (highlights it live). */
  const [hovered, setHovered] = useState<LingQStatusType | null>(null);
  // If panel mode is already active (e.g. user tapped a new word while the panel was open),
  // skip the compact popup and go straight to the full sheet so the panel stays persistent.
  const [showBottomSheet, setShowBottomSheet] = useState(() => panelMode === true);
  /** Local override after editing meaning in the expanded sheet */
  const [meaningOverride, setMeaningOverride] = useState<string | undefined>(undefined);
  /** Whether the vertical status-picker menu is open */
  const [showStatusBar, setShowStatusBar] = useState(false);

  // Notify Reader that the sheet is open when we auto-expand in panel mode.
  useEffect(() => {
    if (panelMode) onWordDetailSheetOpen?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setMeaningOverride(undefined);
    setShowStatusBar(false);
  }, [wordId, wordTranslation]);

  const effectiveTranslation = meaningOverride ?? wordTranslation;
  const meaning = effectiveTranslation ?? '';

  const calculatePosition = useCallback(() => {
    if (!popupRef.current) return;

    const anchorEl = resolveAnchorElement();
    if (!anchorEl) return;

    const anchorRect = anchorEl.getBoundingClientRect();
    const popupRect = popupRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const gap = 6;
    const popupWidth = popupRect.width || 80;

    let left = anchorRect.left + anchorRect.width / 2 - popupWidth / 2;
    if (left < 8) left = 8;
    if (left + popupWidth > viewportWidth - 8) left = viewportWidth - 8 - popupWidth;

    const bottom = viewportHeight - anchorRect.top + gap;

    popupRef.current.style.left = `${left}px`;
    popupRef.current.style.bottom = `${bottom}px`;

  }, [resolveAnchorElement]);

  useLayoutEffect(() => {
    calculatePosition();
  }, [calculatePosition, meaning, wordTransliteration, showBottomSheet]);

  useEffect(() => {
    const handleUpdate = () => calculatePosition();
    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('resize', handleUpdate);
    return () => {
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [calculatePosition]);

  /* Re-run positioning whenever the popup resizes (e.g. meaning text reflow)
     so the right-edge clamp stays accurate. */
  useEffect(() => {
    const el = popupRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => calculatePosition());
    observer.observe(el);
    return () => observer.disconnect();
  }, [calculatePosition]);

  useEffect(() => {
    const hitElement = (target: EventTarget | null): Element | null => {
      if (target instanceof Element) return target;
      if (target instanceof Text && target.parentElement) return target.parentElement;
      return null;
    };

    const isOutside = (target: EventTarget | null) => {
      if (!popupRef.current || !(target instanceof Node)) return false;
      if (popupRef.current.contains(target)) return false;
      const bar = document.querySelector('.reader-bottom-bar');
      if (bar && bar.contains(target)) return false;
      const hitEl = hitElement(target);
      /* Portaled vertical status menu lives outside popupRef: tapping a row must not clear selection */
      if (hitEl?.closest('.status-popover')) return false;
      /* Inline lesson media bar (sibling of bottom bar): interacting must not clear word selection */
      if (hitEl?.closest('[data-video-mode-bar]')) return false;
      if (hitEl?.closest('[data-audio-settings-sheet]')) return false;
      if (hitEl?.closest('[data-audio-mini-player]')) return false;

      /* Another lesson word: don't close on mousedown so word-to-word selection
         doesn't briefly clear and re-trigger toolbar expand animation. */
      if (hitEl?.closest('.reader .blue-word, .reader .yellow-word, .sentence-mode__word')) return false;

      return true;
    };
    const handleMouseOutside = (e: MouseEvent) => {
      if (isOutside(e.target)) onClose();
    };
    const handleTouchOutside = (e: TouchEvent) => {
      if (e.changedTouches.length > 0 && isOutside(e.changedTouches[0].target)) onClose();
    };
    document.addEventListener('mousedown', handleMouseOutside);
    document.addEventListener('touchstart', handleTouchOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleMouseOutside);
      document.removeEventListener('touchstart', handleTouchOutside);
    };
  }, [onClose, resolveAnchorElement]);

  useEffect(() => () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  }, []);

  const clearPressTimer = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const statusMenuEl = () => document.querySelector('.status-popover');

  // Long-press anywhere on the popup opens the status menu — same as tapping the badge.
  // While the finger stays down it can drag through the menu and release on a row to pick it.
  const handlePopupPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    longPressFired.current = false;
    pressStart.current = { x: e.clientX, y: e.clientY };
    pointerIdRef.current = e.pointerId;
    clearPressTimer();
    pressTimer.current = window.setTimeout(() => {
      pressTimer.current = null;
      longPressFired.current = true;
      draggedToOptionRef.current = false; // reset — track movement only after the menu opens
      setHovered(null);
      setShowStatusBar(true);
      const id = pointerIdRef.current;
      if (id != null) popupRef.current?.setPointerCapture?.(id);
    }, LONG_PRESS_MS);
  };

  const handlePopupPointerMove = (e: React.PointerEvent) => {
    if (showStatusBar) {
      const s = statusRowAtPoint(statusMenuEl(), e.clientX, e.clientY);
      if (s !== null) draggedToOptionRef.current = true;
      setHovered(s);
      return;
    }
    const sp = pressStart.current;
    if (sp && pressTimer.current && Math.hypot(e.clientX - sp.x, e.clientY - sp.y) > PRESS_MOVE_CANCEL_PX) {
      clearPressTimer();
    }
  };

  const handlePopupPointerUp = (e: React.PointerEvent) => {
    clearPressTimer();
    if (showStatusBar) {
      const id = pointerIdRef.current;
      if (id != null) popupRef.current?.releasePointerCapture?.(id);
      const s = statusRowAtPoint(statusMenuEl(), e.clientX, e.clientY);
      if (draggedToOptionRef.current && s) {
        // Drag-to-select: released over a status row → apply and close.
        handleStatusChange(s);
      } else {
        // Released without dragging to an option → keep the menu open for a tap.
        setHovered(null);
      }
    }
    pressStart.current = null;
  };

  const handlePopupPointerCancel = (e: React.PointerEvent) => {
    clearPressTimer();
    if (showStatusBar) {
      popupRef.current?.releasePointerCapture?.(e.pointerId);
      setShowStatusBar(false);
      setHovered(null);
    }
    pressStart.current = null;
  };

  const handleExpandClick = (e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation();
    if (longPressFired.current) {
      longPressFired.current = false;
      return;
    }
    onWordDetailSheetOpen?.();
    setShowBottomSheet(true);
  };

  const handleStatusBadgeClick = (e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation();
    setShowStatusBar((prev) => !prev);
  };

  const handleStatusChange = (newStatus: LingQStatusType) => {
    onWordStatusChange?.(newStatus);
    setShowStatusBar(false);
    onClose();
  };

  if (showBottomSheet) {
    // On tablet (no panel mode yet): show as a floating positioned card instead of a bottom sheet.
    const useFloating = isTablet === true && !panelMode;
    return (
      <WordDetailBottomSheet
        wordText={wordText}
        wordTranslation={effectiveTranslation}
        wordStatus={wordStatus}
        onWordStatusChange={onWordStatusChange}
        onWordTranslationChange={setMeaningOverride}
        onClose={onClose}
        isTablet={isTablet}
        panelMode={panelMode}
        floatingMode={useFloating}
        resolveAnchorElement={useFloating ? resolveAnchorElement : undefined}
        onTogglePanelMode={onTogglePanelMode}
      />
    );
  }

  return (
    <div
      ref={popupRef}
      className="reader-popup-widget"
      role="tooltip"
      onPointerDown={handlePopupPointerDown}
      onPointerMove={handlePopupPointerMove}
      onPointerUp={handlePopupPointerUp}
      onPointerCancel={handlePopupPointerCancel}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="reader-popup-widget-header" onClick={handleExpandClick}>
        <LingQStatusButton
          status={wordStatus}
          state="focus"
          onClick={handleStatusBadgeClick}
          onPointerDown={(e) => e.stopPropagation()}
          aria-haspopup="menu"
          aria-label={`Status ${wordStatus}, tap to change`}
          aria-expanded={showStatusBar}
        />
        <div className="reader-popup-widget-term">
          <span className="reader-popup-widget-meaning">{meaning || 'Meaning'}</span>
          {wordTransliteration != null && wordTransliteration !== '' && (
            <span className="reader-popup-widget-transliteration">{wordTransliteration}</span>
          )}
        </div>
      </div>
      {showStatusBar && (
        <StatusPopover
          anchorRef={popupRef}
          placement="block"
          status={hovered ?? wordStatus}
          onStatusChange={handleStatusChange}
          onClose={() => setShowStatusBar(false)}
        />
      )}
    </div>
  );
};
