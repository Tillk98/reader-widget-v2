import React from 'react';
import { Check, EyeOff } from 'lucide-react';
import './LingQStatusBar.css';

export type LingQStatusType =
  | 'New'
  | 'Recognized'
  | 'Familiar'
  | 'Learned'
  | 'Known'
  | 'Ignored';

const LEARNING_STATUSES: LingQStatusType[] = ['New', 'Recognized', 'Familiar', 'Learned'];
const LEARNING_LABELS: Record<LingQStatusType, string> = {
  New: 'New',
  Recognized: 'Recognized',
  Familiar: 'Familiar',
  Learned: 'Learned',
  Known: 'Known',
  Ignored: 'Ignored',
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
}

export const LingQStatusBar: React.FC<LingQStatusBarProps> = ({
  status,
  onStatusChange,
  learningOnly = false,
}) => {
  const isKnown = status === 'Known';
  const isIgnored = status === 'Ignored';

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
            aria-label="Ignored"
          >
            <EyeOff size={14} aria-hidden />
            {isIgnored && (
              <span className="lingq-status-chip__label">Ignored</span>
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
