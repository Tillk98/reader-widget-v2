import React, { useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { Check, EyeOff } from 'lucide-react';
import type { LingQStatusType } from './LingQStatusBar';
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
    const pw = popupRect.width || 192;
    const ph = popupRect.height || 44;

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

  // Dismiss the popup if the user starts dragging after it appears (phrase-selection).
  useEffect(() => {
    let origin: { x: number; y: number } | null = null;
    const onMove = (e: PointerEvent) => {
      if (e.buttons === 0) return; // only while a button is held
      if (!origin) {
        origin = { x: e.clientX, y: e.clientY };
        return;
      }
      const dx = e.clientX - origin.x;
      const dy = e.clientY - origin.y;
      if (Math.sqrt(dx * dx + dy * dy) > 8) {
        onClose();
      }
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, [onClose]);

  const handle = (status: LingQStatusType) => {
    onStatusChange(status);
  };

  return (
    <div
      ref={popupRef}
      className="quick-status-popup"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="quick-status-popup__btn quick-status-popup__btn--ignore"
        onClick={() => handle('Ignored')}
        aria-label="Ignore word"
      >
        <EyeOff size={16} aria-hidden />
        <span>Ignore</span>
      </button>
      <div className="quick-status-popup__divider" aria-hidden />
      <button
        type="button"
        className="quick-status-popup__btn quick-status-popup__btn--known"
        onClick={() => handle('Known')}
        aria-label="Mark word as Known"
      >
        <Check size={16} aria-hidden />
        <span>Known</span>
      </button>
    </div>
  );
};
