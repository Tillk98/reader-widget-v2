import React from 'react';
import { Check, EyeOff } from 'lucide-react';
import type { LingQStatusType } from './LingQStatusBar';
import './LingQStatusButton.css';

const STATUS_NUMBERS: Partial<Record<LingQStatusType, string>> = {
  New: '1', Recognized: '2', Familiar: '3', Learned: '4',
};

interface LingQStatusButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  status: LingQStatusType;
  /**
   * `focus`   — active / selected: white background + drop shadow, green text/icon.
   * `default` — inactive: transparent background, black/muted text.
   */
  state?: 'focus' | 'default';
}

export const LingQStatusButton: React.FC<LingQStatusButtonProps> = ({
  status,
  state = 'default',
  className,
  ...rest
}) => {
  const number = STATUS_NUMBERS[status];

  return (
    <button
      type="button"
      className={[
        'lingq-status-btn',
        `lingq-status-btn--${status.toLowerCase()}`,
        state === 'focus' && 'lingq-status-btn--focus',
        className,
      ].filter(Boolean).join(' ')}
      {...rest}
    >
      {number !== undefined ? (
        <span className="lingq-status-btn__number">{number}</span>
      ) : status === 'Known' ? (
        <Check size={14} aria-hidden />
      ) : (
        <EyeOff size={14} aria-hidden />
      )}
    </button>
  );
};
