import React from 'react';
import { Check, EyeOff, Plus } from 'lucide-react';
import type { LingQStatusType } from './LingQStatusBar';
import './LingQStatusButton.css';

const STATUS_NUMBERS: Partial<Record<LingQStatusType, string>> = {
  New: '1', Recognized: '2', Familiar: '3', Learned: '4',
};

/**
 * Stroke width (in real pixels) for status icons. Used with `absoluteStrokeWidth` so the
 * weight stays constant regardless of icon size — lucide otherwise scales the stroke down
 * with the icon (a 14px icon at strokeWidth 2 renders ~1.17px), which made the smaller
 * status-bar chips look lighter than the larger button icons. Shared by LingQStatusBar.
 */
export const STATUS_ICON_STROKE = 1.5;

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
  /** Render the blue "Create" affordance (a + to add a new LingQ) instead of a status. */
  create?: boolean;
}

/**
 * Canonical LingQ status indicator (Figma 4008:56485). The single source of truth for the
 * status pill shown wherever a word/phrase's LingQ status appears — reader popups, the status
 * bar, term cards, term lists, snackbars.
 */
export const LingQStatusButton = React.forwardRef<HTMLButtonElement, LingQStatusButtonProps>(
  ({ status, state = 'default', showLabel = false, create = false, className, ...rest }, ref) => {
    const number = STATUS_NUMBERS[status];

    return (
      <button
        ref={ref}
        type="button"
        className={[
          'lingq-status-btn',
          create ? 'lingq-status-btn--create' : `lingq-status-btn--${status.toLowerCase()}`,
          !create && state === 'focus' && 'lingq-status-btn--focus',
          showLabel && 'lingq-status-btn--with-label',
          className,
        ].filter(Boolean).join(' ')}
        {...rest}
      >
        {create ? (
          <Plus size={18} strokeWidth={STATUS_ICON_STROKE} absoluteStrokeWidth aria-hidden />
        ) : number !== undefined ? (
          <span className="lingq-status-btn__number">{number}</span>
        ) : status === 'Known' ? (
          <Check size={18} strokeWidth={STATUS_ICON_STROKE} absoluteStrokeWidth aria-hidden />
        ) : (
          <EyeOff size={18} strokeWidth={STATUS_ICON_STROKE} absoluteStrokeWidth aria-hidden />
        )}
        {showLabel && !create && <span className="lingq-status-btn__label">{STATUS_LABELS[status]}</span>}
      </button>
    );
  },
);

LingQStatusButton.displayName = 'LingQStatusButton';
