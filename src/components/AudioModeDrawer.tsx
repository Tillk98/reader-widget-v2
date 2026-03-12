import React, { useRef, useCallback, useEffect } from 'react';
import { Pause, Play, Languages } from 'lucide-react';
import type { Sentence as SentenceType } from '../data/lesson';
import { Word } from './Word';
import { DrawerVideoPlayer } from './DrawerVideoPlayer';
import playerBack from '../assets/player-back.png';
import playerForward from '../assets/player-forward.png';
import playerRepeat from '../assets/player-repeat.png';
import sentenceIcon from '../assets/sentence-icon.png';
import lessonImage from '../assets/lesson-image.png';
import videoThumbnail from '../assets/video-thumbnail.png';
import reviewIcon from '../assets/review-icon.png';
import lynxIcon from '../assets/lynx-icon.png';
import './AudioModeDrawer.css';

const HANDLE_DRAG_CLOSE_THRESHOLD_PX = 40;
const LONG_PRESS_MS = 450;

export interface AudioModeDrawerProps {
  open: boolean;
  onClose: () => void;
  showPlayer?: boolean;
  onSentence?: () => void;
  lessonTitle: string;
  lessonSource: string;
  sentences: SentenceType[];
  clickedWords: Set<string>;
  lingqWords: Set<string>;
  knownWords: Set<string>;
  ignoredWords: Set<string>;
  onWordClick: (wordId: string) => void;
  videoUrl?: string;
}

export const AudioModeDrawer: React.FC<AudioModeDrawerProps> = ({
  open,
  onClose,
  showPlayer = true,
  onSentence,
  lessonTitle,
  lessonSource,
  sentences,
  clickedWords,
  lingqWords,
  knownWords,
  ignoredWords,
  onWordClick,
  videoUrl,
}) => {
  const [selectedSentenceIndex, setSelectedSentenceIndex] = React.useState<number | null>(null);
  const sentenceToolbarRef = useRef<HTMLDivElement | null>(null);
  const handleDragStartYRef = useRef<number | null>(null);
  const handleRef = useRef<HTMLDivElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressSentenceRef = useRef<number | null>(null);

  useEffect(() => {
    const el = handleRef.current;
    if (!el) return;
    const onTouchMove = (e: TouchEvent) => {
      if (handleDragStartYRef.current === null) return;
      e.preventDefault();
      if (e.touches.length > 0) {
        const deltaY = e.touches[0].clientY - handleDragStartYRef.current;
        if (deltaY >= HANDLE_DRAG_CLOSE_THRESHOLD_PX) {
          handleDragStartYRef.current = null;
          onCloseRef.current();
          document.removeEventListener('touchmove', onTouchMove, { capture: true });
          document.removeEventListener('touchend', onTouchEnd, { capture: true });
          document.removeEventListener('touchcancel', onTouchEnd, { capture: true });
        }
      }
    };
    const onTouchEnd = () => {
      if (handleDragStartYRef.current !== null) onCloseRef.current(); /* tap on handle closes */
      handleDragStartYRef.current = null;
      document.removeEventListener('touchmove', onTouchMove, { capture: true });
      document.removeEventListener('touchend', onTouchEnd, { capture: true });
      document.removeEventListener('touchcancel', onTouchEnd, { capture: true });
    };
    const onTouchStart = (e: TouchEvent) => {
      if (e.changedTouches.length > 0) {
        handleDragStartYRef.current = e.changedTouches[0].clientY;
        document.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
        document.addEventListener('touchend', onTouchEnd, { capture: true });
        document.addEventListener('touchcancel', onTouchEnd, { capture: true });
      }
    };
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove, { capture: true });
      document.removeEventListener('touchend', onTouchEnd, { capture: true });
      document.removeEventListener('touchcancel', onTouchEnd, { capture: true });
    };
  }, []);

  const handleHandlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    handleDragStartYRef.current = e.clientY;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const handleHandlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (handleDragStartYRef.current === null) return;
      e.preventDefault(); /* prevent pull-to-refresh while dragging handle */
      const deltaY = e.clientY - handleDragStartYRef.current;
      if (deltaY >= HANDLE_DRAG_CLOSE_THRESHOLD_PX) {
        handleDragStartYRef.current = null;
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
        onClose();
      }
    },
    [onClose]
  );

  const handleHandlePointerUp = useCallback((e: React.PointerEvent) => {
    if (handleDragStartYRef.current === null) return;
    const deltaY = e.clientY - handleDragStartYRef.current;
    if (deltaY >= HANDLE_DRAG_CLOSE_THRESHOLD_PX) onClose();
    else onClose(); /* tap on handle also closes */
    handleDragStartYRef.current = null;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  }, [onClose]);

  const handleHandlePointerCancel = useCallback(() => {
    handleDragStartYRef.current = null;
  }, []);

  const handleContentClick = useCallback((e: React.MouseEvent) => {
    if (sentenceToolbarRef.current?.contains(e.target as Node)) return;
    setSelectedSentenceIndex(null);
  }, []);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    longPressSentenceRef.current = null;
  }, []);

  const handleSentenceBlockPointerDown = useCallback((e: React.PointerEvent, sentenceIndex: number) => {
    if ((e.target as HTMLElement).closest('.sentence-item')) return;
    e.preventDefault();
    clearLongPressTimer();
    longPressSentenceRef.current = sentenceIndex;
    longPressTimerRef.current = setTimeout(() => {
      longPressTimerRef.current = null;
      const idx = longPressSentenceRef.current;
      longPressSentenceRef.current = null;
      if (idx !== null) setSelectedSentenceIndex(idx);
    }, LONG_PRESS_MS);
  }, [clearLongPressTimer]);

  const handleSentenceBlockPointerUp = useCallback(() => {
    clearLongPressTimer();
  }, [clearLongPressTimer]);

  const handleSentenceBlockPointerCancel = useCallback(() => {
    clearLongPressTimer();
  }, [clearLongPressTimer]);

  const handleSentenceBlockClick = useCallback((e: React.MouseEvent, sentenceIndex: number) => {
    if (selectedSentenceIndex === sentenceIndex && !(e.target as HTMLElement).closest('.sentence-item')) e.stopPropagation();
  }, [selectedSentenceIndex]);

  useEffect(() => {
    if (selectedSentenceIndex !== null && selectedSentenceIndex >= sentences.length) {
      setSelectedSentenceIndex(null);
    }
  }, [sentences.length, selectedSentenceIndex]);

  useEffect(() => {
    if (!open) setSelectedSentenceIndex(null);
  }, [open]);

  useEffect(() => {
    return () => clearLongPressTimer();
  }, [clearLongPressTimer]);

  return (
    <div
      className={`audio-mode-drawer-root ${open ? 'open' : ''}`}
      aria-hidden={!open}
      role="dialog"
      aria-label="Audio Mode"
    >
      <div className="audio-mode-drawer-panel">
        <header className={`audio-mode-drawer-top-bar ${!showPlayer ? 'audio-mode-drawer-top-bar-video-mode' : ''}`}>
          <div
            ref={handleRef}
            className="audio-mode-drawer-handle"
            aria-hidden
            role="button"
            tabIndex={0}
            aria-label="Drag down to close"
            onPointerDown={handleHandlePointerDown}
            onPointerMove={handleHandlePointerMove}
            onPointerUp={handleHandlePointerUp}
            onPointerCancel={handleHandlePointerCancel}
          />
          {showPlayer && (
          <div className="audio-mode-drawer-lesson-details">
            <div className="audio-mode-drawer-lesson-image-wrap">
              <img
                src={lessonImage}
                alt=""
                className="audio-mode-drawer-lesson-image"
              />
            </div>
            <div className="audio-mode-drawer-lesson-text">
              <p className="audio-mode-drawer-lesson-title">{lessonTitle}</p>
              <p className="audio-mode-drawer-lesson-source">{lessonSource}</p>
            </div>
          </div>
          )}
        </header>

        {showPlayer ? (
        <>
        <main className="audio-mode-drawer-main" onClick={handleContentClick}>
          <div className="audio-mode-drawer-content">
            {sentences.map((sentence, sentenceIndex) => (
              <div
                key={sentenceIndex}
                role="button"
                tabIndex={0}
                className={`audio-mode-drawer-sentence-block ${selectedSentenceIndex === sentenceIndex ? 'audio-mode-drawer-sentence-block-selected' : ''}`}
                onClick={e => handleSentenceBlockClick(e, sentenceIndex)}
                onPointerDown={e => handleSentenceBlockPointerDown(e, sentenceIndex)}
                onPointerUp={handleSentenceBlockPointerUp}
                onPointerCancel={handleSentenceBlockPointerCancel}
              >
                <p className="audio-mode-drawer-sentence">
                  {sentence.words.map((word, wordIndex) => (
                    <React.Fragment key={word.id}>
                      <Word
                        word={word}
                        isClicked={clickedWords.has(word.id)}
                        isLingQ={lingqWords.has(word.id)}
                        onClick={onWordClick}
                        isKnown={knownWords.has(word.id)}
                        isIgnored={ignoredWords.has(word.id)}
                      />
                      {wordIndex < sentence.words.length - 1 && ' '}
                    </React.Fragment>
                  ))}
                </p>
              </div>
            ))}
          </div>
        </main>

        <div className="audio-mode-drawer-player-wrap">
          <>
            {selectedSentenceIndex !== null && selectedSentenceIndex < sentences.length && (
              <div
                ref={sentenceToolbarRef}
                className="audio-mode-drawer-sentence-toolbar"
                role="toolbar"
                aria-label="Sentence actions"
              >
                <button type="button" className="audio-mode-drawer-sentence-toolbar-btn" aria-label="Play from sentence" onClick={() => {}}>
                  <Play size={24} />
                </button>
                <button type="button" className="audio-mode-drawer-sentence-toolbar-btn" aria-label="Generate translation" onClick={() => {}}>
                  <Languages size={24} />
                </button>
                <button type="button" className="audio-mode-drawer-sentence-toolbar-btn" aria-label="Sentence mode" onClick={() => onSentence?.()}>
                  <img src={sentenceIcon} alt="" />
                </button>
                <button type="button" className="audio-mode-drawer-sentence-toolbar-btn" aria-label="Review sentence" onClick={() => {}}>
                  <img src={reviewIcon} alt="" />
                </button>
                <button type="button" className="audio-mode-drawer-sentence-toolbar-btn" aria-label="Lynx" onClick={() => {}}>
                  <img src={lynxIcon} alt="" />
                </button>
              </div>
            )}
            {showPlayer && (
              <div className="audio-mode-drawer-player">
          <div className="audio-mode-drawer-player-inner">
            <div className="audio-mode-drawer-progress-section">
              <div className="audio-mode-drawer-progress-wrap">
                <div className="audio-mode-drawer-progress-track">
                  <div className="audio-mode-drawer-progress-fill" />
                  <div className="audio-mode-drawer-progress-thumb" aria-hidden />
                </div>
              </div>
              <div className="audio-mode-drawer-time-row">
                <span>0:00</span>
                <span>0:00</span>
              </div>
            </div>

            <div className="audio-mode-drawer-controls-row">
              <button
                type="button"
                className="audio-mode-drawer-controls-side-btn"
                aria-label="Playback speed"
                onClick={() => {}}
              >
                1x
              </button>
              <div className="audio-mode-drawer-controls-pill">
                <button
                  type="button"
                  className="audio-mode-drawer-control-btn"
                  aria-label="Skip back"
                  onClick={() => {}}
                >
                  <img src={playerBack} alt="" />
                </button>
                <button
                  type="button"
                  className="audio-mode-drawer-control-btn play-pause"
                  aria-label="Pause"
                  onClick={() => {}}
                >
                  <Pause size={32} />
                </button>
                <button
                  type="button"
                  className="audio-mode-drawer-control-btn"
                  aria-label="Skip forward"
                  onClick={() => {}}
                >
                  <img src={playerForward} alt="" />
                </button>
              </div>
              <button
                type="button"
                className="audio-mode-drawer-controls-side-btn"
                aria-label="Repeat"
                onClick={() => {}}
              >
                <img src={playerRepeat} alt="" />
              </button>
            </div>
            </div>
          </div>
            )}
          </>
        </div>
        </>
        ) : (
        <>
        <div className="audio-mode-drawer-video-scroll">
          <div className="audio-mode-drawer-video-sticky">
            <DrawerVideoPlayer
              videoUrl={videoUrl}
              posterUrl={videoThumbnail}
              onClose={onClose}
            />
          </div>
          <main className="audio-mode-drawer-main audio-mode-drawer-main-video-mode" onClick={handleContentClick}>
            <div className="audio-mode-drawer-content">
              <div className="audio-mode-drawer-lesson-details audio-mode-drawer-lesson-details-in-content">
                <div className="audio-mode-drawer-lesson-image-wrap">
                  <img src={lessonImage} alt="" className="audio-mode-drawer-lesson-image" />
                </div>
                <div className="audio-mode-drawer-lesson-text">
                  <p className="audio-mode-drawer-lesson-title">{lessonTitle}</p>
                  <p className="audio-mode-drawer-lesson-source">{lessonSource}</p>
                </div>
              </div>
              {sentences.map((sentence, sentenceIndex) => (
                <div
                  key={sentenceIndex}
                  role="button"
                  tabIndex={0}
                  className={`audio-mode-drawer-sentence-block ${selectedSentenceIndex === sentenceIndex ? 'audio-mode-drawer-sentence-block-selected' : ''}`}
                  onClick={e => handleSentenceBlockClick(e, sentenceIndex)}
                  onPointerDown={e => handleSentenceBlockPointerDown(e, sentenceIndex)}
                  onPointerUp={handleSentenceBlockPointerUp}
                  onPointerCancel={handleSentenceBlockPointerCancel}
                >
                  <p className="audio-mode-drawer-sentence">
                    {sentence.words.map((word, wordIndex) => (
                      <React.Fragment key={word.id}>
                        <Word
                          word={word}
                          isClicked={clickedWords.has(word.id)}
                          isLingQ={lingqWords.has(word.id)}
                          onClick={onWordClick}
                          isKnown={knownWords.has(word.id)}
                          isIgnored={ignoredWords.has(word.id)}
                        />
                        {wordIndex < sentence.words.length - 1 && ' '}
                      </React.Fragment>
                    ))}
                  </p>
                </div>
              ))}
            </div>
          </main>
        </div>
        {selectedSentenceIndex !== null && selectedSentenceIndex < sentences.length && (
          <div className="audio-mode-drawer-video-toolbar-wrap">
            <div
              ref={sentenceToolbarRef}
              className="audio-mode-drawer-sentence-toolbar audio-mode-drawer-sentence-toolbar-video-mode"
              role="toolbar"
              aria-label="Sentence actions"
            >
              <button type="button" className="audio-mode-drawer-sentence-toolbar-btn" aria-label="Play from sentence" onClick={() => {}}>
                <Play size={24} />
              </button>
              <button type="button" className="audio-mode-drawer-sentence-toolbar-btn" aria-label="Generate translation" onClick={() => {}}>
                <Languages size={24} />
              </button>
              <button type="button" className="audio-mode-drawer-sentence-toolbar-btn" aria-label="Sentence mode" onClick={() => onSentence?.()}>
                <img src={sentenceIcon} alt="" />
              </button>
              <button type="button" className="audio-mode-drawer-sentence-toolbar-btn" aria-label="Review sentence" onClick={() => {}}>
                <img src={reviewIcon} alt="" />
              </button>
              <button type="button" className="audio-mode-drawer-sentence-toolbar-btn" aria-label="Lynx" onClick={() => {}}>
                <img src={lynxIcon} alt="" />
              </button>
            </div>
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
};
