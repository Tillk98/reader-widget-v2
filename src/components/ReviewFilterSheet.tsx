import React from 'react';
import { EyeOff, Check } from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import './ReviewFilterSheet.css';

export type ReviewMethod = 'list' | 'cards';
export type ReviewScope = 'lesson' | 'page' | 'sentence';
export type ReviewStatusKey = 'ignored' | 'untracked' | '1' | '2' | '3' | '4' | 'known';

/** Status range-bar segments, left → right (Figma 4089:63471). */
export const REVIEW_STATUS_SEGMENTS: ReviewStatusKey[] = ['ignored', '1', '2', '3', '4', 'known'];

/** Default filter: the learning levels 1–4. */
export const DEFAULT_REVIEW_STATUS: ReviewStatusKey[] = ['1', '2', '3', '4'];

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
  lessonTitle?: string;
  lessonSource?: string;
  lessonImageSrc?: string;
  /** Lesson position within course, e.g. "1/5". */
  lessonPageLabel?: string;
  onLessonClick?: () => void;
}

const METHOD_OPTIONS: { id: ReviewMethod; label: string }[] = [
  { id: 'list', label: 'List' },
  { id: 'cards', label: 'Cards' },
];

const SCOPE_OPTIONS: { id: ReviewScope; label: string }[] = [
  { id: 'lesson', label: 'Lesson' },
  { id: 'page', label: 'Page' },
  { id: 'sentence', label: 'Sentence' },
];

const STATUS_LABELS: Record<ReviewStatusKey, string> = {
  ignored: 'Ignored',
  untracked: 'Untracked',
  '1': 'New',
  '2': 'Recognized',
  '3': 'Familiar',
  '4': 'Learned',
  known: 'Known',
};

/** Segmented control (Figma Toggle 4089:63337). */
function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
  ariaLabel: string;
}) {
  return (
    <div className="review-filter__toggle" role="tablist" aria-label={ariaLabel}>
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          role="tab"
          aria-selected={value === opt.id}
          className={`review-filter__toggle-option${value === opt.id ? ' review-filter__toggle-option--active' : ''}`}
          onClick={() => onChange(opt.id)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/** Contiguous runs of selected segments, drawn as combined rounded pills behind the row. */
function selectionRuns(selected: Set<ReviewStatusKey>): [number, number][] {
  const runs: [number, number][] = [];
  let start = -1;
  for (let i = 0; i <= REVIEW_STATUS_SEGMENTS.length; i++) {
    const isSel = i < REVIEW_STATUS_SEGMENTS.length && selected.has(REVIEW_STATUS_SEGMENTS[i]);
    if (isSel && start === -1) start = i;
    if (!isSel && start !== -1) {
      runs.push([start, i - 1]);
      start = -1;
    }
  }
  return runs;
}

/**
 * Status range bar (Figma 4089:63471). Tap a status to add it; tapping it again removes it.
 * Adjacent selected statuses merge into one combined pill; non-adjacent ones (e.g. 1 and 4)
 * stay highlighted individually at either end.
 */
function StatusRangeBar({
  value,
  onChange,
}: {
  value: ReviewStatusKey[];
  onChange: (next: ReviewStatusKey[]) => void;
}) {
  const selected = new Set(value);
  const n = REVIEW_STATUS_SEGMENTS.length;
  const runs = selectionRuns(selected);

  const toggle = (key: ReviewStatusKey) => {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange(REVIEW_STATUS_SEGMENTS.filter((k) => next.has(k)));
  };

  return (
    <div className="review-filter__status">
      <div className="review-filter__status-bar">
        <div className="review-filter__status-track">
          <div className="review-filter__status-highlights" aria-hidden>
            {runs.map(([a, b]) => (
              <span
                key={`${a}-${b}`}
                className="review-filter__status-pill"
                style={{ left: `${(a / n) * 100}%`, width: `${((b - a + 1) / n) * 100}%` }}
              />
            ))}
          </div>
          {REVIEW_STATUS_SEGMENTS.map((key) => {
            const isSel = selected.has(key);
            return (
              <button
                key={key}
                type="button"
                className={`review-filter__status-seg${isSel ? ' review-filter__status-seg--selected' : ''}`}
                onClick={() => toggle(key)}
                aria-pressed={isSel}
                aria-label={STATUS_LABELS[key]}
              >
                {key === 'ignored' ? (
                  <EyeOff size={18} strokeWidth={2} aria-hidden />
                ) : key === 'known' ? (
                  <Check size={18} strokeWidth={2} aria-hidden />
                ) : (
                  <span className="review-filter__status-num">{key}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export const ReviewFilterSheet: React.FC<ReviewFilterSheetProps> = ({
  open,
  onClose,
  value,
  onApply,
}) => {
  return (
    <BottomSheet open={open} onClose={onClose} ariaLabel="Review filter" className="review-filter-sheet">
      <div className="review-filter">
        <section className="review-filter__section">
          <div className="review-filter__section-header">
            <span className="review-filter__section-label">REVIEW METHOD</span>
          </div>
          <Segmented
            ariaLabel="Review method"
            options={METHOD_OPTIONS}
            value={value.method}
            onChange={(method) => onApply({ ...value, method })}
          />
        </section>

        <section className="review-filter__section">
          <div className="review-filter__section-header">
            <span className="review-filter__section-label">SCOPE</span>
          </div>
          <Segmented
            ariaLabel="Scope"
            options={SCOPE_OPTIONS}
            value={value.scope}
            onChange={(scope) => onApply({ ...value, scope })}
          />
        </section>

        <section className="review-filter__section">
          <div className="review-filter__section-header">
            <span className="review-filter__section-label">STATUS</span>
          </div>
          <StatusRangeBar value={value.status} onChange={(status) => onApply({ ...value, status })} />
        </section>
      </div>
    </BottomSheet>
  );
};
