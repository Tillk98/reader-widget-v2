import React from 'react';
import type { LingQStatusType } from './LingQStatusBar';
import { LingQStatusBar } from './LingQStatusBar';
import './ReaderBottomBar.css';

export interface ActiveSelectionBarProps {
  selectedWordId?: string | null;
  selectedWordStatus: LingQStatusType;
  onSelectedWordStatusChange: (status: LingQStatusType) => void;
  /** Optional class for the wrapper (e.g. drawer placement) */
  wrapperClassName?: string;
}

export const ActiveSelectionBar: React.FC<ActiveSelectionBarProps> = ({
  selectedWordStatus,
  onSelectedWordStatusChange,
  wrapperClassName,
}) => {
  return (
    <div
      className={wrapperClassName ? `reader-bottom-bar-active-row ${wrapperClassName}` : 'reader-bottom-bar-active-row'}
      role="group"
      aria-label="Word selection"
    >
      <div className="reader-bottom-bar-active-sheet-wrap">
        <LingQStatusBar
          variant="sheet"
          status={selectedWordStatus}
          onStatusChange={onSelectedWordStatusChange}
        />
      </div>
    </div>
  );
};
