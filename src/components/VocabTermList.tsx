import React from 'react';
import { Volume2, Check, Plus } from 'lucide-react';
import type { LingQStatusType } from './LingQStatusBar';
import './VocabTermList.css';

/** Learning statuses map to the 1–4 badge shown on the vocabulary tile. */
const LEARNING_NUMBER: Partial<Record<LingQStatusType, number>> = {
  New: 1,
  Recognized: 2,
  Familiar: 3,
  Learned: 4,
};

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
  className?: string;
}

/**
 * Shared list of vocabulary terms (status badge + term/gloss + audio), used by both
 * Sentence mode and Review mode. Figma 2812:56925 / 2830:64728.
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
  className,
}) => {
  const openDetail = onOpenDetail ?? onSelect;
  return (
    <div className={['vocab-list', className].filter(Boolean).join(' ')}>
      {items.map((w, i) => {
        const untracked = untrackedIds?.has(w.id) ?? false;
        const status = wordStatusMap[w.id] ?? 'New';
        const number = LEARNING_NUMBER[status];
        return (
          <React.Fragment key={w.id}>
            {i > 0 && <div className="vocab-list__divider" aria-hidden />}
            <div
              className={[
                'vocab-list__tile',
                selectedWordId === w.id && 'vocab-list__tile--active',
              ]
                .filter(Boolean)
                .join(' ')}
              data-word-id={w.id}
            >
              <div className="vocab-list__term">
                {untracked ? (
                  <button
                    type="button"
                    className="vocab-list__status vocab-list__status--add"
                    onClick={() => onAdd?.(w.id)}
                    aria-label={`Add ${w.text} as LingQ`}
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
                    onClick={() => onSelect(w.id)}
                    aria-label={`Adjust status for ${w.text}`}
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
                  onClick={() => openDetail(w.id)}
                >
                  <p className="vocab-list__term-word">{w.text}</p>
                  <p className="vocab-list__term-gloss">{w.translation ?? w.text}</p>
                </button>
              </div>
              <button
                type="button"
                className="vocab-list__audio"
                onClick={() => onAudio?.(w.id)}
                aria-label={`Play ${w.text}`}
              >
                <Volume2 size={20} strokeWidth={1.75} />
              </button>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};
