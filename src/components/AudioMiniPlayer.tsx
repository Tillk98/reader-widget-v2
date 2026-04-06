import React, { useRef, useLayoutEffect, useEffect } from 'react';
import { Pause, Play, X } from 'lucide-react';
import playerBack from '../assets/player-back.png';
import './AudioMiniPlayer.css';

export interface AudioMiniPlayerProps {
  lessonTitle: string;
  lessonSource?: string;
  lessonImageSrc: string;
  isPaused: boolean;
  onTogglePause: () => void;
  onSkipBack?: () => void;
  /** Tap lesson row: expand to full audio mode. */
  onExpand: () => void;
  onDismiss: () => void;
  /** Parent-driven exit animation (slide down + fade). */
  isExiting?: boolean;
  onExitAnimationComplete?: () => void;
  /** 0–1 stub progress until media engine exists. */
  playbackProgress?: number;
  onHeightChange?: (heightPx: number) => void;
}

export const AudioMiniPlayer: React.FC<AudioMiniPlayerProps> = ({
  lessonTitle,
  lessonSource,
  lessonImageSrc,
  isPaused,
  onTogglePause,
  onSkipBack,
  onExpand,
  onDismiss,
  isExiting = false,
  onExitAnimationComplete,
  playbackProgress = 0.08,
  onHeightChange,
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const progressPct = Math.min(100, Math.max(0, playbackProgress * 100));

  useEffect(() => {
    if (!isExiting || !onExitAnimationComplete) return;
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setTimeout(() => onExitAnimationComplete(), 0);
    return () => window.clearTimeout(id);
  }, [isExiting, onExitAnimationComplete]);

  const handleRootAnimationEnd = (e: React.AnimationEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.animationName !== 'audio-mini-player-exit') return;
    onExitAnimationComplete?.();
  };

  useLayoutEffect(() => {
    if (!onHeightChange) return;
    const el = rootRef.current;
    if (!el) return;
    const emit = () => {
      const h = el.getBoundingClientRect().height;
      if (h > 0) onHeightChange(h);
    };
    emit();
    const ro = new ResizeObserver(() => emit());
    ro.observe(el);
    return () => ro.disconnect();
  }, [onHeightChange, lessonTitle, lessonSource]);

  return (
    <div
      ref={rootRef}
      className={['audio-mini-player', isExiting && 'audio-mini-player--exiting'].filter(Boolean).join(' ')}
      data-audio-mini-player
      onAnimationEnd={handleRootAnimationEnd}
    >
      <div className="audio-mini-player__card" role="region" aria-label="Lesson audio">
        <div className="audio-mini-player__row">
          <button
            type="button"
            className="audio-mini-player__expand-hit"
            onClick={onExpand}
            aria-label="Open expanded audio mode"
          >
            <span className="audio-mini-player__thumb-wrap">
              <img src={lessonImageSrc} alt="" className="audio-mini-player__thumb" />
            </span>
            <span className="audio-mini-player__text">
              <span className="audio-mini-player__title">{lessonTitle}</span>
              {lessonSource ? (
                <span className="audio-mini-player__source">{lessonSource}</span>
              ) : null}
            </span>
          </button>

          <div className="audio-mini-player__controls">
            <div className="audio-mini-player__control-group">
              <button
                type="button"
                className="audio-mini-player__icon-btn audio-mini-player__icon-btn--sm"
                aria-label="Skip back 5 seconds"
                onClick={e => {
                  e.stopPropagation();
                  onSkipBack?.();
                }}
              >
                <img src={playerBack} alt="" width={19} height={19} />
              </button>
              <button
                type="button"
                className="audio-mini-player__icon-btn audio-mini-player__icon-btn--lg"
                aria-label={isPaused ? 'Play' : 'Pause'}
                onClick={e => {
                  e.stopPropagation();
                  onTogglePause();
                }}
              >
                {isPaused ? <Play size={24} strokeWidth={2} /> : <Pause size={24} strokeWidth={2} />}
              </button>
            </div>
            <button
              type="button"
              className="audio-mini-player__icon-btn audio-mini-player__icon-btn--sm audio-mini-player__dismiss"
              aria-label="Close audio player"
              onClick={e => {
                e.stopPropagation();
                onDismiss();
              }}
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>
        </div>

        <div className="audio-mini-player__progress" aria-hidden>
          <div className="audio-mini-player__progress-track">
            <div className="audio-mini-player__progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
};
