import React, { useRef, useEffect, useCallback, useLayoutEffect, useState } from 'react';
import { Check, EyeOff } from 'lucide-react';
import type { LingQStatusType } from './LingQStatusBar';
import { LingQStatusBar } from './LingQStatusBar';
import { WordDetailBottomSheet } from './WordDetailBottomSheet';
import './ReaderPopUp.css';

const STATUS_NUMBERS: Record<LingQStatusType, string> = {
  New: '1', Recognized: '2', Familiar: '3', Learned: '4', Known: '', Ignored: '',
};

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
  // If panel mode is already active (e.g. user tapped a new word while the panel was open),
  // skip the compact popup and go straight to the full sheet so the panel stays persistent.
  const [showBottomSheet, setShowBottomSheet] = useState(() => panelMode === true);
  /** Local override after editing meaning in the expanded sheet */
  const [meaningOverride, setMeaningOverride] = useState<string | undefined>(undefined);
  /** Whether the floating status-picker bar is open */
  const [showStatusBar, setShowStatusBar] = useState(false);
  const floatingBarRef = useRef<HTMLDivElement>(null);

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

    // Position the floating status bar when visible
    if (floatingBarRef.current) {
      const barEl = floatingBarRef.current;
      const barMinWidth = Math.max(popupWidth, 260);
      const barHeight = barEl.getBoundingClientRect().height || 44;

      let barLeft = left + popupWidth / 2 - barMinWidth / 2;
      if (barLeft < 8) barLeft = 8;
      if (barLeft + barMinWidth > viewportWidth - 8) barLeft = viewportWidth - 8 - barMinWidth;

      barEl.style.left = `${barLeft}px`;
      barEl.style.minWidth = `${barMinWidth}px`;

      const popupHeight = popupRect.height || 47;
      const spaceAbove = anchorRect.top - barHeight - gap * 2;

      if (spaceAbove >= 0) {
        // Place above popup
        barEl.style.bottom = `${bottom + popupHeight + gap}px`;
        barEl.style.top = 'auto';
      } else {
        // Fall back: place below the anchor word
        barEl.style.top = `${anchorRect.bottom + gap}px`;
        barEl.style.bottom = 'auto';
      }
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

  useEffect(() => {
    const hitElement = (target: EventTarget | null): Element | null => {
      if (target instanceof Element) return target;
      if (target instanceof Text && target.parentElement) return target.parentElement;
      return null;
    };

    const isOutside = (target: EventTarget | null) => {
      if (!popupRef.current || !(target instanceof Node)) return false;
      if (popupRef.current.contains(target)) return false;
      if (floatingBarRef.current && floatingBarRef.current.contains(target)) return false;
      const bar = document.querySelector('.reader-bottom-bar');
      if (bar && bar.contains(target)) return false;
      const hitEl = hitElement(target);
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

  const handleExpandClick = (e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation();
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
    onClose();
  };

  // Badge display helpers
  const badgeTone =
    wordStatus === 'Ignored' ? 'ignored' : wordStatus === 'Known' ? 'known' : 'learning';

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
    <>
      {showStatusBar && (
        <div
          ref={floatingBarRef}
          className="reader-popup-floating-bar"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <LingQStatusBar
            variant="floating"
            status={wordStatus}
            onStatusChange={handleFloatingStatusChange}
          />
        </div>
      )}
      <div
        ref={popupRef}
        className="reader-popup-widget"
        role="tooltip"
        onClick={handleExpandClick}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="reader-popup-widget-header">
          <button
            type="button"
            className={`reader-popup-widget-status-badge reader-popup-widget-status-badge--${badgeTone}${showStatusBar ? ' reader-popup-widget-status-badge--open' : ''}`}
            aria-label={`Status ${wordStatus}, tap to change`}
            aria-expanded={showStatusBar}
            onClick={handleStatusBadgeClick}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {wordStatus === 'Ignored' ? (
              <EyeOff size={12} aria-hidden />
            ) : wordStatus === 'Known' ? (
              <Check size={12} aria-hidden />
            ) : (
              <span aria-hidden>{STATUS_NUMBERS[wordStatus]}</span>
            )}
          </button>
          <div className="reader-popup-widget-term">
            <span className="reader-popup-widget-meaning">{meaning || 'Meaning'}</span>
            {wordTransliteration != null && wordTransliteration !== '' && (
              <span className="reader-popup-widget-transliteration">{wordTransliteration}</span>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
