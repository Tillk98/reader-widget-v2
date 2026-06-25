import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Trash2, Undo2 } from 'lucide-react';
import './MeaningSnackbar.css';

const AUTO_DISMISS_MS = 3000;

export type MeaningSnackbarVariant = 'saved' | 'deleted';

export interface MeaningSnackbarProps {
  /** 'saved' → blue check + "Meaning Saved"; 'deleted' → red trash + "Meaning Deleted". */
  variant: MeaningSnackbarVariant;
  /** Reverts the action this snackbar reported. */
  onUndo: () => void;
  onDismiss: () => void;
}

/**
 * Pill confirmation toast for saved-meaning edits (Figma MeaningSnackBar 4741:13899).
 * Auto-dismisses after a few seconds; the trailing return button undoes the action.
 */
export const MeaningSnackbar: React.FC<MeaningSnackbarProps> = ({
  variant,
  onUndo,
  onDismiss,
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

  const isDeleted = variant === 'deleted';

  return (
    <div
      className={[
        'meaning-snackbar',
        `meaning-snackbar--${variant}`,
        exiting && 'meaning-snackbar--exiting',
      ]
        .filter(Boolean)
        .join(' ')}
      role="status"
      aria-live="polite"
      onAnimationEnd={handleAnimationEnd}
    >
      <span className="meaning-snackbar__icon" aria-hidden>
        {isDeleted ? <Trash2 size={16} /> : <Check size={12} strokeWidth={2.5} />}
      </span>
      <span className="meaning-snackbar__label">
        {isDeleted ? 'Meaning Deleted' : 'Meaning Saved'}
      </span>
      <button
        type="button"
        className="meaning-snackbar__undo"
        aria-label={isDeleted ? 'Undo delete' : 'Undo save'}
        onClick={() => triggerExit(onUndo)}
      >
        <Undo2 size={16} strokeWidth={2} aria-hidden />
      </button>
    </div>
  );
};
