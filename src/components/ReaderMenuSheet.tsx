import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Languages,
  RefreshCw,
  ListPlus,
  Plus,
  Play,
  CaseSensitive,
  Settings,
} from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import lynxDefaultIcon from '../assets/lynx-default.png';
import reviewDefaultIcon from '../assets/review-default.png';
import './ReaderMenuSheet.css';

export interface ReaderMenuSheetProps {
  open: boolean;
  onClose: () => void;
  lessonTitle: string;
  lessonSource?: string;
  lessonImageSrc?: string;
  /** Lesson position within course, e.g. "1/5". */
  lessonPageLabel?: string;
  onPreviousLesson?: () => void;
  onNextLesson?: () => void;
  onShowTranslationChange?: (on: boolean) => void;
  onRefresh?: () => void;
  onAddToPlaylist?: () => void;
  onTheme?: () => void;
  onSettings?: () => void;
  onHelp?: () => void;
  /** Swiping the sheet up expands into the full-page course info. */
  onExpand?: () => void;
  /** When true, the first section becomes SENTENCE MODE (translation / vocab list / autoplay). */
  sentenceMode?: boolean;
}

const ICON_STROKE = 1.75;

export const ReaderMenuSheet: React.FC<ReaderMenuSheetProps> = ({
  open,
  onClose,
  lessonTitle,
  lessonSource,
  lessonImageSrc,
  lessonPageLabel = '1/5',
  onPreviousLesson,
  onNextLesson,
  onShowTranslationChange,
  onRefresh,
  onAddToPlaylist,
  onTheme,
  onSettings,
  onHelp,
  onExpand,
  sentenceMode = false,
}) => {
  const [translationOn, setTranslationOn] = useState(false);
  const [vocabListOn, setVocabListOn] = useState(true);
  const [autoPlayOn, setAutoPlayOn] = useState(false);

  const toggleTranslation = () => {
    setTranslationOn(prev => {
      const next = !prev;
      onShowTranslationChange?.(next);
      return next;
    });
  };

  return (
    <BottomSheet open={open} onClose={onClose} dragWholeCard ariaLabel="Lesson menu">
      <div className="reader-menu">
        <div className="reader-menu__header">
          <button
            type="button"
            className="reader-menu__nav-btn"
            onClick={onPreviousLesson}
            aria-label="Previous lesson"
          >
            <ChevronLeft size={16} strokeWidth={ICON_STROKE} />
          </button>
          <button
            type="button"
            className="reader-menu__lesson"
            onClick={onExpand}
            aria-label="Open course details"
          >
            <div className="reader-menu__lesson-image">
              {lessonImageSrc ? <img src={lessonImageSrc} alt="" /> : null}
            </div>
            <div className="reader-menu__lesson-meta">
              <p className="reader-menu__lesson-title">{lessonTitle}</p>
              <div className="reader-menu__lesson-course">
                {lessonSource ? (
                  <span className="reader-menu__lesson-course-name">{lessonSource}</span>
                ) : null}
                {lessonPageLabel ? (
                  <span className="reader-menu__lesson-page">({lessonPageLabel})</span>
                ) : null}
              </div>
            </div>
          </button>
          <button
            type="button"
            className="reader-menu__nav-btn"
            onClick={onNextLesson}
            aria-label="Next lesson"
          >
            <ChevronRight size={16} strokeWidth={ICON_STROKE} />
          </button>
        </div>

        <div className="reader-menu__content">
          {sentenceMode ? (
            <section className="reader-menu__section">
              <p className="reader-menu__section-header">Sentence Mode</p>
              <div className="reader-menu__item">
                <span className="reader-menu__item-label">
                  <Languages size={16} strokeWidth={ICON_STROKE} className="reader-menu__item-icon" aria-hidden />
                  <span className="reader-menu__item-text">Show Translation</span>
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={translationOn}
                  aria-label="Show Translation"
                  className={`reader-menu__toggle ${translationOn ? 'reader-menu__toggle--on' : ''}`}
                  onClick={toggleTranslation}
                >
                  <span className="reader-menu__toggle-knob" />
                </button>
              </div>
              <div className="reader-menu__item">
                <span className="reader-menu__item-label">
                  <img
                    src={reviewDefaultIcon}
                    alt=""
                    className="reader-menu__item-icon reader-menu__item-icon--img"
                  />
                  <span className="reader-menu__item-text">Show Vocabulary List</span>
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={vocabListOn}
                  aria-label="Show Vocabulary List"
                  className={`reader-menu__toggle ${vocabListOn ? 'reader-menu__toggle--on' : ''}`}
                  onClick={() => setVocabListOn(prev => !prev)}
                >
                  <span className="reader-menu__toggle-knob" />
                </button>
              </div>
              <div className="reader-menu__item">
                <span className="reader-menu__item-label">
                  <Play size={16} strokeWidth={ICON_STROKE} className="reader-menu__item-icon" aria-hidden />
                  <span className="reader-menu__item-text">Auto-Play Sentence Audio</span>
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={autoPlayOn}
                  aria-label="Auto-Play Sentence Audio"
                  className={`reader-menu__toggle ${autoPlayOn ? 'reader-menu__toggle--on' : ''}`}
                  onClick={() => setAutoPlayOn(prev => !prev)}
                >
                  <span className="reader-menu__toggle-knob" />
                </button>
              </div>
            </section>
          ) : (
            <section className="reader-menu__section">
              <p className="reader-menu__section-header">Page Mode</p>
              <div className="reader-menu__item">
                <span className="reader-menu__item-label">
                  <Languages size={16} strokeWidth={ICON_STROKE} className="reader-menu__item-icon" aria-hidden />
                  <span className="reader-menu__item-text">Show Translation</span>
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={translationOn}
                  aria-label="Show Translation"
                  className={`reader-menu__toggle ${translationOn ? 'reader-menu__toggle--on' : ''}`}
                  onClick={toggleTranslation}
                >
                  <span className="reader-menu__toggle-knob" />
                </button>
              </div>
            </section>
          )}

          <div className="reader-menu__divider" role="separator" aria-hidden="true" />

          <section className="reader-menu__section">
            <p className="reader-menu__section-header">Actions</p>
            <button type="button" className="reader-menu__item reader-menu__item--button" onClick={onRefresh}>
              <span className="reader-menu__item-label">
                <RefreshCw size={16} strokeWidth={ICON_STROKE} className="reader-menu__item-icon" aria-hidden />
                <span className="reader-menu__item-text">Refresh</span>
              </span>
              <span className="reader-menu__item-aside">10m ago</span>
            </button>
            <button type="button" className="reader-menu__item reader-menu__item--button" onClick={onAddToPlaylist}>
              <span className="reader-menu__item-label">
                <ListPlus size={16} strokeWidth={ICON_STROKE} className="reader-menu__item-icon" aria-hidden />
                <span className="reader-menu__item-text">Add to Playlist</span>
              </span>
              <span className="reader-menu__tag reader-menu__add-tag" aria-hidden>
                <Plus size={16} strokeWidth={ICON_STROKE} />
                <span className="reader-menu__add-label">Add</span>
              </span>
            </button>
          </section>

          <div className="reader-menu__divider" role="separator" aria-hidden="true" />

          <section className="reader-menu__section">
            <p className="reader-menu__section-header">App</p>
            <button type="button" className="reader-menu__item reader-menu__item--button" onClick={onTheme}>
              <span className="reader-menu__item-label">
                <CaseSensitive size={16} strokeWidth={ICON_STROKE} className="reader-menu__item-icon" aria-hidden />
                <span className="reader-menu__item-text">Theme</span>
              </span>
            </button>
            <button type="button" className="reader-menu__item reader-menu__item--button" onClick={onSettings}>
              <span className="reader-menu__item-label">
                <Settings size={16} strokeWidth={ICON_STROKE} className="reader-menu__item-icon" aria-hidden />
                <span className="reader-menu__item-text">Settings</span>
              </span>
            </button>
            <button type="button" className="reader-menu__item reader-menu__item--button" onClick={onHelp}>
              <span className="reader-menu__item-label">
                <img src={lynxDefaultIcon} alt="" className="reader-menu__item-icon reader-menu__item-icon--img" />
                <span className="reader-menu__item-text">Help</span>
              </span>
              <span className="reader-menu__item-aside reader-menu__item-aside--link">
                Chat with Lynx
                <ChevronRight size={14} strokeWidth={ICON_STROKE} aria-hidden />
              </span>
            </button>
          </section>
        </div>
      </div>
    </BottomSheet>
  );
};
