import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CircleCheck, Trash2, Volume2, Plus } from 'lucide-react';
import type { LingQStatusType } from './LingQStatusBar';
import { LingQStatusButton } from './LingQStatusButton';
import { StatusPopover } from './StatusPopover';
import './VocabTermList.css';

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
  /** Tap the status badge: opens the vertical status menu alongside the badge. */
  onSelect: (wordId: string) => void;
  /** Pick a new status from the vertical status menu. */
  onStatusChange?: (wordId: string, status: LingQStatusType) => void;
  /** Tap the term (word + gloss): opens the full word detail sheet. Falls back to `onSelect`. */
  onOpenDetail?: (wordId: string) => void;
  /** Tap the "+" on an untracked term: add it as a LingQ. */
  onAdd?: (wordId: string) => void;
  /** Tap the audio button. */
  onAudio?: (wordId: string) => void;
  /** Swipe-right confirmed — word is marked Known. */
  onMarkKnown?: (wordId: string) => void;
  /** Swipe-left confirmed — word is marked Ignored. */
  onMarkIgnored?: (wordId: string) => void;
  /** Whether Known / Ignored statuses are shown by the current Review filter — controls whether
   *  a confirmed swipe collapses the tile (filtered out) or keeps it (stays with the new badge).
   *  Default true. */
  knownVisible?: boolean;
  ignoredVisible?: boolean;
  /** After adding an untracked word via "+", open its status menu in place (so a level can be
   *  set immediately) instead of relying on the host to surface it. */
  openStatusMenuOnAdd?: boolean;
  className?: string;
}

// ─── SwipeableTile ────────────────────────────────────────────────────────────

interface SwipeableTileProps {
  word: VocabTermItem;
  status: LingQStatusType;
  untracked: boolean;
  isSelected: boolean;
  showDivider: boolean;
  /** True when this tile's status menu is open. */
  statusMenuOpen: boolean;
  onSelect: () => void;
  /** Pick a new status from the open status menu. */
  onStatusSelect: (status: LingQStatusType) => void;
  /** Close this tile's status menu. */
  onStatusMenuClose: () => void;
  onOpenDetail: () => void;
  onAdd: () => void;
  onAudio: () => void;
  /** Whether the Known / Ignored statuses are currently shown by the Review filter — decides
   *  whether a confirmed swipe collapses the tile (filtered out) or it stays with the new badge. */
  knownVisible: boolean;
  ignoredVisible: boolean;
  /** Called once the swipe is confirmed (marks the word Known / Ignored). */
  onMarkKnown: () => void;
  onMarkIgnored: () => void;
}

const SwipeableTile: React.FC<SwipeableTileProps> = ({
  word,
  status,
  untracked,
  isSelected,
  showDivider,
  statusMenuOpen,
  onSelect,
  onStatusSelect,
  onStatusMenuClose,
  onOpenDetail,
  onAdd,
  onAudio,
  knownVisible,
  ignoredVisible,
  onMarkKnown,
  onMarkIgnored,
}) => {
  const statusBtnRef = useRef<HTMLButtonElement>(null);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [exitDir, setExitDir] = useState<'known' | 'ignored' | null>(null);
  /** Disables the reveal-width transition for one frame so the panel clears instantly (no
   *  move-back animation) when the row stays and just updates to the new status. */
  const [instantReset, setInstantReset] = useState(false);

  const startX = useRef(0);
  const startY = useRef(0);
  const isPointerDown = useRef(false);
  const dirDecided = useRef(false);
  const isHoriz = useRef(false);

  // Will a confirmed swipe in this direction keep the word visible (its new status is in the
  // filter) or remove it (collapse the tile)?
  const staysAfter = (dir: 'known' | 'ignored') => (dir === 'known' ? knownVisible : ignoredVisible);
  const willRemove = exitDir != null && !staysAfter(exitDir);

  // After the reveal sweeps fully across, commit the status. If the word stays in the filter,
  // clear the panel instantly (no move-back) so the row just snaps to its new status; if it's
  // filtered out, leave the wrapper collapsing and let the parent's re-filter unmount it.
  useEffect(() => {
    if (!exitDir) return;
    const collapse = !staysAfter(exitDir);
    const t = setTimeout(() => {
      if (exitDir === 'known') onMarkKnown();
      else onMarkIgnored();
      if (!collapse) {
        setInstantReset(true);
        setExitDir(null);
      }
    }, collapse ? 600 : 320);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exitDir, knownVisible, ignoredVisible, onMarkKnown, onMarkIgnored]);

  // Re-enable the reveal transition once the instant (no-animation) clear has painted.
  useEffect(() => {
    if (!instantReset) return;
    const t = setTimeout(() => setInstantReset(false), 50);
    return () => clearTimeout(t);
  }, [instantReset]);

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

    // Past threshold → reveal sweeps fully across (exitDir); the effect above commits the
    // status, then either retracts (stays) or collapses (removed) based on the filter.
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

  // Reveal panels slide IN OVER the tile content — their width tracks the drag distance, and
  // sweeps to full width once a swipe is confirmed (exitDir).
  const knownWidth = exitDir === 'known' ? '100%' : dragX > 0 ? `${dragX}px` : '0px';
  const ignoredWidth = exitDir === 'ignored' ? '100%' : dragX < 0 ? `${-dragX}px` : '0px';
  const revealTrans = dragging || instantReset ? 'none' : 'width 0.28s cubic-bezier(0.4, 0, 0.2, 1)';

  return (
    <>
      {showDivider && <div className="vocab-list__divider" aria-hidden />}
      <div
        className={[
          'vocab-list__swipe-wrapper',
          willRemove && `vocab-list__swipe-wrapper--exit-${exitDir}`,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {/* Tile content stays put — the reveal panels below slide over it */}
        <div
          className={[
            'vocab-list__tile',
            isSelected && 'vocab-list__tile--active',
          ]
            .filter(Boolean)
            .join(' ')}
          data-word-id={word.id}
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
              <LingQStatusButton
                ref={statusBtnRef}
                status={status}
                state="focus"
                onClick={onSelect}
                aria-haspopup="menu"
                aria-expanded={statusMenuOpen}
                aria-label={`Adjust status for ${word.text}`}
              />
            )}
            {statusMenuOpen && !untracked && (
              <StatusPopover
                anchorRef={statusBtnRef}
                status={status}
                onStatusChange={onStatusSelect}
                onClose={onStatusMenuClose}
                align="over"
              />
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
            <Volume2 size={20} strokeWidth={1.75} />
          </button>
        </div>

        {/* Left reveal — slides over from the left on swipe-right (mark Known) */}
        <div
          className="vocab-list__reveal vocab-list__reveal--known"
          style={{ width: knownWidth, transition: revealTrans }}
          aria-hidden
        >
          <span className="vocab-list__reveal-inner">
            <CircleCheck size={20} strokeWidth={2} />
            <span className="vocab-list__reveal-label">Known</span>
          </span>
        </div>

        {/* Right reveal — slides over from the right on swipe-left (mark Ignored) */}
        <div
          className="vocab-list__reveal vocab-list__reveal--ignored"
          style={{ width: ignoredWidth, transition: revealTrans }}
          aria-hidden
        >
          <span className="vocab-list__reveal-inner">
            <Trash2 size={20} strokeWidth={2} />
            <span className="vocab-list__reveal-label">Ignore</span>
          </span>
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
 * Supports swipe-right (mark Known) and swipe-left (mark Ignored): the swipe commits the
 * status and snaps back; whether the tile then stays is governed by the Review status filter.
 */
export const VocabTermList: React.FC<VocabTermListProps> = ({
  items,
  wordStatusMap,
  selectedWordId,
  untrackedIds,
  onSelect,
  onStatusChange,
  onOpenDetail,
  onAdd,
  onAudio,
  onMarkKnown,
  onMarkIgnored,
  knownVisible = true,
  ignoredVisible = true,
  openStatusMenuOnAdd = false,
  className,
}) => {
  const openDetail = onOpenDetail ?? onSelect;

  // Word whose vertical status menu is currently open (tapped its status badge).
  const [statusMenuId, setStatusMenuId] = useState<string | null>(null);

  // The visible set is governed entirely by the Review status filter (the parent passes
  // already-filtered `items`); this list does no status filtering of its own.
  return (
    <div className={['vocab-list', className].filter(Boolean).join(' ')}>
      {items.map((w, i) => {
        const untracked = untrackedIds?.has(w.id) ?? false;
        const status = wordStatusMap[w.id] ?? 'New';
        return (
          <SwipeableTile
            key={w.id}
            word={w}
            status={status}
            untracked={untracked}
            isSelected={selectedWordId === w.id}
            showDivider={i > 0}
            statusMenuOpen={statusMenuId === w.id}
            onSelect={() => setStatusMenuId((cur) => (cur === w.id ? null : w.id))}
            onStatusSelect={(s) => onStatusChange?.(w.id, s)}
            onStatusMenuClose={() => setStatusMenuId(null)}
            onOpenDetail={() => openDetail(w.id)}
            onAdd={() => {
              onAdd?.(w.id);
              // Surface the just-added word's status menu in place (it renders once the word
              // is tracked on the next paint) so the level can be set without leaving the list.
              if (openStatusMenuOnAdd) setStatusMenuId(w.id);
            }}
            onAudio={() => onAudio?.(w.id)}
            knownVisible={knownVisible}
            ignoredVisible={ignoredVisible}
            onMarkKnown={() => onMarkKnown?.(w.id)}
            onMarkIgnored={() => onMarkIgnored?.(w.id)}
          />
        );
      })}
    </div>
  );
};
