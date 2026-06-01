import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { StepForward, Rabbit, Timer, Repeat2, Settings, ChevronsUpDown, ChevronRight } from 'lucide-react';
import lynxIcon from '../assets/lynx-default.png';
import './AudioSettingsSheet.css';

const DRAG_DISMISS_PX = 40;
const ICON_STROKE = 2;

const PLAYBACK_SPEEDS = ['0.5x', '0.75x', '1.0x', '1.25x', '1.5x', '2.0x'] as const;
const TIMER_LABELS = ['Off', '5 min', '10 min', '30 min'] as const;
const LOOP_LABELS = ['Off', 'Lesson', 'Sentence'] as const;

export interface AudioSettingsSheetProps {
  open: boolean;
  onClose: () => void;
  lessonTitle?: string;
  lessonSource?: string;
  lessonImageSrc?: string;
  /** Lesson position within course, e.g. "1/5". */
  lessonPageLabel?: string;
  /** Tapping the lesson header opens the course info sheet. */
  onLessonClick?: () => void;
  /** Fixed bottom chrome for lesson layout / LingQ (sheet + safe area). */
  onChromeHeightChange?: (heightPx: number) => void;
}

export const AudioSettingsSheet: React.FC<AudioSettingsSheetProps> = ({
  open,
  onClose,
  lessonTitle,
  lessonSource,
  lessonImageSrc,
  lessonPageLabel = '1/5',
  onLessonClick,
  onChromeHeightChange,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const dragY0 = useRef<number | null>(null);
  /** Tap (no real movement) on the drag bar closes; a drag gesture does not also tap-close. */
  const wasTap = useRef(true);

  const [autoAdvance, setAutoAdvance] = useState(true);
  const [playbackSpeedIndex, setPlaybackSpeedIndex] = useState(2);
  const [timerIndex, setTimerIndex] = useState(0);
  const [loopIndex, setLoopIndex] = useState(0);

  useLayoutEffect(() => {
    if (!onChromeHeightChange) return;
    const el = panelRef.current;
    if (!el || !open) {
      onChromeHeightChange(0);
      return;
    }
    const emit = () => {
      const h = el.getBoundingClientRect().height;
      if (h > 0) onChromeHeightChange(h);
    };
    emit();
    const ro = new ResizeObserver(() => emit());
    ro.observe(el);
    return () => {
      ro.disconnect();
      onChromeHeightChange(0);
    };
  }, [onChromeHeightChange, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const cyclePlaybackSpeed = useCallback(() => {
    setPlaybackSpeedIndex(i => (i + 1) % PLAYBACK_SPEEDS.length);
  }, []);

  const cycleTimer = useCallback(() => {
    setTimerIndex(i => (i + 1) % TIMER_LABELS.length);
  }, []);

  const cycleLoop = useCallback(() => {
    setLoopIndex(i => (i + 1) % LOOP_LABELS.length);
  }, []);

  const handleDragPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    dragY0.current = e.clientY;
    wasTap.current = true;
    (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
  }, []);

  const handleDragPointerMove = useCallback((e: React.PointerEvent) => {
    if (dragY0.current === null) return;
    if (Math.abs(e.clientY - dragY0.current) > 6) wasTap.current = false;
  }, []);

  const handleDragPointerUp = useCallback(
    (e: React.PointerEvent) => {
      (e.currentTarget as HTMLButtonElement).releasePointerCapture?.(e.pointerId);
      if (dragY0.current === null) return;
      const dy = e.clientY - dragY0.current;
      dragY0.current = null;
      if (dy >= DRAG_DISMISS_PX) onClose();
    },
    [onClose]
  );

  const handleDragClick = useCallback(() => {
    if (wasTap.current) onClose();
  }, [onClose]);

  const handleDragPointerCancel = useCallback((e: React.PointerEvent) => {
    (e.currentTarget as HTMLButtonElement).releasePointerCapture?.(e.pointerId);
    dragY0.current = null;
  }, []);

  if (!open) return null;

  return (
    <div className="audio-settings-sheet" data-audio-settings-sheet aria-hidden={false}>
      <button
        type="button"
        className="audio-settings-sheet__backdrop"
        aria-label="Close audio settings"
        onClick={onClose}
      />
      <div ref={panelRef} className="audio-settings-sheet__panel">
        <div className="audio-settings-sheet__card">
          <button
            type="button"
            className="audio-settings-sheet__drag-area"
            aria-label="Tap or drag down to close"
            onPointerDown={handleDragPointerDown}
            onPointerMove={handleDragPointerMove}
            onPointerUp={handleDragPointerUp}
            onPointerCancel={handleDragPointerCancel}
            onClick={handleDragClick}
          >
            <span className="audio-settings-sheet__drag-bar" />
          </button>

          {(lessonTitle || lessonImageSrc) && (
            <div className="audio-settings-sheet__lesson-row">
              <button
                type="button"
                className="audio-settings-sheet__lesson"
                onClick={onLessonClick}
                aria-label="Open course details"
              >
                <div className="audio-settings-sheet__lesson-image">
                  {lessonImageSrc ? <img src={lessonImageSrc} alt="" /> : null}
                </div>
                <div className="audio-settings-sheet__lesson-meta">
                  {lessonTitle ? (
                    <p className="audio-settings-sheet__lesson-title">{lessonTitle}</p>
                  ) : null}
                  <div className="audio-settings-sheet__lesson-course">
                    {lessonSource ? (
                      <span className="audio-settings-sheet__lesson-course-name">{lessonSource}</span>
                    ) : null}
                    {lessonPageLabel ? (
                      <span className="audio-settings-sheet__lesson-page">({lessonPageLabel})</span>
                    ) : null}
                  </div>
                </div>
              </button>
            </div>
          )}

          <section className="audio-settings-sheet__section">
            <p className="audio-settings-sheet__section-header">AUDIO MODE</p>

            <div className="audio-settings-sheet__item">
              <span className="audio-settings-sheet__label audio-settings-sheet__label--stacked">
                <StepForward size={16} strokeWidth={ICON_STROKE} className="audio-settings-sheet__item-icon" aria-hidden />
                <span className="audio-settings-sheet__item-text">
                  <span className="audio-settings-sheet__item-title">Auto-Advance</span>
                  <span className="audio-settings-sheet__item-desc">Play without page/sentence breaks.</span>
                </span>
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={autoAdvance}
                aria-label="Auto-Advance"
                className={`audio-settings-sheet__toggle ${autoAdvance ? 'audio-settings-sheet__toggle--on' : ''}`}
                onClick={() => setAutoAdvance(v => !v)}
              >
                <span className="audio-settings-sheet__toggle-knob" />
              </button>
            </div>

            <button type="button" className="audio-settings-sheet__item audio-settings-sheet__item--button" onClick={cyclePlaybackSpeed}>
              <span className="audio-settings-sheet__label">
                <Rabbit size={16} strokeWidth={ICON_STROKE} className="audio-settings-sheet__item-icon" aria-hidden />
                <span className="audio-settings-sheet__item-title">Playback Speed</span>
              </span>
              <span className="audio-settings-sheet__value">{PLAYBACK_SPEEDS[playbackSpeedIndex]}</span>
            </button>

            <button type="button" className="audio-settings-sheet__item audio-settings-sheet__item--button" onClick={cycleTimer}>
              <span className="audio-settings-sheet__label">
                <Timer size={16} strokeWidth={ICON_STROKE} className="audio-settings-sheet__item-icon" aria-hidden />
                <span className="audio-settings-sheet__item-title">Timer</span>
              </span>
              <span className="audio-settings-sheet__value">{TIMER_LABELS[timerIndex]}</span>
            </button>

            <button type="button" className="audio-settings-sheet__item audio-settings-sheet__item--button" onClick={cycleLoop}>
              <span className="audio-settings-sheet__label">
                <Repeat2 size={16} strokeWidth={ICON_STROKE} className="audio-settings-sheet__item-icon" aria-hidden />
                <span className="audio-settings-sheet__item-title">Loop Audio</span>
              </span>
              <span className="audio-settings-sheet__value audio-settings-sheet__value--select">
                {LOOP_LABELS[loopIndex]}
                <ChevronsUpDown size={16} strokeWidth={ICON_STROKE} aria-hidden />
              </span>
            </button>
          </section>

          <div className="audio-settings-sheet__divider" aria-hidden />

          <section className="audio-settings-sheet__section">
            <p className="audio-settings-sheet__section-header">APP</p>

            <button type="button" className="audio-settings-sheet__item audio-settings-sheet__item--button">
              <span className="audio-settings-sheet__label">
                <Settings size={16} strokeWidth={ICON_STROKE} className="audio-settings-sheet__item-icon" aria-hidden />
                <span className="audio-settings-sheet__item-title">Settings</span>
              </span>
            </button>

            <button type="button" className="audio-settings-sheet__item audio-settings-sheet__item--button">
              <span className="audio-settings-sheet__label">
                <img src={lynxIcon} alt="" className="audio-settings-sheet__item-icon audio-settings-sheet__item-icon--img" aria-hidden />
                <span className="audio-settings-sheet__item-title">Help</span>
              </span>
              <span className="audio-settings-sheet__value audio-settings-sheet__value--select">
                Chat with Lynx
                <ChevronRight size={16} strokeWidth={ICON_STROKE} aria-hidden />
              </span>
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};
