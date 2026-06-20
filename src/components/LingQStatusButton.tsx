import React from 'react';
import { Check, EyeOff } from 'lucide-react';
import type { LingQStatusType } from './LingQStatusBar';
import './LingQStatusButton.css';

const STATUS_NUMBERS: Partial<Record<LingQStatusType, string>> = {
  New: '1', Recognized: '2', Familiar: '3', Learned: '4',
};

const STATUS_LABELS: Record<LingQStatusType, string> = {
  New: 'New',
  Recognized: 'Recognized',
  Familiar: 'Familiar',
  Learned: 'Learned',
  Known: 'Known',
  Ignored: 'Ignore',
};

interface LingQStatusButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  status: LingQStatusType;
  /**
   * `focus`   — active / selected: bordered pill, green text/icon (grey for Ignored, subtle-green fill for Known).
   * `default` — inactive: no border, black number/icon.
   */
  state?: 'focus' | 'default';
  /** Render the status name beside the number/icon (Figma `showLabel` variant). */
  showLabel?: boolean;
}

/**
 * Canonical LingQ status indicator (Figma 4008:56485). The single source of truth for the
 * status pill shown wherever a word/phrase's LingQ status appears — reader popups, the status
 * bar, term cards, term lists, snackbars.
 */
export const LingQStatusButton = React.forwardRef<HTMLButtonElement, LingQStatusButtonProps>(
  ({ status, state = 'default', showLabel = false, className, ...rest }, ref) => {
    const number = STATUS_NUMBERS[status];

    return (
      <button
        ref={ref}
        type="button"
        className={[
          'lingq-status-btn',
          `lingq-status-btn--${status.toLowerCase()}`,
          state === 'focus' && 'lingq-status-btn--focus',
          showLabel && 'lingq-status-btn--with-label',
          className,
        ].filter(Boolean).join(' ')}
        {...rest}
      >
        {number !== undefined ? (
          <span className="lingq-status-btn__number">{number}</span>
        ) : status === 'Known' ? (
          <Check size={16} strokeWidth={2} aria-hidden />
        ) : (
          <EyeOff size={16} strokeWidth={2} aria-hidden />
        )}
        {showLabel && <span className="lingq-status-btn__label">{STATUS_LABELS[status]}</span>}
      </button>
    );
  },
);

LingQStatusButton.displayName = 'LingQStatusButton';
