import React, { useCallback, useEffect, useRef, useLayoutEffect } from 'react';
import { AudioLines, ChevronDown, Pause, Play } from 'lucide-react';
import playerBack from '../assets/player-back.png';
import playerForward from '../assets/player-forward.png';
import './VideoModeBottomBar.css';

const DRAG_THRESHOLD_PX = 40;

function targetIsInteractiveControl(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest('button, a, [role="button"], input, textarea, select'));
}

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
  /** Collapsed only: drag down past threshold to leave video mode and return to default reader. */
  onExitVideoMode?: () => void;
  /** Expanded: X (or equivalent) — minimize / exit to page (audio returns to mini player). */
  onDismiss?: () => void;
  /** Lesson type — expanded chrome matches Figma audio vs video. */
  lessonMedia?: 'video' | 'audio';
  /** Optional: waveform / audio details (stub). */
  onAudioDetails?: () => void;
  /** When true, plays slide-down exit (no View Transitions). Parent should unmount after onExitSlideComplete. */
  exiting?: boolean;
  /** Fired when exit slide animation ends (or immediately if reduced motion). */
  onExitSlideComplete?: () => void;
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
  onExitVideoMode,
  onDismiss,
  lessonMedia = 'audio',
  onAudioDetails,
  exiting = false,
  onExitSlideComplete,
}) => {
  const dragStartY = useRef<number | null>(null);
  const dragStartX = useRef<number | null>(null);
  const pointerDownTargetRef = useRef<EventTarget | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const exitSlideCompleteCalledRef = useRef(false);

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

  useEffect(() => {
    if (!exiting) {
      exitSlideCompleteCalledRef.current = false;
      return;
    }
    if (exitSlideCompleteCalledRef.current) return;

    const el = rootRef.current;
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const finish = () => {
      if (exitSlideCompleteCalledRef.current) return;
      exitSlideCompleteCalledRef.current = true;
      onExitSlideComplete?.();
    };

    if (reducedMotion) {
      finish();
      return;
    }

    const fallbackMs = 650;
    const t = window.setTimeout(finish, fallbackMs);

    const onAnimationEnd = (e: AnimationEvent) => {
      if (e.target !== el) return;
      if (e.animationName !== 'video-mode-bar-slide-out') return;
      window.clearTimeout(t);
      finish();
    };

    el?.addEventListener('animationend', onAnimationEnd);
    return () => {
      window.clearTimeout(t);
      el?.removeEventListener('animationend', onAnimationEnd);
    };
  }, [exiting, onExitSlideComplete]);

  const handlePanelPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    /* Don't capture the pointer when starting on a control — capture breaks click on chevron / transport. */
    if (targetIsInteractiveControl(e.target)) {
      return;
    }
    dragStartY.current = e.clientY;
    dragStartX.current = e.clientX;
    pointerDownTargetRef.current = e.target;
    innerRef.current?.setPointerCapture?.(e.pointerId);
  }, []);

  const handlePanelPointerUp = useCallback(
    (e: React.PointerEvent) => {
      innerRef.current?.releasePointerCapture?.(e.pointerId);

      if (dragStartY.current === null || dragStartX.current === null) {
        dragStartY.current = null;
        dragStartX.current = null;
        pointerDownTargetRef.current = null;
        return;
      }

      const deltaY = e.clientY - dragStartY.current;
      const deltaX = e.clientX - dragStartX.current;
      const startedOnControl = targetIsInteractiveControl(pointerDownTargetRef.current);

      dragStartY.current = null;
      dragStartX.current = null;
      pointerDownTargetRef.current = null;

      const verticalDominant =
        Math.abs(deltaY) >= DRAG_THRESHOLD_PX && Math.abs(deltaY) >= Math.abs(deltaX);

      if (verticalDominant) {
        e.preventDefault();
        if (expanded) {
          if (deltaY >= DRAG_THRESHOLD_PX) {
            onExpandedChange(false);
          }
        } else if (deltaY >= DRAG_THRESHOLD_PX) {
          onExitVideoMode?.();
        } else if (deltaY <= -DRAG_THRESHOLD_PX) {
          onExpandedChange(true);
        }
        return;
      }

      /* Collapsed only: small tap on chrome (not on buttons) expands — matches old drag-handle behavior */
      const smallMove =
        Math.abs(deltaY) < DRAG_THRESHOLD_PX && Math.abs(deltaX) < DRAG_THRESHOLD_PX;
      if (smallMove && !expanded && !startedOnControl) {
        e.preventDefault();
        onExpandedChange(true);
      }
    },
    [expanded, onExpandedChange, onExitVideoMode]
  );

  const handlePanelPointerCancel = useCallback((e: React.PointerEvent) => {
    innerRef.current?.releasePointerCapture?.(e.pointerId);
    dragStartY.current = null;
    dragStartX.current = null;
    pointerDownTargetRef.current = null;
  }, []);

  const progressPct = Math.min(100, Math.max(0, playbackProgress * 100));

  return (
    <div
      ref={rootRef}
      className={[
        'video-mode-bottom-bar',
        expanded ? 'video-mode-bottom-bar--expanded' : 'video-mode-bottom-bar--collapsed',
        exiting && 'video-mode-bottom-bar--exit',
      ]
        .filter(Boolean)
        .join(' ')}
      data-video-mode-bar
    >
      <div
        ref={innerRef}
        className="video-mode-bottom-bar__inner"
        role="region"
        aria-label={
          expanded
            ? `${lessonMedia === 'video' ? 'Video' : 'Audio'} player — swipe down to collapse, or use controls`
            : `${lessonMedia === 'video' ? 'Video' : 'Audio'} player — swipe up on the bar to expand, swipe down to leave lesson mode, or use controls`
        }
        onPointerDown={handlePanelPointerDown}
        onPointerUp={handlePanelPointerUp}
        onPointerCancel={handlePanelPointerCancel}
      >
        {!expanded && (
          <div className="video-mode-bottom-bar__drag" aria-hidden>
            <span className="video-mode-bottom-bar__drag-bar" />
          </div>
        )}

        {expanded ? (
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

            <div className="video-mode-bottom-bar__media-actions" role="group" aria-label="Playback">
              <button
                type="button"
                className="video-mode-bottom-bar__round-btn video-mode-bottom-bar__round-btn--sm"
                aria-label="Audio details"
                onClick={() => onAudioDetails?.()}
              >
                <AudioLines size={18} strokeWidth={2} />
              </button>
              <div className="video-mode-bottom-bar__media-actions-center">
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
              <button
                type="button"
                className="video-mode-bottom-bar__round-btn video-mode-bottom-bar__round-btn--sm"
                aria-label="Return to lesson"
                onClick={() => onDismiss?.()}
              >
                <ChevronDown size={18} strokeWidth={2} />
              </button>
            </div>
          </>
        ) : (
          <>
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
            </div>

            <div className="video-mode-bottom-bar__progress-edge" aria-hidden="true">
              <div className="video-mode-bottom-bar__progress-track-edge">
                <div
                  className="video-mode-bottom-bar__progress-fill-edge"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
