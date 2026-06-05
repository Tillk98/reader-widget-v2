import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CircleCheck, Trash2, Play, Check, Plus } from 'lucide-react';
import type { LingQStatusType } from './LingQStatusBar';
import './VocabTermList.css';

const LEARNING_NUMBER: Partial<Record<LingQStatusType, number>> = {
  New: 1,
  Recognized: 2,
  Familiar: 3,
  Learned: 4,
};

/** px of horizontal drag required to confirm a swipe action. */
const SWIPE_THRESHOLD = 80;

/** px of movement before we decide if the gesture is horizontal or vertical. */
const DIRECTION_THRESHOLD = 10;

export interface VocabTermItem {
  id: string;
  text: string;
  translation?: string;
}

export interface VocabTermListProps {
  items: VocabTermItem[];
  wordStatusMap: Record<string, LingQStatusType>;
  /** Currently selected term (drives the LingQ status bar) — null when none. */
  selectedWordId?: string | null;
  /**
   * Ids not yet saved as LingQs — render a blue "+" add button instead of a status badge
   * (Review mode). Tapping the "+" calls `onAdd`.
   */
  untrackedIds?: ReadonlySet<string>;
  /** Tap the status badge: surfaces the LingQ status bar. */
  onSelect: (wordId: string) => void;
  /** Tap the term (word + gloss): opens the full word detail sheet. Falls back to `onSelect`. */
  onOpenDetail?: (wordId: string) => void;
  /** Tap the "+" on an untracked term: add it as a LingQ. */
  onAdd?: (wordId: string) => void;
  /** Tap the audio button. */
  onAudio?: (wordId: string) => void;
  /** Swipe-right confirmed — word is marked Known and removed from the list. */
  onMarkKnown?: (wordId: string) => void;
  /** Swipe-left confirmed — word is marked Ignored and removed from the list. */
  onMarkIgnored?: (wordId: string) => void;
  className?: string;
}

// ─── SwipeableTile ────────────────────────────────────────────────────────────

interface SwipeableTileProps {
  word: VocabTermItem;
  status: LingQStatusType;
  number: number | undefined;
  untracked: boolean;
  isSelected: boolean;
  showDivider: boolean;
  onSelect: () => void;
  onOpenDetail: () => void;
  onAdd: () => void;
  onAudio: () => void;
  /** Called once the exit animation completes. */
  onMarkKnown: () => void;
  onMarkIgnored: () => void;
}

const SwipeableTile: React.FC<SwipeableTileProps> = ({
  word,
  status,
  number,
  untracked,
  isSelected,
  showDivider,
  onSelect,
  onOpenDetail,
  onAdd,
  onAudio,
  onMarkKnown,
  onMarkIgnored,
}) => {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [exitDir, setExitDir] = useState<'known' | 'ignored' | null>(null);

  const startX = useRef(0);
  const startY = useRef(0);
  const isPointerDown = useRef(false);
  const dirDecided = useRef(false);
  const isHoriz = useRef(false);

  // Fire the parent callback after the exit animation plays (~280 ms).
  // The parent then removes this tile from the visible list.
  useEffect(() => {
    if (!exitDir) return;
    const t = setTimeout(() => {
      if (exitDir === 'known') onMarkKnown();
      else onMarkIgnored();
    }, 310);
    return () => clearTimeout(t);
  }, [exitDir, onMarkKnown, onMarkIgnored]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (exitDir) return;
    // Prevent the SentenceMode container from treating this as a sentence-navigation swipe.
    e.stopPropagation();
    isPointerDown.current = true;
    startX.current = e.clientX;
    startY.current = e.clientY;
    dirDecided.current = false;
    isHoriz.current = false;
  }, [exitDir]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isPointerDown.current || exitDir) return;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;

    if (!dirDecided.current) {
      if (Math.abs(dx) > DIRECTION_THRESHOLD || Math.abs(dy) > DIRECTION_THRESHOLD) {
        dirDecided.current = true;
        isHoriz.current = Math.abs(dx) > Math.abs(dy);
        if (isHoriz.current) {
          setDragging(true);
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        }
      }
      return;
    }

    if (!isHoriz.current) return;
    setDragX(dx);
  }, [exitDir]);

  const handlePointerUp = useCallback(() => {
    isPointerDown.current = false;
    if (!dragging) return;
    dirDecided.current = false;
    isHoriz.current = false;
    setDragging(false);

    if (dragX >= SWIPE_THRESHOLD) {
      setDragX(0);
      setExitDir('known');
    } else if (dragX <= -SWIPE_THRESHOLD) {
      setDragX(0);
      setExitDir('ignored');
    } else {
      setDragX(0);
    }
  }, [dragging, dragX]);

  // Reveal opacity: ramps 0 → 1 as drag approaches threshold.
  const knownOpacity = Math.min(Math.max(dragX / SWIPE_THRESHOLD, 0), 1);
  const ignoredOpacity = Math.min(Math.max(-dragX / SWIPE_THRESHOLD, 0), 1);

  const tileX = exitDir === 'known'
    ? '110%'
    : exitDir === 'ignored'
    ? '-110%'
    : `${dragX}px`;

  const tileTrans = dragging
    ? 'none'
    : exitDir
    ? 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)'
    : 'transform 0.36s cubic-bezier(0.33, 1, 0.68, 1)';

  return (
    <>
      {showDivider && <div className="vocab-list__divider" aria-hidden />}
      <div
        className={[
          'vocab-list__swipe-wrapper',
          exitDir && `vocab-list__swipe-wrapper--exit-${exitDir}`,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {/* Left reveal — shown on swipe-right */}
        <div
          className="vocab-list__reveal vocab-list__reveal--known"
          style={{ opacity: exitDir === 'known' ? 1 : knownOpacity }}
          aria-hidden
        >
          <CircleCheck size={20} strokeWidth={2} />
          <span className="vocab-list__reveal-label">Known</span>
        </div>

        {/* Right reveal — shown on swipe-left */}
        <div
          className="vocab-list__reveal vocab-list__reveal--ignored"
          style={{ opacity: exitDir === 'ignored' ? 1 : ignoredOpacity }}
          aria-hidden
        >
          <Trash2 size={20} strokeWidth={2} />
          <span className="vocab-list__reveal-label">Ignore</span>
        </div>

        {/* Draggable tile */}
        <div
          className={[
            'vocab-list__tile',
            isSelected && 'vocab-list__tile--active',
          ]
            .filter(Boolean)
            .join(' ')}
          data-word-id={word.id}
          style={{ transform: `translateX(${tileX})`, transition: tileTrans }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div className="vocab-list__term">
            {untracked ? (
              <button
                type="button"
                className="vocab-list__status vocab-list__status--add"
                onClick={onAdd}
                aria-label={`Add ${word.text} as LingQ`}
              >
                <Plus size={18} strokeWidth={2.25} />
              </button>
            ) : (
              <button
                type="button"
                className={[
                  'vocab-list__status',
                  status === 'Known' && 'vocab-list__status--known',
                  status === 'Ignored' && 'vocab-list__status--ignored',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={onSelect}
                aria-label={`Adjust status for ${word.text}`}
              >
                {status === 'Known' ? (
                  <Check size={16} strokeWidth={2.25} />
                ) : (
                  <span className="vocab-list__status-num">{number ?? ''}</span>
                )}
              </button>
            )}
            <button
              type="button"
              className="vocab-list__term-text"
              onClick={onOpenDetail}
            >
              <p className="vocab-list__term-word">{word.text}</p>
              <p className="vocab-list__term-gloss">{word.translation ?? word.text}</p>
            </button>
          </div>
          <button
            type="button"
            className="vocab-list__audio"
            onClick={onAudio}
            aria-label={`Play ${word.text}`}
          >
            <Play size={20} strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </>
  );
};

// ─── VocabTermList ────────────────────────────────────────────────────────────

/**
 * Shared list of vocabulary terms (status badge + term/gloss + audio), used by
 * both Sentence mode and Review mode. Figma 2812:56925 / 2830:64728 / 3926:8702.
 *
 * Supports swipe-right (mark Known) and swipe-left (mark Ignored): the tile
 * animates off screen and is removed from the list automatically.
 */
export const VocabTermList: React.FC<VocabTermListProps> = ({
  items,
  wordStatusMap,
  selectedWordId,
  untrackedIds,
  onSelect,
  onOpenDetail,
  onAdd,
  onAudio,
  onMarkKnown,
  onMarkIgnored,
  className,
}) => {
  const openDetail = onOpenDetail ?? onSelect;

  // Local set of word IDs that have been swiped away — filtered out of the list.
  const [dismissedIds, setDismissedIds] = useState<ReadonlySet<string>>(new Set());

  const visibleItems = useMemo(
    () => items.filter((w) => {
      if (dismissedIds.has(w.id)) return false;
      const s = wordStatusMap[w.id];
      if (s === 'Known' || s === 'Ignored') return false;
      return true;
    }),
    [items, dismissedIds, wordStatusMap],
  );

  const handleMarkKnown = useCallback(
    (wordId: string) => {
      setDismissedIds((prev) => new Set([...prev, wordId]));
      onMarkKnown?.(wordId);
    },
    [onMarkKnown],
  );

  const handleMarkIgnored = useCallback(
    (wordId: string) => {
      setDismissedIds((prev) => new Set([...prev, wordId]));
      onMarkIgnored?.(wordId);
    },
    [onMarkIgnored],
  );

  return (
    <div className={['vocab-list', className].filter(Boolean).join(' ')}>
      {visibleItems.map((w, i) => {
        const untracked = untrackedIds?.has(w.id) ?? false;
        const status = wordStatusMap[w.id] ?? 'New';
        const number = LEARNING_NUMBER[status];
        return (
          <SwipeableTile
            key={w.id}
            word={w}
            status={status}
            number={number}
            untracked={untracked}
            isSelected={selectedWordId === w.id}
            showDivider={i > 0}
            onSelect={() => onSelect(w.id)}
            onOpenDetail={() => openDetail(w.id)}
            onAdd={() => onAdd?.(w.id)}
            onAudio={() => onAudio?.(w.id)}
            onMarkKnown={() => handleMarkKnown(w.id)}
            onMarkIgnored={() => handleMarkIgnored(w.id)}
          />
        );
      })}
    </div>
  );
};
