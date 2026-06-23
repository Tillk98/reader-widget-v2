import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { StepForward, Gauge, Timer, Repeat2, CaseSensitive, Settings, ChevronRight } from 'lucide-react';
import { Menu } from './Menu';
import { MenuItem } from './MenuItem';
import { LessonHeader } from './LessonHeader';
import lynxIcon from '../assets/lynx-default.png';
import './MediaSettingsSheet.css';

const DRAG_DISMISS_PX = 40;
const ICON_STROKE = 2;

const PLAYBACK_SPEEDS = ['0.5x', '0.75x', '1.0x', '1.25x', '1.5x', '2.0x'] as const;
const TIMER_LABELS = ['None', '5 min', '10 min', '30 min'] as const;

export interface MediaSettingsSheetProps {
  open: boolean;
  onClose: () => void;
  lessonTitle?: string;
  lessonSource?: string;
  lessonImageSrc?: string;
  /** Lesson position within course, e.g. "1/5". */
  lessonPageLabel?: string;
  /** Tapping the lesson header opens the course info sheet. */
  onLessonClick?: () => void;
  onTheme?: () => void;
  onSettings?: () => void;
  onHelp?: () => void;
  /** Fixed bottom chrome for lesson layout / LingQ (sheet + safe area). */
  onChromeHeightChange?: (heightPx: number) => void;
}

const noop = () => {};

export const MediaSettingsSheet: React.FC<MediaSettingsSheetProps> = ({
  open,
  onClose,
  lessonTitle,
  lessonSource,
  lessonImageSrc,
  lessonPageLabel = '1/5',
  onLessonClick,
  onTheme,
  onSettings,
  onHelp,
  onChromeHeightChange,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const dragY0 = useRef<number | null>(null);
  /** Tap (no real movement) on the drag bar closes; a drag gesture does not also tap-close. */
  const wasTap = useRef(true);

  const [autoAdvance, setAutoAdvance] = useState(true);
  const [playbackSpeedIndex, setPlaybackSpeedIndex] = useState(2);
  const [timerIndex, setTimerIndex] = useState(0);
  const [loopOn, setLoopOn] = useState(false);

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
    <div className="media-settings-sheet" data-media-settings-sheet aria-hidden={false}>
      <button
        type="button"
        className="media-settings-sheet__backdrop"
        aria-label="Close audio settings"
        onClick={onClose}
      />
      <div ref={panelRef} className="media-settings-sheet__panel">
        <div className="media-settings-sheet__card">
          <button
            type="button"
            className="media-settings-sheet__drag-area"
            aria-label="Tap or drag down to close"
            onPointerDown={handleDragPointerDown}
            onPointerMove={handleDragPointerMove}
            onPointerUp={handleDragPointerUp}
            onPointerCancel={handleDragPointerCancel}
            onClick={handleDragClick}
          >
            <span className="media-settings-sheet__drag-bar" />
          </button>

          {(lessonTitle || lessonImageSrc) && (
            <LessonHeader
              title={lessonTitle}
              source={lessonSource}
              pageLabel={lessonPageLabel}
              imageSrc={lessonImageSrc}
              onClick={onLessonClick}
            />
          )}

          <div className="media-settings-sheet__content">
            <Menu label="Audio Mode">
              <MenuItem
                icon={<StepForward size={16} strokeWidth={ICON_STROKE} aria-hidden />}
                label="Auto-Advance"
                info
                toggle={autoAdvance}
                onToggle={setAutoAdvance}
              />
              <MenuItem
                icon={<Gauge size={16} strokeWidth={ICON_STROKE} aria-hidden />}
                label="Playback Speed"
                value={PLAYBACK_SPEEDS[playbackSpeedIndex]}
                onClick={cyclePlaybackSpeed}
              />
              <MenuItem
                icon={<Timer size={16} strokeWidth={ICON_STROKE} aria-hidden />}
                label="Timer"
                value={TIMER_LABELS[timerIndex]}
                onClick={cycleTimer}
              />
              <MenuItem
                icon={<Repeat2 size={16} strokeWidth={ICON_STROKE} aria-hidden />}
                label="Loop Audio"
                toggle={loopOn}
                onToggle={setLoopOn}
              />
            </Menu>

            <Menu label="App">
              <MenuItem
                icon={<CaseSensitive size={16} strokeWidth={ICON_STROKE} aria-hidden />}
                label="Theme"
                onClick={onTheme ?? noop}
              />
              <MenuItem
                icon={<Settings size={16} strokeWidth={ICON_STROKE} aria-hidden />}
                label="Settings"
                onClick={onSettings ?? noop}
              />
              <MenuItem
                icon={<img src={lynxIcon} alt="" />}
                label="Help"
                onClick={onHelp ?? noop}
                trailing={
                  <span className="ui-menu-item__link">
                    Chat with Lynx
                    <ChevronRight size={14} strokeWidth={ICON_STROKE} aria-hidden />
                  </span>
                }
              />
            </Menu>
          </div>
        </div>
      </div>
    </div>
  );
};
