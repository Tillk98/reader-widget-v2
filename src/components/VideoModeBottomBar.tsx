import React, { useCallback, useRef, useLayoutEffect } from 'react';
import { Pause, Play } from 'lucide-react';
import playerBack from '../assets/player-back.png';
import playerForward from '../assets/player-forward.png';
import playerRepeat from '../assets/player-repeat.png';
import './VideoModeBottomBar.css';

const DRAG_THRESHOLD_PX = 40;

export interface VideoModeBottomBarProps {
  /** Reports total fixed chrome height so the word-selection strip can sit above this bar. */
  onChromeHeightChange?: (heightPx: number) => void;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  lessonTitle: string;
  lessonSource?: string;
  lessonImageSrc: string;
  isPaused: boolean;
  onTogglePause: () => void;
  /** 0–1 playback position (stub until real media engine). */
  playbackProgress?: number;
  onSkipBack?: () => void;
  onSkipForward?: () => void;
  onRepeat?: () => void;
  onCyclePlaybackSpeed?: () => void;
  playbackSpeedLabel?: string;
  /** Collapsed only: drag down past threshold to leave video mode and return to default reader. */
  onExitVideoMode?: () => void;
  /** When View Transitions API is unavailable, slide the bar up with CSS instead. */
  fallbackSlideIn?: boolean;
}

export const VideoModeBottomBar: React.FC<VideoModeBottomBarProps> = ({
  onChromeHeightChange,
  expanded,
  onExpandedChange,
  lessonTitle,
  lessonSource,
  lessonImageSrc,
  isPaused,
  onTogglePause,
  playbackProgress = 0.08,
  onSkipBack,
  onSkipForward,
  onRepeat,
  onCyclePlaybackSpeed,
  playbackSpeedLabel = '1x',
  onExitVideoMode,
  fallbackSlideIn = false,
}) => {
  const dragStartY = useRef<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!onChromeHeightChange) return;
    const el = rootRef.current;
    if (!el) return;
    const emit = () => {
      const h = el.getBoundingClientRect().height;
      if (h > 0) onChromeHeightChange(h);
    };
    emit();
    const ro = new ResizeObserver(() => emit());
    ro.observe(el);
    return () => ro.disconnect();
  }, [onChromeHeightChange, expanded, lessonTitle, lessonSource]);

  const handleDragPointerDown = useCallback((e: React.PointerEvent) => {
    dragStartY.current = e.clientY;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const handleDragPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (dragStartY.current === null) {
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
        return;
      }
      const deltaY = e.clientY - dragStartY.current;
      if (expanded) {
        if (deltaY >= DRAG_THRESHOLD_PX) {
          onExpandedChange(false);
        }
      } else if (deltaY >= DRAG_THRESHOLD_PX) {
        onExitVideoMode?.();
      } else if (deltaY <= -DRAG_THRESHOLD_PX) {
        onExpandedChange(true);
      } else if (Math.abs(deltaY) < DRAG_THRESHOLD_PX) {
        onExpandedChange(!expanded);
      }
      dragStartY.current = null;
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    },
    [expanded, onExpandedChange, onExitVideoMode]
  );

  const handleDragPointerCancel = useCallback((e: React.PointerEvent) => {
    dragStartY.current = null;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  }, []);

  const progressPct = Math.min(100, Math.max(0, playbackProgress * 100));

  return (
    <div
      ref={rootRef}
      className={[
        'video-mode-bottom-bar',
        expanded ? 'video-mode-bottom-bar--expanded' : 'video-mode-bottom-bar--collapsed',
        fallbackSlideIn && 'video-mode-bottom-bar--fallback-slide-in',
      ]
        .filter(Boolean)
        .join(' ')}
      data-video-mode-bar
    >
      <div className="video-mode-bottom-bar__inner">
        <button
          type="button"
          className="video-mode-bottom-bar__drag"
          aria-label={
            expanded
              ? 'Collapse player or drag down'
              : 'Drag up to expand, drag down to close video mode'
          }
          onPointerDown={handleDragPointerDown}
          onPointerUp={handleDragPointerUp}
          onPointerCancel={handleDragPointerCancel}
        >
          <span className="video-mode-bottom-bar__drag-bar" />
        </button>

        {expanded && (
          <>
            <div className="video-mode-bottom-bar__scrubber">
              <div className="video-mode-bottom-bar__scrubber-track">
                <div
                  className="video-mode-bottom-bar__scrubber-fill"
                  style={{ width: `${progressPct}%` }}
                />
                <div
                  className="video-mode-bottom-bar__scrubber-thumb"
                  style={{ left: `${progressPct}%` }}
                />
              </div>
            </div>

            <div className="video-mode-bottom-bar__transport-primary" role="group" aria-label="Playback">
              <button
                type="button"
                className="video-mode-bottom-bar__round-btn video-mode-bottom-bar__round-btn--sm"
                aria-label="Skip back 5 seconds"
                onClick={() => onSkipBack?.()}
              >
                <img src={playerBack} alt="" width={20} height={20} />
              </button>
              <button
                type="button"
                className="video-mode-bottom-bar__round-btn video-mode-bottom-bar__round-btn--lg"
                aria-label={isPaused ? 'Play' : 'Pause'}
                onClick={onTogglePause}
              >
                {isPaused ? <Play size={24} /> : <Pause size={24} />}
              </button>
              <button
                type="button"
                className="video-mode-bottom-bar__round-btn video-mode-bottom-bar__round-btn--sm"
                aria-label="Skip forward 5 seconds"
                onClick={() => onSkipForward?.()}
              >
                <img src={playerForward} alt="" width={20} height={20} />
              </button>
            </div>
          </>
        )}

        <div className="video-mode-bottom-bar__footer">
          <div className="video-mode-bottom-bar__meta">
            <div className="video-mode-bottom-bar__thumb-wrap">
              <img src={lessonImageSrc} alt="" className="video-mode-bottom-bar__thumb" />
            </div>
            <div className="video-mode-bottom-bar__titles">
              <p className="video-mode-bottom-bar__title">{lessonTitle}</p>
              {lessonSource ? <p className="video-mode-bottom-bar__source">{lessonSource}</p> : null}
            </div>
          </div>

          {expanded ? (
            <div className="video-mode-bottom-bar__secondary-controls" role="group" aria-label="More controls">
              <button
                type="button"
                className="video-mode-bottom-bar__round-btn video-mode-bottom-bar__round-btn--sm"
                aria-label="Repeat"
                onClick={() => onRepeat?.()}
              >
                <img src={playerRepeat} alt="" width={20} height={20} />
              </button>
              <button
                type="button"
                className="video-mode-bottom-bar__speed-btn"
                aria-label="Playback speed"
                onClick={() => onCyclePlaybackSpeed?.()}
              >
                {playbackSpeedLabel}
              </button>
            </div>
          ) : (
            <div className="video-mode-bottom-bar__collapsed-controls" role="group" aria-label="Playback">
              <button
                type="button"
                className="video-mode-bottom-bar__round-btn video-mode-bottom-bar__round-btn--sm"
                aria-label="Skip back 5 seconds"
                onClick={() => onSkipBack?.()}
              >
                <img src={playerBack} alt="" width={19} height={19} />
              </button>
              <button
                type="button"
                className="video-mode-bottom-bar__round-btn video-mode-bottom-bar__round-btn--lg"
                aria-label={isPaused ? 'Play' : 'Pause'}
                onClick={onTogglePause}
              >
                {isPaused ? <Play size={24} /> : <Pause size={24} />}
              </button>
            </div>
          )}
        </div>

        {!expanded && (
          <div className="video-mode-bottom-bar__progress-edge" aria-hidden="true">
            <div className="video-mode-bottom-bar__progress-track-edge">
              <div
                className="video-mode-bottom-bar__progress-fill-edge"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
