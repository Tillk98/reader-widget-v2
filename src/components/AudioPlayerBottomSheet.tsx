import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pause, Play, X } from 'lucide-react';
import type { Sentence as SentenceType } from '../data/lesson';
import lessonImage from '../assets/lesson-image.png';
import playerBack from '../assets/player-back.png';
import { LessonMediaExpandedPanel } from './LessonMediaExpandedPanel';
import './AudioPlayerBottomSheet.css';

const DRAG_THRESHOLD_PX = 40;

export interface AudioPlayerBottomSheetProps {
  lessonTitle: string;
  lessonSource?: string;
  sentences: SentenceType[];
  clickedWords: Set<string>;
  lingqWords: Set<string>;
  knownWords: Set<string>;
  ignoredWords: Set<string>;
  onWordClick: (wordId: string) => void;
  onClose: () => void;
  hasWordSelected?: boolean;
  onInspectSentence?: () => void;
  onShowTranslation?: () => void;
  /** Fires when expanded/collapsed changes (for positioning chrome above collapsed bar). */
  onExpandedChange?: (expanded: boolean) => void;
  /** Reported height of the collapsed mini player (border box) for anchoring reader chrome. */
  onCollapsedHeightChange?: (heightPx: number) => void;
}

export const AudioPlayerBottomSheet: React.FC<AudioPlayerBottomSheetProps> = ({
  lessonTitle,
  lessonSource,
  sentences,
  clickedWords,
  lingqWords,
  knownWords,
  ignoredWords,
  onWordClick,
  onClose,
  hasWordSelected = false,
  onInspectSentence,
  onShowTranslation,
  onExpandedChange,
  onCollapsedHeightChange,
}) => {
  const [expanded, setExpanded] = useState(false);
  const collapsedSheetRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [slideIn, setSlideIn] = useState(false);

  const handleDragStartY = useRef<number | null>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const id = requestAnimationFrame(() => setSlideIn(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    onExpandedChange?.(expanded);
  }, [expanded, onExpandedChange]);

  useEffect(() => {
    if (!onCollapsedHeightChange) return;
    const el = collapsedSheetRef.current;
    if (!el) return;

    const report = () => {
      onCollapsedHeightChange(el.offsetHeight);
    };

    report();
    const ro = new ResizeObserver(() => report());
    ro.observe(el);
    return () => ro.disconnect();
  }, [onCollapsedHeightChange]);

  const togglePause = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPaused(p => !p);
  };

  const handleHandlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    handleDragStartY.current = e.clientY;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const handleHandlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (handleDragStartY.current === null) return;
      e.preventDefault();
      const deltaY = e.clientY - handleDragStartY.current;
      if (!expanded && deltaY <= -DRAG_THRESHOLD_PX) {
        handleDragStartY.current = null;
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
        setExpanded(true);
      } else if (expanded && deltaY >= DRAG_THRESHOLD_PX) {
        handleDragStartY.current = null;
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
        setExpanded(false);
      }
    },
    [expanded]
  );

  const handleHandlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (handleDragStartY.current === null) {
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
        return;
      }
      const deltaY = e.clientY - handleDragStartY.current;
      if (expanded) {
        if (deltaY >= DRAG_THRESHOLD_PX) {
          setExpanded(false);
        }
      } else if (deltaY >= DRAG_THRESHOLD_PX) {
        onCloseRef.current();
      }
      handleDragStartY.current = null;
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    },
    [expanded]
  );

  const handleHandlePointerCancel = useCallback((e: React.PointerEvent) => {
    handleDragStartY.current = null;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  }, []);

  const handleHandleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!expanded) {
        setExpanded(true);
      }
    },
    [expanded]
  );

  const collapsedBar = (
    <div
      ref={collapsedSheetRef}
      className={[
        'audio-sheet',
        'audio-sheet--collapsed',
        slideIn ? 'audio-sheet--visible' : '',
        expanded ? 'audio-sheet--collapsed-away' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-lesson-media-sheet
      role="region"
      aria-label="Audio player"
      aria-hidden={expanded}
    >
      <button
        type="button"
        className="audio-sheet__handle"
        aria-label={expanded ? 'Drag to collapse' : 'Drag to expand or close'}
        onClick={handleHandleClick}
        onPointerDown={handleHandlePointerDown}
        onPointerMove={handleHandlePointerMove}
        onPointerUp={handleHandlePointerUp}
        onPointerCancel={handleHandlePointerCancel}
      >
        <span className="audio-sheet__handle-bar" />
      </button>
      <div className="audio-sheet__collapsed-row">
        <button type="button" className="audio-sheet__play-btn" onClick={togglePause} aria-label={isPaused ? 'Play' : 'Pause'}>
          {isPaused ? <Play size={24} /> : <Pause size={24} />}
        </button>
        <button type="button" className="audio-sheet__lesson-card" onClick={() => setExpanded(true)} aria-label="Expand player">
          <div className="audio-sheet__lesson-thumb-wrap">
            <img src={lessonImage} alt="" className="audio-sheet__lesson-thumb" />
          </div>
          <div className="audio-sheet__lesson-text">
            <p className="audio-sheet__lesson-title">{lessonTitle}</p>
            {lessonSource ? <p className="audio-sheet__lesson-source">{lessonSource}</p> : null}
          </div>
        </button>
        <button type="button" className="audio-sheet__icon-btn" aria-label="Skip back 5 seconds">
          <img src={playerBack} alt="" width={18} height={18} />
        </button>
        <button type="button" className="audio-sheet__icon-btn" onClick={onClose} aria-label="Close audio">
          <X size={18} />
        </button>
      </div>
      <div className="audio-sheet__collapsed-progress" aria-hidden>
        <div className="audio-sheet__collapsed-progress-track">
          <div className="audio-sheet__collapsed-progress-fill" />
        </div>
      </div>
    </div>
  );

  return (
    <>
      <LessonMediaExpandedPanel
        lessonTitle={lessonTitle}
        lessonSource={lessonSource}
        lessonImageSrc={lessonImage}
        sentences={sentences}
        clickedWords={clickedWords}
        lingqWords={lingqWords}
        knownWords={knownWords}
        ignoredWords={ignoredWords}
        onWordClick={onWordClick}
        isPaused={isPaused}
        onTogglePause={togglePause}
        expanded={expanded}
        onBackdropClick={() => setExpanded(false)}
        onHandlePointerDown={handleHandlePointerDown}
        onHandlePointerMove={handleHandlePointerMove}
        onHandlePointerUp={handleHandlePointerUp}
        onHandlePointerCancel={handleHandlePointerCancel}
        onHandleClick={() => setExpanded(false)}
        wordSelectionActive={hasWordSelected}
        onInspectSentence={onInspectSentence}
        onShowTranslation={onShowTranslation}
        dialogAriaLabel="Audio lesson"
      />
      {collapsedBar}
    </>
  );
};
