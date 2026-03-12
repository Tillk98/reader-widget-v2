import React, { useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import './ReaderPopUp.css';

interface ReaderPopUpProps {
  wordId: string;
  wordText: string;
  wordTranslation?: string;
  anchorRect: DOMRect;
  onClose: () => void;
}

export const ReaderPopUp: React.FC<ReaderPopUpProps> = ({
  wordId,
  wordTranslation,
  anchorRect,
  onClose,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);

  const meaning = wordTranslation ?? '';

  const calculatePosition = useCallback(() => {
    if (!popupRef.current) return;

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
  }, [anchorRect]);

  useLayoutEffect(() => {
    calculatePosition();
  }, [calculatePosition, meaning]);

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
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        const wordEl = document.getElementById(wordId);
        if (wordEl && wordEl.contains(e.target as Node)) return;
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, wordId]);

  return (
    <div ref={popupRef} className="reader-popup-widget" role="tooltip">
      <span className="reader-popup-widget-meaning">{meaning || 'Meaning'}</span>
      <span className="reader-popup-widget-chevron" aria-hidden>
        <ChevronRight size={20} />
      </span>
    </div>
  );
};
