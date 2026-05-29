import React from 'react';
import type { LingQStatusType } from './LingQStatusBar';
import { LingQStatusBar } from './LingQStatusBar';
import lynxDefaultIcon from '../assets/lynx-default.png';
import './ReaderBottomBar.css';

export interface ActiveSelectionBarProps {
  selectedWordId?: string | null;
  selectedWordStatus: LingQStatusType;
  onSelectedWordStatusChange: (status: LingQStatusType) => void;
  /** Lynx AI button shown beside the status bar (Figma LingQStatusActive). */
  onLynx?: () => void;
  /** Optional class for the wrapper (e.g. drawer placement) */
  wrapperClassName?: string;
}

export const ActiveSelectionBar: React.FC<ActiveSelectionBarProps> = ({
  selectedWordStatus,
  onSelectedWordStatusChange,
  onLynx,
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
          variant="segmented"
          status={selectedWordStatus}
          onStatusChange={onSelectedWordStatusChange}
        />
      </div>
      <button
        type="button"
        className="reader-bottom-bar-side-btn"
        onClick={onLynx}
        aria-label="Lynx AI"
      >
        <img src={lynxDefaultIcon} alt="" className="reader-bottom-bar-side-btn-icon" />
      </button>
    </div>
  );
};
