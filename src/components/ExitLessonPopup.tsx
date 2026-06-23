import React, { useEffect, useState } from 'react';
import './ExitLessonPopup.css';

export interface ExitLessonPopupProps {
  open: boolean;
  /** Dismiss the popup (Go Back / X / overlay / Escape). */
  onClose: () => void;
  /** Confirm exit — wired in a later step (no-op in this prototype). */
  onExit?: () => void;
}

export const ExitLessonPopup: React.FC<ExitLessonPopupProps> = ({ open, onClose, onExit }) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="exit-lesson-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="exit-lesson-popup" role="dialog" aria-modal="true" aria-label="Exit lesson">
        <div className="exit-lesson-popup__header">
          <p className="exit-lesson-popup__title">Exit this lesson?</p>
          <p className="exit-lesson-popup__subtitle">You will be taken back to the library.</p>
        </div>

        <div className="exit-lesson-popup__actions">
          <button
            type="button"
            className="exit-lesson-popup__btn exit-lesson-popup__btn--secondary"
            onClick={onClose}
          >
            Go Back
          </button>
          <button
            type="button"
            className="exit-lesson-popup__btn exit-lesson-popup__btn--danger"
            onClick={onExit}
          >
            Exit Lesson
          </button>
        </div>

        <label className="exit-lesson-popup__dont-show">
          <span className="exit-lesson-popup__dont-show-label">Don't show this again</span>
          <input
            type="checkbox"
            className="exit-lesson-popup__checkbox"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
          />
        </label>
      </div>
    </div>
  );
};
