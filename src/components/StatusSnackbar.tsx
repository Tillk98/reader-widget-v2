import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Trash2, Undo2 } from 'lucide-react';
import type { LingQStatusType } from './LingQStatusBar';
import './StatusSnackbar.css';

const STATUS_LABELS: Record<LingQStatusType, string> = {
  New: 'New',
  Recognized: 'Recognized',
  Familiar: 'Familiar',
  Learned: 'Learned',
  Known: 'Known',
  Ignored: 'Ignored',
};

const STATUS_NUMBERS: Partial<Record<LingQStatusType, string>> = {
  New: '1',
  Recognized: '2',
  Familiar: '3',
  Learned: '4',
};

const AUTO_DISMISS_MS = 3000;

export interface StatusSnackbarProps {
  status: LingQStatusType;
  onUndo: () => void;
  onDismiss: () => void;
  /** Override the default CSS bottom offset (px). Use when the bottom bar is taller than usual, e.g. audio mode. */
  bottomOffsetPx?: number;
}

export const StatusSnackbar: React.FC<StatusSnackbarProps> = ({
  status,
  onUndo,
  onDismiss,
  bottomOffsetPx,
}) => {
  const [exiting, setExiting] = useState(false);
  const exitCallbackRef = useRef<(() => void) | undefined>(undefined);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const triggerExit = useCallback((cb: () => void) => {
    clearTimeout(timerRef.current);
    exitCallbackRef.current = cb;
    setExiting(true);
  }, []);

  useEffect(() => {
    timerRef.current = setTimeout(() => triggerExit(onDismiss), AUTO_DISMISS_MS);
    return () => clearTimeout(timerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAnimationEnd = useCallback(() => {
    if (exiting) exitCallbackRef.current?.();
  }, [exiting]);

  const isKnown = status === 'Known';
  const isIgnored = status === 'Ignored';
  const isLearning = !isKnown && !isIgnored;

  return (
    <div
      className={[
        'status-snackbar',
        isKnown && 'status-snackbar--known',
        isIgnored && 'status-snackbar--ignored',
        exiting && 'status-snackbar--exiting',
      ]
        .filter(Boolean)
        .join(' ')}
      style={bottomOffsetPx !== undefined ? { bottom: `${bottomOffsetPx}px` } : undefined}
      role="status"
      aria-live="polite"
      onAnimationEnd={handleAnimationEnd}
    >
      <div
        className={[
          'status-snackbar__badge',
          isKnown && 'status-snackbar__badge--known',
          isIgnored && 'status-snackbar__badge--ignored',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-hidden
      >
        {isLearning && (
          <span className="status-snackbar__badge-number">
            {STATUS_NUMBERS[status]}
          </span>
        )}
        {isKnown && <Check size={18} strokeWidth={2} />}
        {isIgnored && <Trash2 size={18} strokeWidth={2} />}
      </div>

      <span className="status-snackbar__label">{STATUS_LABELS[status]}</span>

      <button
        type="button"
        className="status-snackbar__undo"
        aria-label="Undo status change"
        onClick={() => triggerExit(onUndo)}
      >
        <Undo2 size={11} strokeWidth={2} />
      </button>
    </div>
  );
};
