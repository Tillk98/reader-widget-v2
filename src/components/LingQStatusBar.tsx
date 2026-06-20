import React from 'react';
import { Check, EyeOff } from 'lucide-react';
import { LingQStatusButton } from './LingQStatusButton';
import './LingQStatusBar.css';

export type LingQStatusType =
  | 'New'
  | 'Recognized'
  | 'Familiar'
  | 'Learned'
  | 'Known'
  | 'Ignored';

const LEARNING_STATUSES: LingQStatusType[] = ['New', 'Recognized', 'Familiar', 'Learned'];

const SEGMENT_ORDER: LingQStatusType[] = [
  'Ignored',
  'New',
  'Recognized',
  'Familiar',
  'Learned',
  'Known',
];

const LEARNING_LABELS: Record<LingQStatusType, string> = {
  New: 'New',
  Recognized: 'Recognized',
  Familiar: 'Familiar',
  Learned: 'Learned',
  Known: 'Known',
  Ignored: 'Ignore',
};
const LEARNING_NUMBERS: Record<LingQStatusType, string> = {
  New: '1',
  Recognized: '2',
  Familiar: '3',
  Learned: '4',
  Known: '',
  Ignored: '',
};

interface LingQStatusBarProps {
  status: LingQStatusType;
  onStatusChange: (status: LingQStatusType) => void;
  /** When true, only the learning statuses (1–4) are shown; Ignored and Known are hidden. Used in bottom bar expanded state. */
  learningOnly?: boolean;
  /** Restrict / reorder the rows shown (vertical variant only). Defaults to all six statuses. */
  statuses?: LingQStatusType[];
  /**
   * `sheet`     — word detail bottom sheet: LingQStatusButton row (Figma 4011:11766).
   * `floating`  — compact floating bar above/below the popup (Figma 4008:56509).
   * `vertical`  — unfurling vertical status popover (Figma 4063:74418): rows of mark + label.
   */
  variant?: 'default' | 'sheet' | 'floating' | 'vertical';
}

export const LingQStatusBar: React.FC<LingQStatusBarProps> = ({
  status,
  onStatusChange,
  learningOnly = false,
  statuses,
  variant = 'default',
}) => {
  const isKnown = status === 'Known';
  const isIgnored = status === 'Ignored';

  if (variant === 'floating') {
    return (
      <div className="lingq-status-bar lingq-status-bar--floating" role="group" aria-label="Word status">
        {SEGMENT_ORDER.map((seg) => (
          <LingQStatusButton
            key={seg}
            status={seg}
            state={status === seg ? 'focus' : 'default'}
            onClick={() => onStatusChange(seg)}
            aria-pressed={status === seg}
            aria-label={LEARNING_LABELS[seg]}
          />
        ))}
      </div>
    );
  }

  if (variant === 'vertical') {
    return (
      <div className="lingq-status-bar lingq-status-bar--vertical" role="group" aria-label="Word status">
        {(statuses ?? SEGMENT_ORDER).map((seg) => (
          <LingQStatusButton
            key={seg}
            status={seg}
            state={status === seg ? 'focus' : 'default'}
            showLabel
            onClick={() => onStatusChange(seg)}
            aria-pressed={status === seg}
            aria-label={LEARNING_LABELS[seg]}
          />
        ))}
      </div>
    );
  }

  if (variant === 'sheet') {
    return (
      <div className="lingq-status-bar lingq-status-bar--sheet" role="group" aria-label="Word status">
        {SEGMENT_ORDER.map((seg) => (
          <LingQStatusButton
            key={seg}
            status={seg}
            state={status === seg ? 'focus' : 'default'}
            onClick={() => onStatusChange(seg)}
            aria-pressed={status === seg}
            aria-label={LEARNING_LABELS[seg]}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="lingq-status-bar" role="group" aria-label="Word status">
      <div className="lingq-status-bar__active-group">
        {LEARNING_STATUSES.map((s) => {
          const active = status === s;
          const showLabel = active;
          return (
            <button
              key={s}
              type="button"
              className={`lingq-status-chip lingq-status-chip--learning ${active ? 'lingq-status-chip--active' : ''}`}
              onClick={() => onStatusChange(s)}
              aria-pressed={active}
              aria-label={LEARNING_LABELS[s]}
            >
              <span className="lingq-status-chip__number">{LEARNING_NUMBERS[s]}</span>
              {showLabel && (
                <span className="lingq-status-chip__label">{LEARNING_LABELS[s]}</span>
              )}
            </button>
          );
        })}
      </div>
      {!learningOnly && (
        <div className="lingq-status-bar__inactive-group">
          <button
            type="button"
            className={`lingq-status-chip lingq-status-chip--ignored ${isIgnored ? 'lingq-status-chip--active' : ''}`}
            onClick={() => onStatusChange('Ignored')}
            aria-pressed={isIgnored}
            aria-label="Ignore"
          >
            <EyeOff size={14} aria-hidden />
            {isIgnored && (
              <span className="lingq-status-chip__label">Ignore</span>
            )}
          </button>
          <button
            type="button"
            className={`lingq-status-chip lingq-status-chip--known ${isKnown ? 'lingq-status-chip--active' : ''}`}
            onClick={() => onStatusChange('Known')}
            aria-pressed={isKnown}
            aria-label="Known"
          >
            <Check size={14} aria-hidden />
            {isKnown && (
              <span className="lingq-status-chip__label">Known</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
