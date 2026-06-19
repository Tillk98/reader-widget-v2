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
import { Menu } from './Menu';
import { MenuItem } from './MenuItem';
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
  /** Controlled state for the horizontal term list toggle (sentence mode only). */
  horizontalListOn?: boolean;
  onHorizontalListChange?: (on: boolean) => void;
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

  const setTranslation = (next: boolean) => {
    setTranslationOn(next);
    onShowTranslationChange?.(next);
  };

  return (
    <BottomSheet open={open} onClose={onClose} dragWholeCard ariaLabel="Lesson menu" className="reader-menu-sheet">
      <div className="reader-menu">
        <div className="reader-menu__header">
          <button
            type="button"
            className="reader-menu__nav-btn"
            onClick={onPreviousLesson}
            aria-label="Previous lesson"
          >
            <ChevronLeft size={16} strokeWidth={2} />
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
            <ChevronRight size={16} strokeWidth={2} />
          </button>
        </div>

        <div className="reader-menu__content">
          {sentenceMode ? (
            <Menu label="Sentence Mode">
              <MenuItem
                icon={<Languages size={16} strokeWidth={ICON_STROKE} aria-hidden />}
                label="Show Translation"
                toggle={translationOn}
                onToggle={setTranslation}
              />
              <MenuItem
                icon={<img src={reviewDefaultIcon} alt="" />}
                label="Show Vocabulary List"
                toggle={vocabListOn}
                onToggle={setVocabListOn}
              />
              <MenuItem
                icon={<Play size={16} strokeWidth={ICON_STROKE} aria-hidden />}
                label="Auto-Play Sentence Mode"
                toggle={autoPlayOn}
                onToggle={setAutoPlayOn}
              />
            </Menu>
          ) : (
            <Menu label="Page Mode">
              <MenuItem
                icon={<Languages size={16} strokeWidth={ICON_STROKE} aria-hidden />}
                label="Show Translation"
                toggle={translationOn}
                onToggle={setTranslation}
              />
            </Menu>
          )}

          <Menu label="Actions">
            <MenuItem
              icon={<RefreshCw size={16} strokeWidth={ICON_STROKE} aria-hidden />}
              label="Refresh"
              onClick={onRefresh}
            />
            <MenuItem
              icon={<ListPlus size={16} strokeWidth={ICON_STROKE} aria-hidden />}
              label="Add to Playlist"
              onClick={onAddToPlaylist}
              trailing={
                <span className="ui-menu-item__add" aria-hidden>
                  <Plus size={12} strokeWidth={ICON_STROKE} />
                </span>
              }
            />
          </Menu>

          <Menu label="App">
            <MenuItem
              icon={<CaseSensitive size={16} strokeWidth={ICON_STROKE} aria-hidden />}
              label="Theme"
              onClick={onTheme}
            />
            <MenuItem
              icon={<Settings size={16} strokeWidth={ICON_STROKE} aria-hidden />}
              label="Settings"
              onClick={onSettings}
            />
            <MenuItem
              icon={<img src={lynxDefaultIcon} alt="" />}
              label="Help"
              onClick={onHelp}
              trailing={
                <span className="ui-menu-item__link">
                  Chat with Lynx
                  <ChevronRight size={14} strokeWidth={ICON_STROKE} aria-hidden />
                </span>
              }
            />
          </Menu>
        </div>
      </div>
    </BottomSheet>
  );
};
