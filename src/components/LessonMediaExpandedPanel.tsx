import React, { useEffect, useState } from 'react';
import { ChevronDown, Languages, Pause, Play } from 'lucide-react';
import type { Sentence as SentenceType } from '../data/lesson';
import playerBack from '../assets/player-back.png';
import playerForward from '../assets/player-forward.png';
import playerRepeat from '../assets/player-repeat.png';
import sentenceDefaultIcon from '../assets/sentence-default.png';
import reviewDefaultIcon from '../assets/review-default.png';
import { MediaModeLessonContent } from './MediaModeLessonContent';
import './AudioPlayerBottomSheet.css';

export interface LessonMediaExpandedPanelProps {
  lessonTitle: string;
  lessonSource?: string;
  lessonImageSrc: string;
  sentences: SentenceType[];
  clickedWords: Set<string>;
  lingqWords: Set<string>;
  knownWords: Set<string>;
  ignoredWords: Set<string>;
  onWordClick: (wordId: string) => void;
  isPaused: boolean;
  onTogglePause: (e: React.MouseEvent) => void;
  videoSlot?: React.ReactNode;
  /** When true, bottom toolbar grows and adds word actions (play, inspect, translate). */
  wordSelectionActive?: boolean;
  onInspectSentence?: () => void;
  onShowTranslation?: () => void;
  expanded: boolean;
  onBackdropClick: () => void;
  onHandlePointerDown: (e: React.PointerEvent) => void;
  onHandlePointerMove: (e: React.PointerEvent) => void;
  onHandlePointerUp: (e: React.PointerEvent) => void;
  onHandlePointerCancel: (e: React.PointerEvent) => void;
  onHandleClick: () => void;
  /** Audio: collapse to mini player. Video: exit to reader (no mini player). */
  onMinimize: () => void;
  dialogAriaLabel: string;
}

export const LessonMediaExpandedPanel: React.FC<LessonMediaExpandedPanelProps> = ({
  lessonTitle,
  lessonSource,
  lessonImageSrc,
  sentences,
  clickedWords,
  lingqWords,
  knownWords,
  ignoredWords,
  onWordClick,
  isPaused,
  onTogglePause,
  videoSlot,
  wordSelectionActive = false,
  onInspectSentence,
  onShowTranslation,
  expanded,
  onBackdropClick,
  onHandlePointerDown,
  onHandlePointerMove,
  onHandlePointerUp,
  onHandlePointerCancel,
  onHandleClick,
  onMinimize,
  dialogAriaLabel,
}) => {
  /** Independent from main transport / video play — toolbar-only control. */
  const [toolbarPlayPaused, setToolbarPlayPaused] = useState(true);

  useEffect(() => {
    if (!wordSelectionActive) setToolbarPlayPaused(true);
  }, [wordSelectionActive]);

  const isVideo = Boolean(videoSlot);
  const bottomActionsClass = [
    'audio-sheet__bottom-actions',
    wordSelectionActive && isVideo && 'audio-sheet__bottom-actions--fill-video',
    wordSelectionActive && !isVideo && 'audio-sheet__bottom-actions--fill-audio',
    !wordSelectionActive && 'audio-sheet__bottom-actions--hug',
  ]
    .filter(Boolean)
    .join(' ');

  const handleToolbarPlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setToolbarPlayPaused(p => !p);
  };

  const toolbarAriaLabel = wordSelectionActive ? 'Word and player options' : 'Player options';

  return (
    <>
      <button
        type="button"
        className={['audio-sheet__backdrop', expanded ? 'audio-sheet__backdrop--open' : '']
          .filter(Boolean)
          .join(' ')}
        aria-label="Dismiss"
        data-lesson-media-sheet
        tabIndex={expanded ? 0 : -1}
        onClick={onBackdropClick}
      />
      <div
        className={['audio-sheet', 'audio-sheet--expanded', expanded ? 'audio-sheet--expanded-open' : '']
          .filter(Boolean)
          .join(' ')}
        data-lesson-media-sheet
        role="dialog"
        aria-modal={expanded}
        aria-hidden={!expanded}
        aria-label={dialogAriaLabel}
        data-expanded-panel-variant={isVideo ? 'video' : 'audio'}
      >
        <button
          type="button"
          className="audio-sheet__handle audio-sheet__handle--expanded"
          aria-label="Drag down or tap to leave expanded view"
          onClick={onHandleClick}
          onPointerDown={onHandlePointerDown}
          onPointerMove={onHandlePointerMove}
          onPointerUp={onHandlePointerUp}
          onPointerCancel={onHandlePointerCancel}
        >
          <span className="audio-sheet__handle-bar" />
        </button>

        <div className="audio-sheet__expanded-meta">
          <div className="audio-sheet__lesson-thumb-wrap audio-sheet__lesson-thumb-wrap--lg">
            <img src={lessonImageSrc} alt="" className="audio-sheet__lesson-thumb" />
          </div>
          <div className="audio-sheet__lesson-text audio-sheet__lesson-text--expanded">
            <p className="audio-sheet__lesson-title-expanded">{lessonTitle}</p>
            {lessonSource ? <p className="audio-sheet__lesson-source-expanded">{lessonSource}</p> : null}
          </div>
        </div>

        {videoSlot ? <div className="audio-sheet__video-slot">{videoSlot}</div> : null}

        <div className="audio-sheet__body">
          <div className="audio-sheet__transcript-scroll" data-lesson-media-transcript-scroll>
            <div className="audio-sheet__transcript">
              <MediaModeLessonContent
                sentences={sentences}
                wordDomIdPrefix="lesson-media"
                clickedWords={clickedWords}
                lingqWords={lingqWords}
                knownWords={knownWords}
                ignoredWords={ignoredWords}
                onWordClick={onWordClick}
              />
            </div>
          </div>

          <div
            className={[
              'audio-sheet__expanded-controls',
              videoSlot ? 'audio-sheet__expanded-controls--video' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <div className="audio-sheet__controls-gradient" />
            <div
              className={[
                'audio-sheet__controls-inner',
                videoSlot ? 'audio-sheet__controls-inner--video' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {!videoSlot ? (
                <>
                  <div className="audio-sheet__scrubber-wrap">
                    <div className="audio-sheet__scrubber-track">
                      <div className="audio-sheet__scrubber-fill" />
                      <div className="audio-sheet__scrubber-thumb" />
                    </div>
                  </div>
                  <div className="audio-sheet__transport">
                    <button type="button" className="audio-sheet__icon-btn" aria-label="Skip back 5 seconds">
                      <img src={playerBack} alt="" width={18} height={18} />
                    </button>
                    <button type="button" className="audio-sheet__play-btn" onClick={onTogglePause} aria-label={isPaused ? 'Play' : 'Pause'}>
                      {isPaused ? <Play size={24} /> : <Pause size={24} />}
                    </button>
                    <button type="button" className="audio-sheet__icon-btn" aria-label="Skip forward 5 seconds">
                      <img src={playerForward} alt="" width={18} height={18} />
                    </button>
                  </div>
                </>
              ) : null}
              <div className={bottomActionsClass}>
                <div className="audio-sheet__bottom-actions-start">
                  <button
                    type="button"
                    className="audio-sheet__icon-btn"
                    aria-label={isVideo ? 'Return to reader' : 'Minimize player'}
                    onClick={onMinimize}
                  >
                    <ChevronDown size={18} strokeWidth={2} />
                  </button>
                </div>
                <div className="audio-sheet__bottom-actions-middle">
                  <div
                    className={['audio-sheet__menu-pill', wordSelectionActive && 'audio-sheet__menu-pill--expanded']
                      .filter(Boolean)
                      .join(' ')}
                    role="toolbar"
                    aria-label={toolbarAriaLabel}
                  >
                    <div className="audio-sheet__menu-pill-inner">
                      {wordSelectionActive ? (
                        <>
                          <button
                            type="button"
                            className="audio-sheet__menu-pill-btn audio-sheet__menu-pill-btn--icon"
                            aria-label={toolbarPlayPaused ? 'Play' : 'Pause'}
                            onClick={handleToolbarPlay}
                          >
                            {toolbarPlayPaused ? <Play size={18} strokeWidth={2} /> : <Pause size={18} strokeWidth={2} />}
                          </button>
                          <button
                            type="button"
                            className="audio-sheet__menu-pill-btn audio-sheet__menu-pill-btn--icon"
                            aria-label="Inspect sentence"
                            onClick={e => {
                              e.stopPropagation();
                              onInspectSentence?.();
                            }}
                          >
                            <img src={reviewDefaultIcon} alt="" width={18} height={18} className="audio-sheet__menu-pill-icon" />
                          </button>
                          <button
                            type="button"
                            className="audio-sheet__menu-pill-btn audio-sheet__menu-pill-btn--icon"
                            aria-label="Translation"
                            onClick={e => {
                              e.stopPropagation();
                              onShowTranslation?.();
                            }}
                          >
                            <Languages size={18} strokeWidth={2} />
                          </button>
                        </>
                      ) : null}
                      <button type="button" className="audio-sheet__menu-pill-btn" aria-label="Playback speed">
                        1x
                      </button>
                      <button type="button" className="audio-sheet__menu-pill-btn" aria-label="Repeat">
                        <img src={playerRepeat} alt="" width={18} height={18} />
                      </button>
                      <button type="button" className="audio-sheet__menu-pill-btn" aria-label="Sentence">
                        <img src={sentenceDefaultIcon} alt="" width={20} height={20} className="audio-sheet__menu-pill-icon" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
