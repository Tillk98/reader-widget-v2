import React, { useCallback, useRef, useState } from 'react';
import { Check, EyeOff } from 'lucide-react';
import './LingQStatusBar.css';

export type LingQStatusType =
  | 'New'
  | 'Recognized'
  | 'Familiar'
  | 'Learned'
  | 'Known'
  | 'Ignored';

const LEARNING_STATUSES: LingQStatusType[] = ['New', 'Recognized', 'Familiar', 'Learned'];

/** Sheet row: Ignored | 1–4 | Known (Figma 2181:47905) */
const SHEET_SEGMENT_ORDER: LingQStatusType[] = [
  'Ignored',
  'New',
  'Recognized',
  'Familiar',
  'Learned',
  'Known',
];

const SHEET_PAD_PX = 4;
const DRAG_THRESHOLD_PX = 6;

const LEARNING_LABELS: Record<LingQStatusType, string> = {
  New: 'New',
  Recognized: 'Recognized',
  Familiar: 'Familiar',
  Learned: 'Learned',
  Known: 'Known',
  Ignored: 'Ignored',
};
const LEARNING_NUMBERS: Record<LingQStatusType, string> = {
  New: '1',
  Recognized: '2',
  Familiar: '3',
  Learned: '4',
  Known: '',
  Ignored: '',
};

function segmentIndexFromStatus(status: LingQStatusType): number {
  const i = SHEET_SEGMENT_ORDER.indexOf(status);
  return i >= 0 ? i : 1;
}

function highlightToneForIndex(index: number): 'ignored' | 'learning' | 'known' {
  if (index === 0) return 'ignored';
  if (index === 5) return 'known';
  return 'learning';
}

interface LingQStatusBarProps {
  status: LingQStatusType;
  onStatusChange: (status: LingQStatusType) => void;
  /** When true, only the learning statuses (1–4) are shown; Ignored and Known are hidden. Used in bottom bar expanded state. */
  learningOnly?: boolean;
  /** Word detail bottom sheet: full-width Ignored | 1–4 | Known bar (Figma 2181:47905). */
  variant?: 'default' | 'sheet';
}

export const LingQStatusBar: React.FC<LingQStatusBarProps> = ({
  status,
  onStatusChange,
  learningOnly = false,
  variant = 'default',
}) => {
  const isKnown = status === 'Known';
  const isIgnored = status === 'Ignored';

  const trackRef = useRef<HTMLDivElement>(null);
  const dragStartXRef = useRef<number | null>(null);
  const didDragRef = useRef(false);
  const dragPointerIdRef = useRef<number | null>(null);
  const [dragPreviewIndex, setDragPreviewIndex] = useState<number | null>(null);

  const indexFromClientX = useCallback((clientX: number) => {
    const el = trackRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const innerW = rect.width - 2 * SHEET_PAD_PX;
    if (innerW <= 0) return 0;
    const x = clientX - rect.left - SHEET_PAD_PX;
    const segW = innerW / SHEET_SEGMENT_ORDER.length;
    return Math.max(
      0,
      Math.min(SHEET_SEGMENT_ORDER.length - 1, Math.floor(x / segW))
    );
  }, []);

  const statusIndex = segmentIndexFromStatus(status);
  const displayIndex = dragPreviewIndex ?? statusIndex;
  const highlightTone = highlightToneForIndex(displayIndex);

  /** Window-level drag tracking — avoids `setPointerCapture` on the track, which blocks button `click`. */
  const handleTrackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    dragStartXRef.current = e.clientX;
    didDragRef.current = false;
    dragPointerIdRef.current = e.pointerId;

    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== dragPointerIdRef.current) return;
      if (dragStartXRef.current === null) return;
      if (Math.abs(ev.clientX - dragStartXRef.current) > DRAG_THRESHOLD_PX) {
        didDragRef.current = true;
        setDragPreviewIndex(indexFromClientX(ev.clientX));
      }
    };

    const onUp = (ev: PointerEvent) => {
      if (ev.pointerId !== dragPointerIdRef.current) return;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);

      if (didDragRef.current) {
        onStatusChange(SHEET_SEGMENT_ORDER[indexFromClientX(ev.clientX)]);
      }

      dragPointerIdRef.current = null;
      dragStartXRef.current = null;
      didDragRef.current = false;
      setDragPreviewIndex(null);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  if (variant === 'sheet') {
    return (
      <div className="lingq-status-bar lingq-status-bar--sheet" role="group" aria-label="Word status">
        <div
          ref={trackRef}
          className="lingq-status-bar__sheet-track"
          style={
            {
              '--segment-index': displayIndex,
            } as React.CSSProperties
          }
          onPointerDown={handleTrackPointerDown}
        >
          <div
            className={`lingq-status-bar__sheet-highlight lingq-status-bar__sheet-highlight--${highlightTone}`}
            aria-hidden
          />
          {SHEET_SEGMENT_ORDER.map((seg, i) => {
            const active = displayIndex === i;
            const isLearning = LEARNING_STATUSES.includes(seg);
            return (
              <button
                key={seg}
                type="button"
                className={`lingq-status-bar__sheet-segment ${active ? 'lingq-status-bar__sheet-segment--active' : ''} ${isLearning ? 'lingq-status-bar__sheet-segment--learning' : ''} ${seg === 'Ignored' ? 'lingq-status-bar__sheet-segment--ignored' : ''} ${seg === 'Known' ? 'lingq-status-bar__sheet-segment--known' : ''}`}
                onClick={() => onStatusChange(seg)}
                aria-pressed={status === seg}
                aria-label={LEARNING_LABELS[seg]}
              >
                {seg === 'Ignored' ? (
                  <EyeOff size={20} aria-hidden />
                ) : seg === 'Known' ? (
                  <Check size={20} aria-hidden />
                ) : (
                  <span>{LEARNING_NUMBERS[seg]}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="lingq-status-bar" role="group" aria-label="Word status">
      <div className="lingq-status-bar__active-group">
        {LEARNING_STATUSES.map((s) => {
          const active = status === s;
          const showLabel = active;
          return (
            <button
              key={s}
              type="button"
              className={`lingq-status-chip lingq-status-chip--learning ${active ? 'lingq-status-chip--active' : ''}`}
              onClick={() => onStatusChange(s)}
              aria-pressed={active}
              aria-label={LEARNING_LABELS[s]}
            >
              <span className="lingq-status-chip__number">{LEARNING_NUMBERS[s]}</span>
              {showLabel && (
                <span className="lingq-status-chip__label">{LEARNING_LABELS[s]}</span>
              )}
            </button>
          );
        })}
      </div>
      {!learningOnly && (
        <div className="lingq-status-bar__inactive-group">
          <button
            type="button"
            className={`lingq-status-chip lingq-status-chip--ignored ${isIgnored ? 'lingq-status-chip--active' : ''}`}
            onClick={() => onStatusChange('Ignored')}
            aria-pressed={isIgnored}
            aria-label="Ignored"
          >
            <EyeOff size={14} aria-hidden />
            {isIgnored && (
              <span className="lingq-status-chip__label">Ignored</span>
            )}
          </button>
          <button
            type="button"
            className={`lingq-status-chip lingq-status-chip--known ${isKnown ? 'lingq-status-chip--active' : ''}`}
            onClick={() => onStatusChange('Known')}
            aria-pressed={isKnown}
            aria-label="Known"
          >
            <Check size={14} aria-hidden />
            {isKnown && (
              <span className="lingq-status-chip__label">Known</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
