import React, { useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import type { LingQStatusType } from './LingQStatusBar';
import { LingQStatusButton } from './LingQStatusButton';
import './QuickStatusPopup.css';

interface QuickStatusPopupProps {
  resolveAnchorElement: () => HTMLElement | null;
  onStatusChange: (status: LingQStatusType) => void;
  onClose: () => void;
}

export const QuickStatusPopup: React.FC<QuickStatusPopupProps> = ({
  resolveAnchorElement,
  onStatusChange,
  onClose,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);

  const calculatePosition = useCallback(() => {
    if (!popupRef.current) return;
    const anchorEl = resolveAnchorElement();
    if (!anchorEl) return;

    const anchorRect = anchorEl.getBoundingClientRect();
    const popupRect = popupRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const gap = 8;
    const pw = popupRect.width || 200;
    const ph = popupRect.height || 40;

    let left = anchorRect.left + anchorRect.width / 2 - pw / 2;
    if (left < 8) left = 8;
    if (left + pw > vw - 8) left = vw - 8 - pw;

    popupRef.current.style.left = `${left}px`;

    if (anchorRect.top - ph - gap >= 8) {
      popupRef.current.style.bottom = `${vh - anchorRect.top + gap}px`;
      popupRef.current.style.top = 'auto';
    } else {
      popupRef.current.style.top = `${anchorRect.bottom + gap}px`;
      popupRef.current.style.bottom = 'auto';
    }
  }, [resolveAnchorElement]);

  useLayoutEffect(() => {
    calculatePosition();
  }, [calculatePosition]);

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
    const isOutside = (target: EventTarget | null) => {
      if (!(target instanceof Node)) return false;
      return !popupRef.current?.contains(target);
    };
    const handleDown = (e: MouseEvent) => { if (isOutside(e.target)) onClose(); };
    const handleTouch = (e: TouchEvent) => {
      if (e.changedTouches.length > 0 && isOutside(e.changedTouches[0].target)) onClose();
    };
    document.addEventListener('mousedown', handleDown);
    document.addEventListener('touchstart', handleTouch, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleDown);
      document.removeEventListener('touchstart', handleTouch);
    };
  }, [onClose]);

  return (
    <div
      ref={popupRef}
      className="quick-status-popup"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="quick-status-popup__option"
        onClick={() => onStatusChange('Known')}
        aria-label="Mark word as Known"
      >
        <LingQStatusButton status="Known" state="focus" tabIndex={-1} aria-hidden />
        <span className="quick-status-popup__label">Known</span>
      </button>
      <div className="quick-status-popup__divider" aria-hidden />
      <button
        type="button"
        className="quick-status-popup__option"
        onClick={() => onStatusChange('Ignored')}
        aria-label="Ignore word"
      >
        <LingQStatusButton status="Ignored" state="focus" tabIndex={-1} aria-hidden />
        <span className="quick-status-popup__label">Ignore</span>
      </button>
    </div>
  );
};
