import React from 'react';
import { X, Funnel, ChevronDown } from 'lucide-react';
import type { Word } from '../data/lesson';
import type { LingQStatusType } from './LingQStatusBar';
import { BottomSheet } from './BottomSheet';
import { VocabTermList } from './VocabTermList';
import lynxDefaultIcon from '../assets/lynx-default.png';
import streakIcon from '../assets/streak-icon.png';
import './ReviewMode.css';

export interface ReviewModeProps {
  open: boolean;
  onClose: () => void;
  /** Opens the review filter sheet. */
  onOpenFilter: () => void;
  /** Label shown in the filter pill, e.g. "Lesson • All". */
  reviewFilterLabel: string;
  /** Opens the Lynx chat. */
  onLynxAI?: () => void;
  /** Opens the stats sheet. */
  onStats?: () => void;

  terms: Word[];
  wordStatusMap: Record<string, LingQStatusType>;
  /** Ids not yet saved as LingQs — shown with a blue "+" to add. */
  untrackedIds: ReadonlySet<string>;
  selectedWordId: string | null;
  /** Tap the status badge: opens the vertical status menu alongside the badge. */
  onSelect: (wordId: string) => void;
  /** Pick a new status from the vertical status menu. */
  onStatusChange?: (wordId: string, status: LingQStatusType) => void;
  /** Tap a term (word + gloss): opens the full word detail sheet. */
  onOpenDetail: (wordId: string) => void;
  /** Tap the "+" on an untracked term: add it as a LingQ. */
  onAdd: (wordId: string) => void;
  /** Clear the current selection (e.g. tapping the list background). */
  onDeselect: () => void;
  /** Swipe-right on a vocab tile — mark the word as Known. */
  onMarkKnown?: (wordId: string) => void;
  /** Swipe-left on a vocab tile — mark the word as Ignored. */
  onMarkIgnored?: (wordId: string) => void;
}

/**
 * Review mode — slides up as a full-height bottom sheet over the reader.
 * Closed via the X button, swipe-down on the drag bar, or Escape.
 * Figma: Reader/ReviewMode/ListReview (2830:64728).
 */
export const ReviewMode: React.FC<ReviewModeProps> = ({
  open,
  onClose,
  onOpenFilter,
  reviewFilterLabel,
  onLynxAI,
  onStats,
  terms,
  wordStatusMap,
  untrackedIds,
  selectedWordId,
  onSelect,
  onStatusChange,
  onOpenDetail,
  onAdd,
  onDeselect,
  onMarkKnown,
  onMarkIgnored,
}) => {
  const handleBackgroundClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (target?.closest('.vocab-list__tile, button')) return;
    onDeselect();
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      variant="full"
      ariaLabel="Review vocabulary"
      showDragBar
      className="review-sheet"
    >
      {/* ── Sheet header ─────────────────────────────────────────── */}
      <div className="review-sheet__header">
        {/* X — close */}
        <button
          type="button"
          className="review-sheet__header-btn"
          aria-label="Close review"
          onClick={onClose}
        >
          <X size={24} strokeWidth={2} />
        </button>

        {/* Filter pill — centered absolutely so the side buttons don't affect its position */}
        <button
          type="button"
          className="review-sheet__filter-pill"
          aria-label="Review filter"
          onClick={onOpenFilter}
        >
          <Funnel size={18} strokeWidth={2} />
          <span className="review-sheet__filter-label">{reviewFilterLabel}</span>
          <ChevronDown size={18} strokeWidth={2} />
        </button>

        {/* Stats icon — right */}
        <button
          type="button"
          className="review-sheet__header-btn"
          aria-label="Lesson stats"
          onClick={onStats}
        >
          <img src={streakIcon} alt="" className="review-sheet__stats-icon" />
        </button>
      </div>

      {/* ── Scrollable vocab list ─────────────────────────────────── */}
      <div className="review-sheet__content" onClick={handleBackgroundClick}>
        <VocabTermList
          items={terms}
          wordStatusMap={wordStatusMap}
          selectedWordId={selectedWordId}
          untrackedIds={untrackedIds}
          onSelect={onSelect}
          onStatusChange={onStatusChange}
          onOpenDetail={onOpenDetail}
          onAdd={onAdd}
          onMarkKnown={onMarkKnown}
          onMarkIgnored={onMarkIgnored}
        />
      </div>

      {/* ── Bottom bar — Lynx only ────────────────────────────────── */}
      <div className="review-sheet__bottom-bar">
        <button
          type="button"
          className="review-sheet__lynx-btn"
          aria-label="Lynx AI"
          onClick={onLynxAI}
        >
          <img src={lynxDefaultIcon} alt="" className="review-sheet__lynx-icon" />
        </button>
      </div>
    </BottomSheet>
  );
};
