import React, { useRef, useState } from 'react';
import { Check, Trash2, Plus } from 'lucide-react';
import type { LingQStatusType } from './LingQStatusBar';
import type { VocabTermItem } from './VocabTermList';
import './HorizontalTermList.css';

const LEARNING_NUMBER: Partial<Record<LingQStatusType, number>> = {
  New: 1,
  Recognized: 2,
  Familiar: 3,
  Learned: 4,
};

interface TermCardProps {
  item: VocabTermItem;
  status: LingQStatusType | undefined;
  isSelected: boolean;
  onSelect: (wordId: string) => void;
  onMarkKnown?: (wordId: string) => void;
  onMarkIgnored?: (wordId: string) => void;
}

const TermCard: React.FC<TermCardProps> = ({
  item,
  status,
  isSelected,
  onSelect,
  onMarkKnown,
  onMarkIgnored,
}) => {
  const isTracked = status !== undefined;
  const isKnown = status === 'Known';
  const isIgnored = status === 'Ignored';
  const learningNum = status ? LEARNING_NUMBER[status] : undefined;

  return (
    <div
      className={[
        'h-term-card',
        isSelected && 'h-term-card--selected',
        isKnown && 'h-term-card--known',
        isIgnored && 'h-term-card--ignored',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Left: badge + text */}
      <button
        type="button"
        className="h-term-card__meta"
        onClick={() => onSelect(item.id)}
        aria-label={`Select ${item.text}`}
      >
        {/* Status badge */}
        <div
          className={[
            'h-term-card__badge',
            !isTracked && 'h-term-card__badge--add',
            isKnown && 'h-term-card__badge--known',
            isIgnored && 'h-term-card__badge--ignored',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-hidden
        >
          {!isTracked && <Plus size={14} strokeWidth={2} />}
          {isTracked && learningNum !== undefined && (
            <span className="h-term-card__badge-num">{learningNum}</span>
          )}
          {isKnown && <Check size={14} strokeWidth={2.5} />}
          {isIgnored && <Trash2 size={14} strokeWidth={2} />}
        </div>

        {/* Term + meaning */}
        <div className="h-term-card__text">
          <span className="h-term-card__term">{item.text}</span>
          {item.translation && (
            <span className="h-term-card__meaning">{item.translation}</span>
          )}
        </div>
      </button>

      {/* Right actions (only for untracked words) */}
      {!isTracked && (
        <>
          <div className="h-term-card__divider" aria-hidden />
          <div className="h-term-card__actions">
            <button
              type="button"
              className="h-term-card__action-btn"
              aria-label={`Ignore ${item.text}`}
              onClick={(e) => {
                e.stopPropagation();
                onMarkIgnored?.(item.id);
              }}
            >
              <Trash2 size={16} strokeWidth={2} />
            </button>
            <button
              type="button"
              className="h-term-card__action-btn"
              aria-label={`Mark ${item.text} as known`}
              onClick={(e) => {
                e.stopPropagation();
                onMarkKnown?.(item.id);
              }}
            >
              <Check size={16} strokeWidth={2.5} />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export interface HorizontalTermListProps {
  items: VocabTermItem[];
  wordStatusMap: Record<string, LingQStatusType>;
  selectedWordId?: string | null;
  onSelect: (wordId: string) => void;
  onMarkKnown?: (wordId: string) => void;
  onMarkIgnored?: (wordId: string) => void;
}

const DRAG_THRESHOLD_PX = 5;

export const HorizontalTermList: React.FC<HorizontalTermListProps> = ({
  items,
  wordStatusMap,
  selectedWordId,
  onSelect,
  onMarkKnown,
  onMarkIgnored,
}) => {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => new Set());
  const listRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ x: number; scrollLeft: number } | null>(null);
  const didDrag = useRef(false);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const el = listRef.current;
    if (!el) return;
    dragStart.current = { x: e.clientX, scrollLeft: el.scrollLeft };
    didDrag.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const start = dragStart.current;
    const el = listRef.current;
    if (!start || !el) return;
    const dx = e.clientX - start.x;
    if (Math.abs(dx) > DRAG_THRESHOLD_PX) {
      didDrag.current = true;
      el.scrollLeft = start.scrollLeft - dx;
    }
  };

  const handlePointerUp = () => {
    dragStart.current = null;
  };

  const handleMarkKnown = (wordId: string) => {
    setDismissedIds(prev => new Set([...prev, wordId]));
    onMarkKnown?.(wordId);
  };

  const handleMarkIgnored = (wordId: string) => {
    setDismissedIds(prev => new Set([...prev, wordId]));
    onMarkIgnored?.(wordId);
  };

  const visible = items.filter(item => {
    if (dismissedIds.has(item.id)) return false;
    const s = wordStatusMap[item.id];
    if (s === 'Known' || s === 'Ignored') return false;
    return true;
  });

  if (visible.length === 0) return null;

  return (
    <div
      ref={listRef}
      className="h-term-list"
      role="list"
      aria-label="Vocabulary terms"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClickCapture={e => {
        if (didDrag.current) {
          e.stopPropagation();
          didDrag.current = false;
        }
      }}
    >
      {visible.map(item => (
        <div key={item.id} role="listitem">
          <TermCard
            item={item}
            status={wordStatusMap[item.id]}
            isSelected={selectedWordId === item.id}
            onSelect={onSelect}
            onMarkKnown={handleMarkKnown}
            onMarkIgnored={handleMarkIgnored}
          />
        </div>
      ))}
    </div>
  );
};
