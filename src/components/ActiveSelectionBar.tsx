import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check, EyeOff } from 'lucide-react';
import type { LingQStatusType } from './LingQStatusBar';
import { LingQStatusBar } from './LingQStatusBar';
import './ReaderBottomBar.css';

const LEARNING_NUMBERS: Record<string, string> = {
  New: '1',
  Recognized: '2',
  Familiar: '3',
  Learned: '4',
};

export interface ActiveSelectionBarProps {
  selectedWordId?: string | null;
  selectedWordStatus: LingQStatusType;
  onSelectedWordStatusChange: (status: LingQStatusType) => void;
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrevWord: () => void;
  onNextWord: () => void;
  /** Optional class for the wrapper (e.g. drawer placement) */
  wrapperClassName?: string;
}

export const ActiveSelectionBar: React.FC<ActiveSelectionBarProps> = ({
  selectedWordId,
  selectedWordStatus,
  onSelectedWordStatusChange,
  canGoPrev,
  canGoNext,
  onPrevWord,
  onNextWord,
  wrapperClassName,
}) => {
  const [isStatusExpanded, setIsStatusExpanded] = useState(false);

  useEffect(() => {
    setIsStatusExpanded(false);
  }, [selectedWordId]);

  const isLearningStatus =
    selectedWordStatus === 'New' ||
    selectedWordStatus === 'Recognized' ||
    selectedWordStatus === 'Familiar' ||
    selectedWordStatus === 'Learned';

  return (
    <div
      className={wrapperClassName ? `reader-bottom-bar-active-row ${wrapperClassName}` : 'reader-bottom-bar-active-row'}
      role="group"
      aria-label="Word selection"
    >
      {isStatusExpanded ? (
        <div className="reader-bottom-bar-active-pill reader-bottom-bar-active-expanded">
          <LingQStatusBar
            status={selectedWordStatus}
            onStatusChange={onSelectedWordStatusChange}
            learningOnly
          />
          <button
            type="button"
            className="reader-bottom-bar-active-close"
            onClick={() => setIsStatusExpanded(false)}
            aria-label="Back"
          >
            <ChevronLeft size={18} aria-hidden />
          </button>
        </div>
      ) : (
        <>
          <div className="reader-bottom-bar-active-pill reader-bottom-bar-active-pill--left">
            {selectedWordStatus === 'Known' ? (
              <button
                type="button"
                className="lingq-status-chip lingq-status-chip--known lingq-status-chip--active"
                onClick={() => onSelectedWordStatusChange('New')}
                aria-label="Known"
                aria-pressed
              >
                <Check size={14} aria-hidden />
                <span className="lingq-status-chip__label">Known</span>
              </button>
            ) : selectedWordStatus === 'Ignored' ? (
              <button
                type="button"
                className="lingq-status-chip lingq-status-chip--ignored lingq-status-chip--active"
                onClick={() => onSelectedWordStatusChange('New')}
                aria-label="Ignored"
                aria-pressed
              >
                <EyeOff size={14} aria-hidden />
                <span className="lingq-status-chip__label">Ignored</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className={`lingq-status-chip lingq-status-chip--learning ${isLearningStatus ? 'lingq-status-chip--active' : ''}`}
                  onClick={() => setIsStatusExpanded(true)}
                  aria-label="Word status"
                >
                  <span className="lingq-status-chip__number">
                    {LEARNING_NUMBERS[selectedWordStatus] ?? '1'}
                  </span>
                </button>
                <div className="reader-bottom-bar-active-divider" aria-hidden />
                <button
                  type="button"
                  className="lingq-status-chip lingq-status-chip--ignored"
                  onClick={() => onSelectedWordStatusChange('Ignored')}
                  aria-pressed={false}
                  aria-label="Ignored"
                >
                  <EyeOff size={14} aria-hidden />
                </button>
                <button
                  type="button"
                  className="lingq-status-chip lingq-status-chip--known"
                  onClick={() => onSelectedWordStatusChange('Known')}
                  aria-pressed={false}
                  aria-label="Known"
                >
                  <Check size={14} aria-hidden />
                </button>
              </>
            )}
          </div>
          <div className="reader-bottom-bar-active-pill reader-bottom-bar-active-pill--right">
            <button
              type="button"
              className="reader-bottom-bar-active-chevron-btn"
              onClick={onPrevWord}
              disabled={!canGoPrev}
              aria-label="Previous word"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              type="button"
              className="reader-bottom-bar-active-chevron-btn"
              onClick={onNextWord}
              disabled={!canGoNext}
              aria-label="Next word"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </>
      )}
    </div>
  );
};
