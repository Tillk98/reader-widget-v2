import React, { useRef, useEffect, useCallback, useLayoutEffect, useState } from 'react';
import type { LingQStatusType } from './LingQStatusBar';
import { LingQStatusBar } from './LingQStatusBar';
import { LingQStatusButton } from './LingQStatusButton';
import { WordDetailBottomSheet } from './WordDetailBottomSheet';
import './ReaderPopUp.css';

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
  /** Footer Lynx button (in the expanded detail sheet) — opens the Lynx chat. */
  onLynx?: () => void;
  /** True when the viewport is ≥768px — surfaces the side-panel toggle in the expanded sheet. */
  isTablet?: boolean;
  /** Dock the expanded sheet as a side panel (tablet only). */
  onTogglePanelMode?: () => void;
  /** Mount straight into the expanded sheet (page state) instead of the compact bubble —
   *  e.g. when returning from the docked side panel. */
  initialExpanded?: boolean;
  /** True when the word-detail side panel is already docked open (tablet). The popup then
   *  shows alongside the panel as a status-only control: tapping the meaning does nothing
   *  (the panel already shows the detail), and only the status picker remains interactive. */
  panelOpen?: boolean;
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
  onLynx,
  isTablet,
  onTogglePanelMode,
  initialExpanded,
  panelOpen = false,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);
  // When the side panel is already open the popup never expands into the detail sheet — the
  // panel owns that view; the popup stays a compact status-only control.
  const [showBottomSheet, setShowBottomSheet] = useState(() => initialExpanded === true && !panelOpen);
  /** Local override after editing meaning in the expanded sheet */
  const [meaningOverride, setMeaningOverride] = useState<string | undefined>(undefined);
  /** Whether the floating status-picker bar is open */
  const [showStatusBar, setShowStatusBar] = useState(false);

  useEffect(() => {
    setMeaningOverride(undefined);
    setShowStatusBar(false);
  }, [wordId, wordTranslation]);

  // Docking the panel (e.g. from the expanded sheet's toggle) hands the detail view to the
  // panel — collapse the popup back to its compact status-only form so its own sheet doesn't
  // stay mounted over the newly docked panel.
  useEffect(() => {
    if (panelOpen) setShowBottomSheet(false);
  }, [panelOpen]);

  // Undocking the panel (toggle off while the host keeps the sheet open) hands the detail view
  // back to the popup — re-expand into the bottom sheet. (The popup stays mounted across the
  // dock/undock toggle, so initialExpanded alone can't reopen it.)
  useEffect(() => {
    if (!panelOpen && initialExpanded) setShowBottomSheet(true);
  }, [panelOpen, initialExpanded]);

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

    popupRef.current.style.left = `${left}px`;

    /* Prefer placing the bubble above the word; flip below when there isn't enough
       headroom (e.g. the first line of a sentence sits right under the reader header). */
    const popupHeight = popupRect.height || 56;
    const safeTop = 80; // reader header height
    if (anchorRect.top - gap - popupHeight >= safeTop) {
      popupRef.current.style.top = '';
      popupRef.current.style.bottom = `${viewportHeight - anchorRect.top + gap}px`;
    } else {
      popupRef.current.style.bottom = '';
      popupRef.current.style.top = `${anchorRect.bottom + gap}px`;
    }

  }, [resolveAnchorElement]);

  useLayoutEffect(() => {
    calculatePosition();
  }, [calculatePosition, meaning, wordTransliteration, showBottomSheet, showStatusBar]);

  useEffect(() => {
    const handleUpdate = () => calculatePosition();
    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('resize', handleUpdate);
    return () => {
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [calculatePosition]);

  /* Re-run positioning whenever the popup resizes (e.g. status-bar morph
     expanding the card width) so the right-edge clamp stays accurate. */
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
      /* Inline lesson media bar (sibling of bottom bar): interacting must not clear word selection */
      if (hitEl?.closest('[data-media-mode-bar]')) return false;
      if (hitEl?.closest('[data-media-settings-sheet]')) return false;
      if (hitEl?.closest('[data-media-mini-player]')) return false;

      /* Docked side panel (shown alongside the popup in panel mode): interacting with it
         must not dismiss the popup. */
      if (hitEl?.closest('.reader-panel-slot')) return false;

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

  const handleExpandClick = (e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation();
    // Side panel already shows the detail — tapping the meaning is a no-op in that mode.
    if (panelOpen) return;
    onWordDetailSheetOpen?.();
    setShowBottomSheet(true);
  };

  const handleStatusBadgeClick = (e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation();
    setShowStatusBar((prev) => !prev);
  };

  const handleFloatingStatusChange = (newStatus: LingQStatusType) => {
    onWordStatusChange?.(newStatus);
    setShowStatusBar(false);
    // In panel mode the word stays selected (the panel keeps showing it), so leave the popup
    // open and just collapse the picker; otherwise dismiss as usual.
    if (!panelOpen) onClose();
  };

  if (showBottomSheet) {
    return (
      <WordDetailBottomSheet
        wordText={wordText}
        wordTranslation={effectiveTranslation}
        wordStatus={wordStatus}
        onWordStatusChange={onWordStatusChange}
        onWordTranslationChange={setMeaningOverride}
        onClose={onClose}
        onLynx={onLynx}
        isTablet={isTablet}
        onTogglePanelMode={onTogglePanelMode}
      />
    );
  }

  return (
    <div
      ref={popupRef}
      className={`reader-popup-widget${showStatusBar ? ' reader-popup-widget--status-mode' : ''}${panelOpen ? ' reader-popup-widget--panel' : ''}`}
      role="tooltip"
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Always in DOM so CSS can cross-fade between the two states */}
      <div className="reader-popup-widget-header" onClick={handleExpandClick}>
        <LingQStatusButton
          status={wordStatus}
          state="focus"
          onClick={handleStatusBadgeClick}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label={`Status ${wordStatus}, tap to change`}
          aria-expanded={showStatusBar}
        />
        {/* Meaning popup shows the meaning only — the original term is intentionally hidden here
            (it still appears in the phrase popup, term cards, and word-detail header). */}
        <div className="reader-popup-widget-term">
          <span className="reader-popup-widget-meaning">{meaning || 'Meaning'}</span>
        </div>
      </div>
      <div className="reader-popup-widget-statusbar" aria-hidden={!showStatusBar}>
        <LingQStatusBar
          variant="floating"
          status={wordStatus}
          onStatusChange={handleFloatingStatusChange}
        />
      </div>
    </div>
  );
};
