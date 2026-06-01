import React from 'react';
import type { Word } from '../data/lesson';
import type { LingQStatusType } from './LingQStatusBar';
import { VocabTermList } from './VocabTermList';
import './ReviewMode.css';

export interface ReviewModeProps {
  terms: Word[];
  wordStatusMap: Record<string, LingQStatusType>;
  /** Ids not yet saved as LingQs — shown with a blue "+" to add. */
  untrackedIds: ReadonlySet<string>;
  selectedWordId: string | null;
  /** Tap the status badge: surfaces the LingQ status bar. */
  onSelect: (wordId: string) => void;
  /** Tap a term (word + gloss): opens the full word detail sheet. */
  onOpenDetail: (wordId: string) => void;
  /** Tap the "+" on an untracked term: add it as a LingQ (status "New") + surface the status bar. */
  onAdd: (wordId: string) => void;
  /** Clear the current selection (e.g. tapping the list background). */
  onDeselect: () => void;
}

/**
 * Review mode — a scrollable list of the lesson's vocabulary terms for review.
 * Reuses the shared VocabTermList from Sentence mode. Figma 2830:64728.
 */
export const ReviewMode: React.FC<ReviewModeProps> = ({
  terms,
  wordStatusMap,
  untrackedIds,
  selectedWordId,
  onSelect,
  onOpenDetail,
  onAdd,
  onDeselect,
}) => {
  const handleBackgroundClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (target?.closest('.vocab-list__tile, button')) return;
    onDeselect();
  };

  return (
    <div className="review-mode" onClick={handleBackgroundClick}>
      <div className="review-mode__inner">
        <VocabTermList
          items={terms}
          wordStatusMap={wordStatusMap}
          selectedWordId={selectedWordId}
          untrackedIds={untrackedIds}
          onSelect={onSelect}
          onOpenDetail={onOpenDetail}
          onAdd={onAdd}
        />
      </div>
    </div>
  );
};
