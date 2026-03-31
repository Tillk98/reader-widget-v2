import React, { useCallback, useEffect, useRef } from 'react';
import type { Sentence as SentenceType } from '../data/lesson';
import lessonImage from '../assets/lesson-image.png';
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
  expanded: boolean;
  isPaused: boolean;
  onTogglePause: () => void;
  onExpandedChange: (expanded: boolean) => void;
  hasWordSelected?: boolean;
  onInspectSentence?: () => void;
  onShowTranslation?: () => void;
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
  expanded,
  isPaused,
  onTogglePause,
  onExpandedChange,
  hasWordSelected = false,
  onInspectSentence,
  onShowTranslation,
}) => {
  const handleDragStartY = useRef<number | null>(null);
  const onExpandedChangeRef = useRef(onExpandedChange);
  useEffect(() => {
    onExpandedChangeRef.current = onExpandedChange;
  }, [onExpandedChange]);

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
        onExpandedChangeRef.current(true);
      } else if (expanded && deltaY >= DRAG_THRESHOLD_PX) {
        handleDragStartY.current = null;
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
        onExpandedChangeRef.current(false);
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
          onExpandedChangeRef.current(false);
        } else {
          onExpandedChangeRef.current(true);
        }
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

  return (
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
      onTogglePause={onTogglePause}
      expanded={expanded}
      onBackdropClick={() => onExpandedChange(false)}
      onHandlePointerDown={handleHandlePointerDown}
      onHandlePointerMove={handleHandlePointerMove}
      onHandlePointerUp={handleHandlePointerUp}
      onHandlePointerCancel={handleHandlePointerCancel}
      onHandleClick={() => onExpandedChange(false)}
      wordSelectionActive={hasWordSelected}
      onInspectSentence={onInspectSentence}
      onShowTranslation={onShowTranslation}
      dialogAriaLabel="Audio lesson"
    />
  );
};
