import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Moon, Play, Repeat2 } from 'lucide-react';
import './AudioSettingsSheet.css';

const DRAG_DISMISS_PX = 40;

const PLAYBACK_SPEEDS = ['0.75x', '1x', '1.25x', '1.5x', '2x'] as const;
const SLEEP_TIMER_LABELS = ['Off', '5 min', '10 min', '30 min'] as const;
export type RepeatMode = 'off' | 'lesson' | 'sentence';

export interface AudioSettingsSheetProps {
  open: boolean;
  onClose: () => void;
  /** Fixed bottom chrome for lesson layout / LingQ (sheet + safe area). */
  onChromeHeightChange?: (heightPx: number) => void;
}

export const AudioSettingsSheet: React.FC<AudioSettingsSheetProps> = ({
  open,
  onClose,
  onChromeHeightChange,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const dragY0 = useRef<number | null>(null);

  const [playbackSpeedIndex, setPlaybackSpeedIndex] = useState(1);
  const [sleepTimerIndex, setSleepTimerIndex] = useState(0);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');

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

  const cycleSleepTimer = useCallback(() => {
    setSleepTimerIndex(i => (i + 1) % SLEEP_TIMER_LABELS.length);
  }, []);

  const handleDragPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    dragY0.current = e.clientY;
    (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
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
            aria-label="Drag down to close"
            onPointerDown={handleDragPointerDown}
            onPointerUp={handleDragPointerUp}
            onPointerCancel={handleDragPointerCancel}
          >
            <span className="audio-settings-sheet__drag-bar" />
          </button>

          <div className="audio-settings-sheet__header">
            <h2 className="audio-settings-sheet__title">Audio</h2>
          </div>

          <div className="audio-settings-sheet__content">
            <button
              type="button"
              className="audio-settings-sheet__row"
              onClick={cyclePlaybackSpeed}
            >
              <span className="audio-settings-sheet__label">
                <Play className="audio-settings-sheet__row-icon" size={16} strokeWidth={2} aria-hidden />
                Playback Speed
              </span>
              <span className="audio-settings-sheet__value">{PLAYBACK_SPEEDS[playbackSpeedIndex]}</span>
            </button>

            <button type="button" className="audio-settings-sheet__row" onClick={cycleSleepTimer}>
              <span className="audio-settings-sheet__label">
                <Moon className="audio-settings-sheet__row-icon" size={16} strokeWidth={2} aria-hidden />
                Sleep Timer
              </span>
              <span className="audio-settings-sheet__value">{SLEEP_TIMER_LABELS[sleepTimerIndex]}</span>
            </button>

            <div className="audio-settings-sheet__row audio-settings-sheet__row--repeat">
              <span className="audio-settings-sheet__label">
                <Repeat2 className="audio-settings-sheet__row-icon" size={16} strokeWidth={2} aria-hidden />
                Repeat
              </span>
              <div
                className="audio-settings-sheet__segments"
                role="group"
                aria-label="Repeat mode"
              >
                {(
                  [
                    { id: 'off' as const, label: 'Off' },
                    { id: 'lesson' as const, label: 'Lesson' },
                    { id: 'sentence' as const, label: 'Sentence' },
                  ] as const
                ).map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    className={
                      repeatMode === id
                        ? 'audio-settings-sheet__segment audio-settings-sheet__segment--active'
                        : 'audio-settings-sheet__segment'
                    }
                    onClick={() => setRepeatMode(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
