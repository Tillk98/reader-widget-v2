import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Undo2 } from 'lucide-react';
import type { LingQStatusType } from './LingQStatusBar';
import { LingQStatusButton } from './LingQStatusButton';
import './StatusSnackbar.css';

const STATUS_LABELS: Record<LingQStatusType, string> = {
  New: 'New',
  Recognized: 'Recognized',
  Familiar: 'Familiar',
  Learned: 'Learned',
  Known: 'Known',
  Ignored: 'Ignored',
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

  return (
    <div
      className={['status-snackbar', exiting && 'status-snackbar--exiting'].filter(Boolean).join(' ')}
      style={bottomOffsetPx !== undefined ? { bottom: `${bottomOffsetPx}px` } : undefined}
      role="status"
      aria-live="polite"
      onAnimationEnd={handleAnimationEnd}
    >
      <LingQStatusButton status={status} state="focus" tabIndex={-1} aria-hidden />
      <span className="status-snackbar__label">{STATUS_LABELS[status]}</span>
      <button
        type="button"
        className="status-snackbar__undo"
        aria-label="Undo status change"
        onClick={() => triggerExit(onUndo)}
      >
        <Undo2 size={16} strokeWidth={2} aria-hidden />
      </button>
    </div>
  );
};
