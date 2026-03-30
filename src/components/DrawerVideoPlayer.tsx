import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { X, Play, Pause, SkipBack, SkipForward, Maximize } from 'lucide-react';
import './DrawerVideoPlayer.css';

export type DrawerVideoPlayerHandle = {
  togglePlayPause: () => void;
};

export interface DrawerVideoPlayerProps {
  videoUrl?: string;
  posterUrl?: string;
  onClose?: () => void;
  /** When true, hide the overlay close control (sheet provides dismiss). */
  hideOverlayClose?: boolean;
  /** Synced with actual video play/pause (for external controls). */
  onPlayingChange?: (playing: boolean) => void;
}

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const DrawerVideoPlayer = forwardRef<DrawerVideoPlayerHandle, DrawerVideoPlayerProps>(
  function DrawerVideoPlayer(
    { videoUrl, posterUrl, onClose, hideOverlayClose = false, onPlayingChange },
    ref
  ) {
    const [controlsVisible, setControlsVisible] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(765); // 12:45 placeholder
    const videoRef = useRef<HTMLVideoElement>(null);
    const hideControlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useImperativeHandle(
      ref,
      () => ({
        togglePlayPause: () => {
          const v = videoRef.current;
          if (!v || !videoUrl) return;
          if (v.paused) {
            void v.play();
          } else {
            v.pause();
          }
        },
      }),
      [videoUrl]
    );

    useEffect(() => {
      return () => {
        if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
      };
    }, []);

    const toggleControls = () => {
      setControlsVisible(prev => {
        if (prev) {
          if (hideControlsTimerRef.current) {
            clearTimeout(hideControlsTimerRef.current);
            hideControlsTimerRef.current = null;
          }
          return false;
        }
        hideControlsTimerRef.current = setTimeout(() => {
          setControlsVisible(false);
          hideControlsTimerRef.current = null;
        }, 3000);
        return true;
      });
    };

    const handlePlayPause = (e: React.MouseEvent) => {
      e.stopPropagation();
      const v = videoRef.current;
      if (!v) return;
      if (v.paused) {
        void v.play();
      } else {
        v.pause();
      }
    };

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
      <div
        className="drawer-video-player"
        onClick={toggleControls}
        role="button"
        tabIndex={0}
        aria-label="Video player"
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleControls();
          }
        }}
      >
        <div className="drawer-video-player-media">
          {videoUrl ? (
            <video
              ref={videoRef}
              src={videoUrl}
              poster={posterUrl}
              className="drawer-video-player-video"
              playsInline
              onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime ?? 0)}
              onDurationChange={() => setDuration(videoRef.current?.duration ?? 0)}
              onPlay={() => {
                setIsPlaying(true);
                onPlayingChange?.(true);
              }}
              onPause={() => {
                setIsPlaying(false);
                onPlayingChange?.(false);
              }}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <div
              className="drawer-video-player-poster"
              style={{ backgroundImage: posterUrl ? `url(${posterUrl})` : undefined }}
            />
          )}
        </div>

        {controlsVisible && (
          <>
            <div className="drawer-video-player-overlay" aria-hidden />
            <div className="drawer-video-player-top">
              {!hideOverlayClose && (
                <button
                  type="button"
                  className="drawer-video-player-btn drawer-video-player-btn-small"
                  onClick={e => {
                    e.stopPropagation();
                    onClose?.();
                  }}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              )}
            </div>
            <div className="drawer-video-player-center">
              <button
                type="button"
                className="drawer-video-player-btn drawer-video-player-btn-small"
                aria-label="Skip back"
                onClick={e => e.stopPropagation()}
              >
                <SkipBack size={18} />
              </button>
              <button
                type="button"
                className="drawer-video-player-btn drawer-video-player-btn-play"
                aria-label={isPlaying ? 'Pause' : 'Play'}
                onClick={handlePlayPause}
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>
              <button
                type="button"
                className="drawer-video-player-btn drawer-video-player-btn-small"
                aria-label="Skip forward"
                onClick={e => e.stopPropagation()}
              >
                <SkipForward size={18} />
              </button>
            </div>
            <div className="drawer-video-player-bottom">
              <div className="drawer-video-player-time">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
              <button
                type="button"
                className="drawer-video-player-btn drawer-video-player-btn-small"
                aria-label="Fullscreen"
                onClick={e => e.stopPropagation()}
              >
                <Maximize size={18} />
              </button>
            </div>
            <div className="drawer-video-player-progress-wrap">
              <div className="drawer-video-player-progress-track">
                <div
                  className="drawer-video-player-progress-fill"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    );
  }
);
