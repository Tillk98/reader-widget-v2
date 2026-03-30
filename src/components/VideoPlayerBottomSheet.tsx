import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { Sentence as SentenceType } from '../data/lesson';
import lessonImage from '../assets/lesson-image.png';
import { DrawerVideoPlayer, type DrawerVideoPlayerHandle } from './DrawerVideoPlayer';
import { LessonMediaExpandedPanel } from './LessonMediaExpandedPanel';
import './AudioPlayerBottomSheet.css';

const DRAG_THRESHOLD_PX = 40;
/** Match `--audio-sheet-duration` in AudioPlayerBottomSheet.css (ms) */
const SHEET_TRANSITION_MS = 380;

export interface VideoPlayerBottomSheetProps {
  lessonTitle: string;
  lessonSource?: string;
  sentences: SentenceType[];
  clickedWords: Set<string>;
  lingqWords: Set<string>;
  knownWords: Set<string>;
  ignoredWords: Set<string>;
  onWordClick: (wordId: string) => void;
  onClose: () => void;
  videoUrl?: string;
  posterUrl?: string;
  hasWordSelected?: boolean;
  onInspectSentence?: () => void;
  onShowTranslation?: () => void;
}

export const VideoPlayerBottomSheet: React.FC<VideoPlayerBottomSheetProps> = ({
  lessonTitle,
  lessonSource,
  sentences,
  clickedWords,
  lingqWords,
  knownWords,
  ignoredWords,
  onWordClick,
  onClose,
  videoUrl,
  posterUrl,
  hasWordSelected = false,
  onInspectSentence,
  onShowTranslation,
}) => {
  const videoPlayerRef = useRef<DrawerVideoPlayerHandle>(null);
  const [isPaused, setIsPaused] = useState(true);
  /** Drives same slide + backdrop transitions as audio expanded sheet */
  const [sheetOpen, setSheetOpen] = useState(false);
  const hasPresentedRef = useRef(false);
  const handleDragStartY = useRef<number | null>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setSheetOpen(true);
        hasPresentedRef.current = true;
      });
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (sheetOpen || !hasPresentedRef.current) return;
    const t = window.setTimeout(() => {
      onCloseRef.current();
    }, SHEET_TRANSITION_MS);
    return () => window.clearTimeout(t);
  }, [sheetOpen]);

  const togglePause = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    videoPlayerRef.current?.togglePlayPause();
  }, []);

  const requestClose = useCallback(() => {
    if (!hasPresentedRef.current) {
      onCloseRef.current();
      return;
    }
    setSheetOpen(prev => (prev ? false : prev));
  }, []);

  const handleHandlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    handleDragStartY.current = e.clientY;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const handleHandlePointerMove = useCallback((e: React.PointerEvent) => {
    if (handleDragStartY.current === null) return;
    e.preventDefault();
    const deltaY = e.clientY - handleDragStartY.current;
    if (deltaY >= DRAG_THRESHOLD_PX) {
      handleDragStartY.current = null;
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      requestClose();
    }
  }, [requestClose]);

  const handleHandlePointerUp = useCallback((e: React.PointerEvent) => {
    if (handleDragStartY.current === null) {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      return;
    }
    const deltaY = e.clientY - handleDragStartY.current;
    if (deltaY >= DRAG_THRESHOLD_PX) {
      requestClose();
    }
    handleDragStartY.current = null;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  }, [requestClose]);

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
      onTogglePause={togglePause}
      videoSlot={
        <DrawerVideoPlayer
          ref={videoPlayerRef}
          videoUrl={videoUrl}
          posterUrl={posterUrl}
          hideOverlayClose
          onPlayingChange={playing => setIsPaused(!playing)}
        />
      }
      wordSelectionActive={hasWordSelected}
      onInspectSentence={onInspectSentence}
      onShowTranslation={onShowTranslation}
      expanded={sheetOpen}
      onBackdropClick={requestClose}
      onHandlePointerDown={handleHandlePointerDown}
      onHandlePointerMove={handleHandlePointerMove}
      onHandlePointerUp={handleHandlePointerUp}
      onHandlePointerCancel={handleHandlePointerCancel}
      onHandleClick={requestClose}
      dialogAriaLabel="Video lesson"
    />
  );
};
