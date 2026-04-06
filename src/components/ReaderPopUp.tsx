import React, { useRef, useEffect, useCallback, useLayoutEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { LingQStatusType } from './LingQStatusBar';
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
}) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  /** Local override after editing meaning in the expanded sheet */
  const [meaningOverride, setMeaningOverride] = useState<string | undefined>(undefined);

  useEffect(() => {
    setMeaningOverride(undefined);
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
    const gap = 6;
    const popupWidth = popupRect.width || 80;

    let left = anchorRect.left + anchorRect.width / 2 - popupWidth / 2;
    if (left < 8) left = 8;
    if (left + popupWidth > viewportWidth - 8) left = viewportWidth - 8 - popupWidth;

    const bottom = window.innerHeight - anchorRect.top + gap;

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
      if (hitEl?.closest('[data-video-mode-bar]')) return false;
      if (hitEl?.closest('[data-audio-settings-sheet]')) return false;
      if (hitEl?.closest('[data-audio-mini-player]')) return false;

      /* Another lesson word: don't close on mousedown so word-to-word selection
         doesn't briefly clear and re-trigger toolbar expand animation. */
      if (hitEl?.closest('.reader .blue-word, .reader .yellow-word')) return false;

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

  if (showBottomSheet) {
    return (
      <WordDetailBottomSheet
        wordText={wordText}
        wordTranslation={effectiveTranslation}
        wordStatus={wordStatus}
        onWordStatusChange={onWordStatusChange}
        onWordTranslationChange={setMeaningOverride}
        onClose={onClose}
      />
    );
  }

  return (
    <div
      ref={popupRef}
      className="reader-popup-widget"
      role="tooltip"
      onClick={handleExpandClick}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="reader-popup-widget-header">
        <div className="reader-popup-widget-term">
          <span className="reader-popup-widget-meaning">{meaning || 'Meaning'}</span>
          {wordTransliteration != null && wordTransliteration !== '' && (
            <span className="reader-popup-widget-transliteration">{wordTransliteration}</span>
          )}
        </div>
        <div className="reader-popup-widget-chevron-btn" aria-hidden>
          <ChevronRight size={16} />
        </div>
      </div>
    </div>
  );
};
