import React, { useCallback, useRef } from 'react';
import { Funnel, ChevronDown, PanelRight, X } from 'lucide-react';
import type { Word } from '../data/lesson';
import type { LingQStatusType } from './LingQStatusBar';
import { VocabTermList } from './VocabTermList';
import './PanelReviewList.css';

/** Downward drag past this (px) on the handle dismisses the panel. */
const DRAG_CLOSE_THRESHOLD_PX = 24;

export interface PanelReviewListProps {
  /** Filter pill label, e.g. "Page • All". */
  filterLabel: string;
  /** Open the filter sheet. */
  onOpenFilter: () => void;
  /** Close the side panel entirely (X / drag-to-dismiss). */
  onClose: () => void;
  /** Side-panel toggle (active while docked) — undocks / closes the panel. */
  onTogglePanelMode: () => void;

  terms: Word[];
  wordStatusMap: Record<string, LingQStatusType>;
  untrackedIds: ReadonlySet<string>;
  onStatusChange: (wordId: string, status: LingQStatusType) => void;
  /** Tap a term: drill into its detail (handled by the host — selects the word). */
  onOpenDetail: (wordId: string) => void;
  onAdd: (wordId: string) => void;
  onMarkKnown: (wordId: string) => void;
  onMarkIgnored: (wordId: string) => void;
  knownVisible: boolean;
  ignoredVisible: boolean;
}

/**
 * The docked side panel's "no word/phrase selected" state: a Review-style vocab list scoped
 * to the current view, with a filter pill on top. Inherits the panel chrome (drag handle,
 * side-panel toggle, X) from the word-detail widget so it reads as the same surface.
 */
export const PanelReviewList: React.FC<PanelReviewListProps> = ({
  filterLabel,
  onOpenFilter,
  onClose,
  onTogglePanelMode,
  terms,
  wordStatusMap,
  untrackedIds,
  onStatusChange,
  onOpenDetail,
  onAdd,
  onMarkKnown,
  onMarkIgnored,
  knownVisible,
  ignoredVisible,
}) => {
  const dragStartYRef = useRef<number | null>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    dragStartYRef.current = e.clientY;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (dragStartYRef.current === null) return;
      if (e.clientY - dragStartYRef.current >= DRAG_CLOSE_THRESHOLD_PX) {
        dragStartYRef.current = null;
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
        onClose();
      }
    },
    [onClose]
  );

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    dragStartYRef.current = null;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  }, []);

  return (
    <div className="word-detail-sheet-root is-open is-panel-mode panel-review-list" role="dialog" aria-label="Review vocabulary">
      <div className="word-detail-sheet-panel">
        <button
          type="button"
          className="word-detail-sheet-handle"
          aria-label="Drag down or tap to close"
          onClick={onClose}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />

        <div className="word-detail-sheet-button-set">
          <button
            type="button"
            className="word-detail-sheet-vol-btn word-detail-sheet-panel-toggle is-active"
            aria-label="Close side panel"
            aria-pressed
            onClick={onTogglePanelMode}
          >
            <PanelRight size={16} aria-hidden />
          </button>
          <button
            type="button"
            className="word-detail-sheet-vol-btn word-detail-sheet-close"
            aria-label="Close review"
            onClick={onClose}
          >
            <X size={16} aria-hidden />
          </button>
        </div>

        <div className="panel-review-list__header">
          <button
            type="button"
            className="panel-review-list__filter-pill"
            aria-label="Review filter"
            onClick={onOpenFilter}
          >
            <Funnel size={18} strokeWidth={2} />
            <span className="panel-review-list__filter-label">{filterLabel}</span>
            <ChevronDown size={18} strokeWidth={2} />
          </button>
        </div>

        <div className="panel-review-list__content">
          <VocabTermList
            items={terms}
            wordStatusMap={wordStatusMap}
            untrackedIds={untrackedIds}
            onSelect={onOpenDetail}
            onStatusChange={onStatusChange}
            onOpenDetail={onOpenDetail}
            onAdd={onAdd}
            onMarkKnown={onMarkKnown}
            onMarkIgnored={onMarkIgnored}
            knownVisible={knownVisible}
            ignoredVisible={ignoredVisible}
          />
        </div>
      </div>
    </div>
  );
};
