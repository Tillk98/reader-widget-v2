import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Maximize2, Pause, Play } from 'lucide-react';
import './VideoModeVideoPlayer.css';

export interface VideoModeVideoPlayerProps {
  lessonTitle: string;
  lessonSource?: string;
  lessonImageSrc: string;
  thumbnailSrc: string;
  /** 0–1 for progress bar fill */
  playbackProgress?: number;
  isPaused: boolean;
  onTogglePause: () => void;
  onMaximize?: () => void;
  /** Reports total height of the fixed top slot (incl. safe area padding) for reader-content offset */
  onSlotHeightChange?: (heightPx: number) => void;
}

function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

export const VideoModeVideoPlayer: React.FC<VideoModeVideoPlayerProps> = ({
  lessonTitle,
  lessonSource,
  lessonImageSrc,
  thumbnailSrc,
  playbackProgress = 0.08,
  isPaused,
  onTogglePause,
  onMaximize,
  onSlotHeightChange,
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const [controlsVisible, setControlsVisible] = useState(false);

  useLayoutEffect(() => {
    if (!onSlotHeightChange) return;
    const el = rootRef.current;
    if (!el) return;
    const emit = () => {
      const h = el.getBoundingClientRect().height;
      if (h > 0) onSlotHeightChange(h);
    };
    emit();
    const ro = new ResizeObserver(() => emit());
    ro.observe(el);
    return () => ro.disconnect();
  }, [onSlotHeightChange]);

  const handleOpenControls = useCallback(() => {
    setControlsVisible(true);
  }, []);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setControlsVisible(false);
    }
  }, []);

  const progressPct = Math.min(100, Math.max(0, playbackProgress * 100));

  const durationSec = 12 * 60 + 45;
  const positionSec = durationSec * playbackProgress;
  const timeLabel = `${formatClock(positionSec)} / ${formatClock(durationSec)}`;

  return (
    <div ref={rootRef} className="video-mode-player-slot">
      <div className="video-mode-player-slot__inner">
        {!controlsVisible ? (
          <button
            type="button"
            className="video-mode-player video-mode-player--default"
            onClick={handleOpenControls}
            aria-label="Show video controls"
          >
            <div className="video-mode-player__blur" aria-hidden>
              <img src={thumbnailSrc} alt="" className="video-mode-player__blur-img" />
            </div>
            <div className="video-mode-player__thumb-wrap" aria-hidden>
              <img src={thumbnailSrc} alt="" className="video-mode-player__thumb" />
            </div>
          </button>
        ) : (
          <div className="video-mode-player video-mode-player--pressed">
            <div className="video-mode-player__blur" aria-hidden>
              <img src={thumbnailSrc} alt="" className="video-mode-player__blur-img" />
            </div>
            <div className="video-mode-player__thumb-wrap" aria-hidden>
              <img src={thumbnailSrc} alt="" className="video-mode-player__thumb" />
            </div>
            <div
              className="video-mode-player__overlay-backdrop"
              onClick={handleBackdropClick}
              role="presentation"
            />
            <div className="video-mode-player__ui">
              <div className="video-mode-player__header">
                <div className="video-mode-player__source">
                  <div className="video-mode-player__lesson-avatar">
                    <img src={lessonImageSrc} alt="" />
                  </div>
                  <div className="video-mode-player__lesson-text">
                    <p className="video-mode-player__lesson-title">{lessonTitle}</p>
                    {lessonSource ? (
                      <p className="video-mode-player__lesson-sub">{lessonSource}</p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="video-mode-player__center">
                <button
                  type="button"
                  className="video-mode-player__play-fab"
                  aria-label={isPaused ? 'Play' : 'Pause'}
                  onClick={e => {
                    e.stopPropagation();
                    onTogglePause();
                  }}
                >
                  {isPaused ? <Play size={24} strokeWidth={2} /> : <Pause size={24} strokeWidth={2} />}
                </button>
              </div>

              <div className="video-mode-player__footer">
                <div className="video-mode-player__footer-row">
                  <div className="video-mode-player__time-pill">{timeLabel}</div>
                  <button
                    type="button"
                    className="video-mode-player__icon-pill"
                    aria-label="Expand video"
                    onClick={e => {
                      e.stopPropagation();
                      onMaximize?.();
                    }}
                  >
                    <Maximize2 size={18} strokeWidth={2} />
                  </button>
                </div>
                <div className="video-mode-player__progress-track" aria-hidden>
                  <div
                    className="video-mode-player__progress-fill"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
