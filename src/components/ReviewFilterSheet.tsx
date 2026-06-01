import React, { useEffect, useRef, useState } from 'react';
import { EyeOff, CirclePlus, CircleCheck, Info } from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import './ReviewFilterSheet.css';

export type ReviewMethod = 'list' | 'cards';
export type ReviewScope = 'lesson' | 'page' | 'sentence';
export type ReviewStatusKey = 'ignored' | 'untracked' | '1' | '2' | '3' | '4' | 'known';

/** Status segments, left → right, as shown in the Review filter status bar (Figma 3771:6813). */
export const REVIEW_STATUS_SEGMENTS: ReviewStatusKey[] = [
  'ignored',
  'untracked',
  '1',
  '2',
  '3',
  '4',
  'known',
];

/** Default filter: new ("+") through status 4, excluding ignored and known. */
export const DEFAULT_REVIEW_STATUS: ReviewStatusKey[] = ['untracked', '1', '2', '3', '4'];

export interface ReviewFilterValue {
  method: ReviewMethod;
  scope: ReviewScope;
  status: ReviewStatusKey[];
}

export interface ReviewFilterSheetProps {
  open: boolean;
  onClose: () => void;
  value: ReviewFilterValue;
  onApply: (next: ReviewFilterValue) => void;
}

const SCOPE_OPTIONS: { id: ReviewScope; label: string }[] = [
  { id: 'lesson', label: 'Lesson' },
  { id: 'page', label: 'Page' },
  { id: 'sentence', label: 'Sentence' },
];

const METHOD_OPTIONS: { id: ReviewMethod; label: string }[] = [
  { id: 'list', label: 'List' },
  { id: 'cards', label: 'Cards' },
];

/** Compute the next selection from a tap or drag-range gesture over the status bar. */
function computeNextSelection(
  current: Set<ReviewStatusKey>,
  firstTouch: boolean,
  a: number,
  b: number,
  isTap: boolean
): Set<ReviewStatusKey> {
  if (isTap) {
    const key = REVIEW_STATUS_SEGMENTS[a];
    // First tap after opening isolates to just that status.
    if (firstTouch) return new Set([key]);
    const next = new Set(current);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    return next;
  }
  const range = REVIEW_STATUS_SEGMENTS.slice(a, b + 1);
  if (firstTouch) return new Set(range);
  const next = new Set(current);
  range.forEach(k => next.add(k));
  return next;
}

/** Contiguous runs of selected segments, for drawing the rounded highlight pills. */
function selectionRuns(selection: Set<ReviewStatusKey>): [number, number][] {
  const runs: [number, number][] = [];
  let start = -1;
  for (let i = 0; i <= REVIEW_STATUS_SEGMENTS.length; i++) {
    const selected = i < REVIEW_STATUS_SEGMENTS.length && selection.has(REVIEW_STATUS_SEGMENTS[i]);
    if (selected && start === -1) start = i;
    if (!selected && start !== -1) {
      runs.push([start, i - 1]);
      start = -1;
    }
  }
  return runs;
}

interface StatusRangeBarProps {
  value: Set<ReviewStatusKey>;
  onChange: (next: Set<ReviewStatusKey>) => void;
}

/** Tap-to-toggle / drag-to-range LingQ status selector (Figma 3771:6813). */
const StatusRangeBar: React.FC<StatusRangeBarProps> = ({ value, onChange }) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const firstTouch = useRef(true);
  const [drag, setDrag] = useState<{ start: number; cur: number } | null>(null);

  const idxFromX = (clientX: number): number => {
    const el = rowRef.current;
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    const x = Math.min(Math.max(clientX - r.left, 0), r.width - 0.001);
    const n = REVIEW_STATUS_SEGMENTS.length;
    return Math.min(Math.max(Math.floor((x / r.width) * n), 0), n - 1);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    const i = idxFromX(e.clientX);
    setDrag({ start: i, cur: i });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!drag) return;
    const i = idxFromX(e.clientX);
    if (i !== drag.cur) setDrag({ start: drag.start, cur: i });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    if (!drag) return;
    const a = Math.min(drag.start, drag.cur);
    const b = Math.max(drag.start, drag.cur);
    const next = computeNextSelection(value, firstTouch.current, a, b, drag.start === drag.cur);
    firstTouch.current = false;
    setDrag(null);
    onChange(next);
  };

  // Live preview of the range while dragging across multiple segments.
  const effective = (() => {
    if (!drag) return value;
    const a = Math.min(drag.start, drag.cur);
    const b = Math.max(drag.start, drag.cur);
    if (a === b) return value;
    return computeNextSelection(value, firstTouch.current, a, b, false);
  })();

  const runs = selectionRuns(effective);
  const n = REVIEW_STATUS_SEGMENTS.length;

  return (
    <div className="review-filter__status-bar">
      <div className="review-filter__status-highlights" aria-hidden>
        {runs.map(([a, b]) => (
          <span
            key={`${a}-${b}`}
            className="review-filter__status-highlight"
            style={{ left: `${(a / n) * 100}%`, width: `${((b - a + 1) / n) * 100}%` }}
          />
        ))}
      </div>
      <div
        ref={rowRef}
        className="review-filter__status-row"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {REVIEW_STATUS_SEGMENTS.map(key => {
          const selected = effective.has(key);
          return (
            <div
              key={key}
              className={[
                'review-filter__status-seg',
                selected && 'review-filter__status-seg--selected',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {key === 'ignored' ? (
                <EyeOff size={20} strokeWidth={2} />
              ) : key === 'untracked' ? (
                <CirclePlus size={20} strokeWidth={2} />
              ) : key === 'known' ? (
                <CircleCheck size={20} strokeWidth={2} />
              ) : (
                <span className="review-filter__status-num">{key}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ReviewFilterSheet: React.FC<ReviewFilterSheetProps> = ({
  open,
  onClose,
  value,
  onApply,
}) => {
  const [method, setMethod] = useState<ReviewMethod>(value.method);
  const [scope, setScope] = useState<ReviewScope>(value.scope);
  const [status, setStatus] = useState<Set<ReviewStatusKey>>(new Set(value.status));

  // Re-seed the pending selection from the applied filter each time the sheet opens.
  useEffect(() => {
    if (open) {
      setMethod(value.method);
      setScope(value.scope);
      setStatus(new Set(value.status));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleUpdate = () => {
    onApply({
      method,
      scope,
      status: REVIEW_STATUS_SEGMENTS.filter(k => status.has(k)),
    });
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} ariaLabel="Review filter">
      <div className="review-filter">
        <section className="review-filter__section">
          <p className="review-filter__section-header">Review Method</p>
          <div className="review-filter__segmented" role="tablist" aria-label="Review method">
            {METHOD_OPTIONS.map(opt => (
              <button
                key={opt.id}
                type="button"
                role="tab"
                aria-selected={method === opt.id}
                className={[
                  'review-filter__segment',
                  method === opt.id && 'review-filter__segment--active',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => setMethod(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        <section className="review-filter__section">
          <p className="review-filter__section-header">Scope</p>
          <div className="review-filter__segmented" role="tablist" aria-label="Scope">
            {SCOPE_OPTIONS.map(opt => (
              <button
                key={opt.id}
                type="button"
                role="tab"
                aria-selected={scope === opt.id}
                className={[
                  'review-filter__segment',
                  scope === opt.id && 'review-filter__segment--active',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => setScope(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        <section className="review-filter__section">
          <p className="review-filter__section-header review-filter__section-header--with-info">
            Status
            <Info size={12} strokeWidth={2} className="review-filter__info" aria-hidden />
          </p>
          <StatusRangeBar value={status} onChange={setStatus} />
        </section>

        <div className="review-filter__divider" role="separator" aria-hidden="true" />

        <div className="review-filter__actions">
          <button type="button" className="review-filter__btn review-filter__btn--cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="review-filter__btn review-filter__btn--update" onClick={handleUpdate}>
            Update
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};
