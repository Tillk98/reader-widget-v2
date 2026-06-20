import React, { useRef, useEffect, useCallback, useLayoutEffect, useState } from 'react';
import { Brackets } from 'lucide-react';
import type { LingQStatusType } from './LingQStatusBar';
import { LingQStatusButton } from './LingQStatusButton';
import './QuickStatusPopup.css';

type QsAction = 'known' | 'ignored' | 'phrase';

interface QuickStatusPopupProps {
  resolveAnchorElement: () => HTMLElement | null;
  onStatusChange: (status: LingQStatusType) => void;
  /** "Select a Phrase" chosen — start the tap-to-complete phrase selection. */
  onSelectPhrase: () => void;
  onClose: () => void;
}

/** Status options always sit closest to the word; "Select a Phrase" is on the far side. */
const STATUS_OPTIONS: { action: Exclude<QsAction, 'phrase'>; label: string }[] = [
  { action: 'known', label: 'Known' },
  { action: 'ignored', label: 'Ignore' },
];

const MOVE_THRESHOLD_PX = 6;

export const QuickStatusPopup: React.FC<QuickStatusPopupProps> = ({
  resolveAnchorElement,
  onStatusChange,
  onSelectPhrase,
  onClose,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<QsAction | null>(null);
  const movedRef = useRef(false);
  const moveStartRef = useRef<{ x: number; y: number } | null>(null);

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
      // Menu above the word → reverse rows so Known / Ignore sit nearest the word (bottom).
      popupRef.current.style.bottom = `${vh - anchorRect.top + gap}px`;
      popupRef.current.style.top = 'auto';
      popupRef.current.style.flexDirection = 'column-reverse';
    } else {
      // Menu below the word → Known / Ignore nearest the word (top), natural order.
      popupRef.current.style.top = `${anchorRect.bottom + gap}px`;
      popupRef.current.style.bottom = 'auto';
      popupRef.current.style.flexDirection = 'column';
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

  const invoke = useCallback(
    (action: QsAction) => {
      if (action === 'known') onStatusChange('Known');
      else if (action === 'ignored') onStatusChange('Ignored');
      else onSelectPhrase();
    },
    [onStatusChange, onSelectPhrase]
  );

  /*
   * One pointer model for both gestures:
   * - long-press → drag onto an option → release selects it
   * - long-press → release (no drag) → menu stays; a later tap on an option selects
   * Also suppresses text selection while the menu is up, and closes on an outside tap / off-menu drag.
   */
  useEffect(() => {
    const actionAt = (x: number, y: number): QsAction | null => {
      const el = document.elementFromPoint(x, y) as HTMLElement | null;
      const opt = el?.closest('[data-qs-action]') as HTMLElement | null;
      return (opt?.getAttribute('data-qs-action') as QsAction | null) ?? null;
    };
    const onMove = (e: PointerEvent) => {
      if (moveStartRef.current == null) moveStartRef.current = { x: e.clientX, y: e.clientY };
      else if (
        Math.hypot(e.clientX - moveStartRef.current.x, e.clientY - moveStartRef.current.y) > MOVE_THRESHOLD_PX
      ) {
        movedRef.current = true;
      }
      setHovered(actionAt(e.clientX, e.clientY));
    };
    const onUp = (e: PointerEvent) => {
      const action = actionAt(e.clientX, e.clientY);
      if (action) {
        invoke(action);
        return;
      }
      if (movedRef.current) onClose(); // dragged and released off the menu → dismiss
      setHovered(null);
    };
    const onDown = (e: PointerEvent) => {
      movedRef.current = false;
      moveStartRef.current = null;
      if (!popupRef.current?.contains(e.target as Node)) onClose();
    };
    const onSelectStart = (e: Event) => e.preventDefault();

    document.addEventListener('pointermove', onMove, true);
    document.addEventListener('pointerup', onUp, true);
    document.addEventListener('pointerdown', onDown, true);
    document.addEventListener('selectstart', onSelectStart);
    return () => {
      document.removeEventListener('pointermove', onMove, true);
      document.removeEventListener('pointerup', onUp, true);
      document.removeEventListener('pointerdown', onDown, true);
      document.removeEventListener('selectstart', onSelectStart);
    };
  }, [invoke, onClose]);

  return (
    <div ref={popupRef} className="quick-status-popup" onPointerDown={(e) => e.stopPropagation()}>
      {/* Fixed DOM order; calculatePosition flips flex-direction so Known / Ignore stay nearest the word. */}
      {STATUS_OPTIONS.map((o) => (
        <LingQStatusButton
          key={o.action}
          status={o.action === 'known' ? 'Known' : 'Ignored'}
          state={hovered === o.action ? 'focus' : 'default'}
          showLabel
          data-qs-action={o.action}
          aria-label={o.action === 'known' ? 'Mark word as Known' : 'Ignore word'}
        />
      ))}
      <div className="quick-status-popup__divider" aria-hidden />
      {/* "Select a Phrase" — styled like the status pills but a separate action (not a status). */}
      <button
        type="button"
        data-qs-action="phrase"
        className={`quick-status-popup__phrase${hovered === 'phrase' ? ' quick-status-popup__phrase--hover' : ''}`}
        aria-label="Select a phrase"
      >
        <Brackets size={14} strokeWidth={2} aria-hidden />
        <span className="quick-status-popup__phrase-label">Select a Phrase</span>
      </button>
    </div>
  );
};
