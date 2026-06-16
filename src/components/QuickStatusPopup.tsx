import React, { useRef, useEffect, useCallback, useLayoutEffect, useState } from 'react';
import { Check, EyeOff, Brackets } from 'lucide-react';
import type { LingQStatusType } from './LingQStatusBar';
import './QuickStatusPopup.css';

/** A row is either a status to apply, or the "Select a Phrase" action. */
type QsAction = LingQStatusType | 'phrase';

interface QuickStatusPopupProps {
  resolveAnchorElement: () => HTMLElement | null;
  onStatusChange: (status: LingQStatusType) => void;
  /** "Select a Phrase" chosen — start the tap-to-complete phrase selection. */
  onSelectPhrase: () => void;
  onClose: () => void;
  /**
   * `quick` (default) — new/blue words: just Known / Ignore (the fast-track).
   * `full`            — LingQs (tracked words): the complete status menu, which is more
   *                     useful than Known / Ignore for a word already being learned.
   */
  variant?: 'quick' | 'full';
  /** Current status of the word — highlighted as active in the `full` variant. */
  currentStatus?: LingQStatusType;
}

/** New/blue words can only fast-track to Known or Ignored. */
const QUICK_STATUSES: LingQStatusType[] = ['Known', 'Ignored'];
/** LingQs get the full status range, in learning order. */
const FULL_STATUSES: LingQStatusType[] = ['New', 'Recognized', 'Familiar', 'Learned', 'Known', 'Ignored'];

const STATUS_NUMBERS: Partial<Record<LingQStatusType, string>> = {
  New: '1', Recognized: '2', Familiar: '3', Learned: '4',
};
const STATUS_LABELS: Record<LingQStatusType, string> = {
  New: 'New', Recognized: 'Recognized', Familiar: 'Familiar', Learned: 'Learned', Known: 'Known', Ignored: 'Ignore',
};
const statusTone = (s: LingQStatusType) => (s === 'Ignored' ? 'ignored' : s === 'Known' ? 'known' : 'learning');

const MOVE_THRESHOLD_PX = 6;

export const QuickStatusPopup: React.FC<QuickStatusPopupProps> = ({
  resolveAnchorElement,
  onStatusChange,
  onSelectPhrase,
  onClose,
  variant = 'quick',
  currentStatus,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<QsAction | null>(null);
  const movedRef = useRef(false);
  const moveStartRef = useRef<{ x: number; y: number } | null>(null);

  const isFull = variant === 'full';
  const statuses = isFull ? FULL_STATUSES : QUICK_STATUSES;

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
      // Menu above the word. The quick (2-row) menu reverses so Known / Ignore sit nearest the
      // word; the full menu keeps reading order (New → Ignore → Select a Phrase at the very end).
      popupRef.current.style.bottom = `${vh - anchorRect.top + gap}px`;
      popupRef.current.style.top = 'auto';
      popupRef.current.style.flexDirection = isFull ? 'column' : 'column-reverse';
    } else {
      // Menu below the word → natural order.
      popupRef.current.style.top = `${anchorRect.bottom + gap}px`;
      popupRef.current.style.bottom = 'auto';
      popupRef.current.style.flexDirection = 'column';
    }
  }, [resolveAnchorElement, isFull]);

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
      if (action === 'phrase') onSelectPhrase();
      else onStatusChange(action);
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

  const renderStatusOption = (status: LingQStatusType) => {
    const number = STATUS_NUMBERS[status];
    const active = isFull && currentStatus === status;
    return (
      <button
        key={status}
        type="button"
        data-qs-action={status}
        className={[
          'quick-status-popup__option',
          `quick-status-popup__option--${statusTone(status)}`,
          active && 'quick-status-popup__option--active',
          hovered === status && 'quick-status-popup__option--hover',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-label={STATUS_LABELS[status]}
        aria-pressed={active}
      >
        <span className="quick-status-popup__mark" aria-hidden>
          {number !== undefined ? (
            number
          ) : status === 'Known' ? (
            <Check size={18} strokeWidth={2} />
          ) : (
            <EyeOff size={18} strokeWidth={2} />
          )}
        </span>
        <span className="quick-status-popup__label">{STATUS_LABELS[status]}</span>
      </button>
    );
  };

  return (
    <div ref={popupRef} className="quick-status-popup" onPointerDown={(e) => e.stopPropagation()}>
      {/* Fixed DOM order; calculatePosition may flip flex-direction (quick menu only). */}
      {statuses.map(renderStatusOption)}
      <div className="quick-status-popup__divider" aria-hidden />
      <button
        type="button"
        data-qs-action="phrase"
        className={`quick-status-popup__option${hovered === 'phrase' ? ' quick-status-popup__option--hover' : ''}`}
        aria-label="Select a phrase"
      >
        <span className="quick-status-popup__mark" aria-hidden>
          <Brackets size={18} strokeWidth={2} />
        </span>
        <span className="quick-status-popup__label">Select a Phrase</span>
      </button>
    </div>
  );
};
