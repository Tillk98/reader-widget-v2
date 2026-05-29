import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Youtube,
  FileText,
  ChevronsUpDown,
  PictureInPicture,
  CaseSensitive,
  ChartColumn,
  Info,
  RefreshCw,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Languages,
  LineChart,
} from 'lucide-react';
import type { LingQStatusType } from './LingQStatusBar';
import { ActiveSelectionBar } from './ActiveSelectionBar';
import { ReaderMenuSheet } from './ReaderMenuSheet';
import { CourseInfoSheet } from './CourseInfoSheet';
import sentenceDefaultIcon from '../assets/sentence-default.png';
import sentenceActiveIcon from '../assets/sentence-active.png';
import lynxDefaultIcon from '../assets/lynx-default.png';
import reviewDefaultIcon from '../assets/review-default.png';
import reviewActiveIcon from '../assets/review-active.png';
import simplifyDefaultIcon from '../assets/simplify-default.png';
import './ReaderBottomBar.css';

export interface ReaderBottomBarProps {
  mediaMode?: 'none' | 'video' | 'audio';
  isVideoPlaying?: boolean;
  lessonImageSrc?: string;
  selectedWordId?: string | null;
  selectedWordStatus?: LingQStatusType;
  onSelectedWordStatusChange?: (status: LingQStatusType) => void;
  onPlay?: () => void;
  onToggleVideoPlayback?: () => void;
  onExpandVideoBar?: () => void;
  onSentence?: () => void;
  /** Controlled sentence-mode toggle state. When provided, the sentence button reflects this. */
  sentenceModeActive?: boolean;
  onReview?: () => void;
  onChevrons?: () => void;
  onLynxAI?: () => void;
  onSimplify?: () => void;
  onTheme?: () => void;
  onGrammar?: () => void;
  onStatistics?: () => void;
  onInfo?: () => void;
  onRefresh?: () => void;
  onSettings?: () => void;
  onExit?: () => void;
  hasVideo?: boolean;
  onVideoMode?: () => void;
  /** In video mode: distance from viewport bottom to anchor this bar above the fixed lesson video bar (px). */
  anchorAboveVideoBarPx?: number;
  /** Word detail (meanings) bottom sheet is open — after a short delay the LingQ strip yields to the default row. */
  wordDetailSheetOpen?: boolean;
  /** Expanded chevron menu: `list` (default) or `grid`. */
  expandedMenuLayout?: 'grid' | 'list';
  /** Expanded list menu header (e.g. course name). */
  menuHeaderTitle?: string;
  /** Expanded list menu subtitle (e.g. lesson progress). */
  menuHeaderSubtitle?: string;
  /** Reader menu sheet: lesson title / course / position. */
  lessonTitle?: string;
  lessonSource?: string;
  lessonPageLabel?: string;
  onMenuPreviousLesson?: () => void;
  onMenuNextLesson?: () => void;
  onShowTranslation?: () => void;
  /** When true, collapsed audio mini was the bottom bar — skip the default play/menu morph into LingQ (avoids a one-frame flash of default chrome). */
  audioMiniActive?: boolean;
}

/** After the sheet is open, wait this long before swapping the LingQ strip for the default play / menu row. */
const WORD_DETAIL_DEFAULT_CHROME_DELAY_MS = 1000;

/** Lucide stroke width for expanded list menu (Figma 1.5px). */
const MENU_ICON_STROKE = 1.5;

const EXPANDED_SECONDARY_ITEMS: { id: string; label: string; icon: React.ReactNode }[] = [
  {
    id: 'review',
    label: 'Review',
    icon: <img src={reviewDefaultIcon} alt="" className="reader-bottom-bar-expanded-tool-img" />,
  },
  { id: 'simplify', label: 'Simplify', icon: <PictureInPicture size={20} /> },
  { id: 'theme', label: 'Theme', icon: <CaseSensitive size={20} /> },
  { id: 'grammar', label: 'Grammar', icon: <FileText size={20} /> },
  { id: 'statistics', label: 'Statistics', icon: <ChartColumn size={20} /> },
  { id: 'info', label: 'Info', icon: <Info size={20} /> },
  { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
];

/** First six: Review … Info (3-column grid). Settings sits with Refresh / Exit in the next group. */
const EXPANDED_MENU_GRID_MAIN = EXPANDED_SECONDARY_ITEMS.slice(0, 6);
const EXPANDED_MENU_SETTINGS_ITEM = EXPANDED_SECONDARY_ITEMS[6]!;

export const ReaderBottomBar: React.FC<ReaderBottomBarProps> = ({
  mediaMode = 'none',
  isVideoPlaying = false,
  lessonImageSrc,
  selectedWordId,
  selectedWordStatus = 'New',
  onSelectedWordStatusChange,
  onPlay,
  onToggleVideoPlayback,
  onExpandVideoBar,
  onSentence,
  sentenceModeActive,
  onReview,
  onChevrons,
  onLynxAI,
  onSimplify,
  onTheme,
  onGrammar,
  onStatistics,
  onInfo,
  onRefresh,
  onSettings,
  onExit,
  hasVideo = false,
  onVideoMode,
  anchorAboveVideoBarPx,
  wordDetailSheetOpen = false,
  expandedMenuLayout = 'list',
  menuHeaderTitle,
  menuHeaderSubtitle,
  lessonTitle,
  lessonSource,
  lessonPageLabel,
  onMenuPreviousLesson,
  onMenuNextLesson,
  onShowTranslation,
  audioMiniActive = false,
}) => {
  const [isActionsExpanded, setIsActionsExpanded] = useState(false);
  const [menuSheetOpen, setMenuSheetOpen] = useState(false);
  const [courseInfoOpen, setCourseInfoOpen] = useState(false);
  const [defaultChromeAfterSheetDelay, setDefaultChromeAfterSheetDelay] = useState(false);
  /** Mutually exclusive reader tool toggle (Figma SentenceActive / ReviewActive states). */
  const [activeTool, setActiveTool] = useState<'none' | 'review' | 'sentence'>('none');
  const actionsContainerRef = useRef<HTMLDivElement>(null);

  const hasWordSelected = selectedWordId != null;

  useEffect(() => {
    if (!wordDetailSheetOpen) {
      setDefaultChromeAfterSheetDelay(false);
      return;
    }
    const id = window.setTimeout(() => {
      setDefaultChromeAfterSheetDelay(true);
    }, WORD_DETAIL_DEFAULT_CHROME_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [wordDetailSheetOpen]);

  /**
   * Default play / menu row when no word selected, or after word-detail sheet delay in page mode.
   * In video / audio lesson mode (inline lesson + media bar), the strip hides after the delay but is not replaced
   * by the default row — there is no separate default menu in that layout.
   */
  const isLessonMediaMode = mediaMode === 'video' || mediaMode === 'audio';
  const showDefaultChrome =
    !hasWordSelected ||
    (wordDetailSheetOpen && defaultChromeAfterSheetDelay && !isLessonMediaMode);
  /** LingQ strip: word selected, and either sheet not open yet or still inside the pre-default delay while sheet is open. */
  const showActiveSelection =
    hasWordSelected &&
    (!wordDetailSheetOpen || !defaultChromeAfterSheetDelay);

  /** Keep default chrome in DOM while morphing out so the pill can transition into the LingQ strip (page mode only).
   * Skip morph when opening LingQ from collapsed audio mini — there is no default row to morph from. */
  const renderDefaultChromeLayer =
    showDefaultChrome ||
    (hasWordSelected && showActiveSelection && mediaMode === 'none' && !audioMiniActive);
  const isDefaultChromeMorphingOut =
    hasWordSelected &&
    showActiveSelection &&
    mediaMode === 'none' &&
    !showDefaultChrome &&
    !audioMiniActive;

  useEffect(() => {
    if (!isActionsExpanded) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (actionsContainerRef.current && !actionsContainerRef.current.contains(e.target as Node)) {
        setIsActionsExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isActionsExpanded]);

  const handleChevronClick = () => {
    setMenuSheetOpen(true);
    onChevrons?.();
  };

  const handleReviewClick = () => {
    setActiveTool(prev => (prev === 'review' ? 'none' : 'review'));
    onReview?.();
  };

  /** Sentence mode is controlled by the Reader when `sentenceModeActive` is provided. */
  const sentenceActive = sentenceModeActive ?? activeTool === 'sentence';

  const handleSentenceClick = () => {
    if (sentenceModeActive === undefined) {
      setActiveTool(prev => (prev === 'sentence' ? 'none' : 'sentence'));
    } else if (activeTool === 'sentence') {
      setActiveTool('none');
    }
    onSentence?.();
  };

  const expandedHandlers: Record<string, (() => void) | undefined> = {
    review: onReview,
    simplify: onSimplify,
    theme: onTheme,
    grammar: onGrammar,
    statistics: onStatistics,
    info: onInfo,
    settings: onSettings,
  };

  const bar = (
    <div
      className={[
        'reader-bottom-bar',
        anchorAboveVideoBarPx != null && anchorAboveVideoBarPx > 0 ? 'reader-bottom-bar--above-video-bar' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={
        anchorAboveVideoBarPx != null && anchorAboveVideoBarPx > 0
          ? { bottom: anchorAboveVideoBarPx }
          : undefined
      }
    >
      <div
        className={`reader-bottom-bar-inner ${showActiveSelection ? 'reader-bottom-bar-inner--stack' : ''}`}
      >
        {renderDefaultChromeLayer && (
          <div
            className={[
              'reader-bottom-bar-default-row',
              isDefaultChromeMorphingOut && 'reader-bottom-bar-default-row--morph-out',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-hidden={isDefaultChromeMorphingOut}
          >
            <div className="reader-bottom-bar-play-area">
              <div
                className={[
                  'reader-bottom-bar-play-pill',
                  'reader-bottom-bar-play-pill--morph',
                  isVideoPlaying ? 'reader-bottom-bar-play-pill--playing' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {/* Inner clips morph animation; outer keeps overflow visible so hover box-shadow is not clipped. */}
                <div className="reader-bottom-bar-play-pill__morph-inner">
                  <button
                    type="button"
                    className="reader-bottom-bar-play-btn"
                    onClick={() => {
                      if (isVideoPlaying) {
                        onToggleVideoPlayback?.();
                      } else {
                        onPlay?.();
                      }
                    }}
                    aria-label={isVideoPlaying ? 'Pause' : 'Play'}
                  >
                    {isVideoPlaying ? (
                      <Pause size={24} className="reader-bottom-bar-play-pause-icon" />
                    ) : (
                      <Play size={24} className="reader-bottom-bar-play-pause-icon" />
                    )}
                  </button>
                  <button
                    type="button"
                    className={[
                      'reader-bottom-bar-lesson-image-wrap',
                      'reader-bottom-bar-lesson-image-wrap--morph',
                      isVideoPlaying ? 'reader-bottom-bar-lesson-image-wrap--visible' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={onExpandVideoBar}
                    aria-label="Open video player"
                    tabIndex={isVideoPlaying ? 0 : -1}
                    aria-hidden={!isVideoPlaying}
                  >
                    {lessonImageSrc ? (
                      <img src={lessonImageSrc} alt="" className="reader-bottom-bar-lesson-image" />
                    ) : null}
                  </button>
                </div>
              </div>
              {hasVideo && (
                <button
                  type="button"
                  className="reader-bottom-bar-video-btn"
                  onClick={onVideoMode}
                  aria-label="Video mode"
                >
                  <Youtube size={18} className="reader-bottom-bar-video-icon" />
                </button>
              )}
            </div>

            <div
              ref={actionsContainerRef}
              className={`reader-bottom-bar-actions-container ${isActionsExpanded ? 'expanded' : 'collapsed'}`}
              aria-expanded={isActionsExpanded}
            >
              <div className="reader-bottom-bar-pill">
                <button
                  type="button"
                  className={[
                    'reader-bottom-bar-menu-btn',
                    activeTool === 'review' && 'reader-bottom-bar-menu-btn--active-review',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={handleReviewClick}
                  aria-label="Review"
                  aria-pressed={activeTool === 'review'}
                >
                  <img
                    src={activeTool === 'review' ? reviewActiveIcon : reviewDefaultIcon}
                    alt=""
                    className="reader-bottom-bar-custom-icon"
                  />
                </button>
                <button
                  type="button"
                  className={[
                    'reader-bottom-bar-menu-btn',
                    sentenceActive && 'reader-bottom-bar-menu-btn--active-sentence',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={handleSentenceClick}
                  aria-label="Sentence"
                  aria-pressed={sentenceActive}
                >
                  <img
                    src={sentenceActive ? sentenceActiveIcon : sentenceDefaultIcon}
                    alt=""
                    className="reader-bottom-bar-custom-icon"
                  />
                </button>
                <button
                  type="button"
                  className="reader-bottom-bar-menu-btn reader-bottom-bar-chevron-btn"
                  onClick={handleChevronClick}
                  aria-label="Expand menu"
                  aria-expanded={isActionsExpanded}
                >
                  <ChevronsUpDown size={24} />
                </button>
              </div>
              <div
                className={[
                  'reader-bottom-bar-expanded-menu',
                  expandedMenuLayout === 'grid'
                    ? 'reader-bottom-bar-expanded-menu--grid'
                    : 'reader-bottom-bar-expanded-menu--list',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {expandedMenuLayout === 'list' ? (
                  <div className="reader-bottom-bar-menu-list">
                    <div className="reader-bottom-bar-menu-list__header">
                      <button
                        type="button"
                        className="reader-bottom-bar-menu-nav-btn reader-bottom-bar-menu-nav-btn--sm"
                        onClick={() => onMenuPreviousLesson?.()}
                        aria-label="Previous lesson"
                      >
                        <ChevronLeft size={18} strokeWidth={MENU_ICON_STROKE} />
                      </button>
                      <div className="reader-bottom-bar-menu-list__header-text">
                        {menuHeaderTitle ? (
                          <p className="reader-bottom-bar-menu-list__title">{menuHeaderTitle}</p>
                        ) : null}
                        {menuHeaderSubtitle ? (
                          <p className="reader-bottom-bar-menu-list__subtitle">{menuHeaderSubtitle}</p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        className="reader-bottom-bar-menu-nav-btn reader-bottom-bar-menu-nav-btn--sm"
                        onClick={() => onMenuNextLesson?.()}
                        aria-label="Next lesson"
                      >
                        <ChevronRight size={18} strokeWidth={MENU_ICON_STROKE} />
                      </button>
                    </div>
                    <div
                      className="reader-bottom-bar-menu-list__divider"
                      role="separator"
                      aria-hidden="true"
                    />
                    <div className="reader-bottom-bar-menu-list__section reader-bottom-bar-menu-list__section--body">
                      <button
                        type="button"
                        className="reader-bottom-bar-menu-list__row"
                        onClick={() => onShowTranslation?.()}
                        aria-label="Show Translation"
                      >
                        <span className="reader-bottom-bar-menu-list__icon" aria-hidden="true">
                          <Languages size={18} strokeWidth={MENU_ICON_STROKE} />
                        </span>
                        <span className="reader-bottom-bar-menu-list__label">Show Translation</span>
                      </button>
                      <button
                        type="button"
                        className="reader-bottom-bar-menu-list__row"
                        onClick={() => onSimplify?.()}
                        aria-label="Simplify"
                      >
                        <span className="reader-bottom-bar-menu-list__icon" aria-hidden="true">
                          <img
                            src={simplifyDefaultIcon}
                            alt=""
                            className="reader-bottom-bar-menu-list__icon-img"
                          />
                        </span>
                        <span className="reader-bottom-bar-menu-list__label">Simplify</span>
                      </button>
                      <button
                        type="button"
                        className="reader-bottom-bar-menu-list__row"
                        onClick={() => onTheme?.()}
                        aria-label="Theme"
                      >
                        <span className="reader-bottom-bar-menu-list__icon" aria-hidden="true">
                          <CaseSensitive size={18} strokeWidth={MENU_ICON_STROKE} />
                        </span>
                        <span className="reader-bottom-bar-menu-list__label">Theme</span>
                      </button>
                      <button
                        type="button"
                        className="reader-bottom-bar-menu-list__row"
                        onClick={() => onGrammar?.()}
                        aria-label="Grammar Guide"
                      >
                        <span className="reader-bottom-bar-menu-list__icon" aria-hidden="true">
                          <FileText size={18} strokeWidth={MENU_ICON_STROKE} />
                        </span>
                        <span className="reader-bottom-bar-menu-list__label">Grammar Guide</span>
                      </button>
                      <button
                        type="button"
                        className="reader-bottom-bar-menu-list__row"
                        onClick={() => onStatistics?.()}
                        aria-label="Statistics"
                      >
                        <span className="reader-bottom-bar-menu-list__icon" aria-hidden="true">
                          <LineChart size={18} strokeWidth={MENU_ICON_STROKE} />
                        </span>
                        <span className="reader-bottom-bar-menu-list__label">Statistics</span>
                      </button>
                      <button
                        type="button"
                        className="reader-bottom-bar-menu-list__row"
                        onClick={() => onRefresh?.()}
                        aria-label="Refresh Lesson"
                      >
                        <span className="reader-bottom-bar-menu-list__icon" aria-hidden="true">
                          <RefreshCw size={18} strokeWidth={MENU_ICON_STROKE} />
                        </span>
                        <span className="reader-bottom-bar-menu-list__label">Refresh Lesson</span>
                      </button>
                      <button
                        type="button"
                        className="reader-bottom-bar-menu-list__row"
                        onClick={() => onInfo?.()}
                        aria-label="Lesson Info"
                      >
                        <span className="reader-bottom-bar-menu-list__icon" aria-hidden="true">
                          <Info size={18} strokeWidth={MENU_ICON_STROKE} />
                        </span>
                        <span className="reader-bottom-bar-menu-list__label">Lesson Info</span>
                      </button>
                    </div>
                    <div
                      className="reader-bottom-bar-menu-list__divider"
                      role="separator"
                      aria-hidden="true"
                    />
                    <div className="reader-bottom-bar-menu-list__section reader-bottom-bar-menu-list__section--footer">
                      <button
                        type="button"
                        className="reader-bottom-bar-menu-list__row"
                        onClick={() => onExit?.()}
                        aria-label="Exit Lesson"
                      >
                        <span className="reader-bottom-bar-menu-list__icon" aria-hidden="true">
                          <LogOut size={18} strokeWidth={MENU_ICON_STROKE} />
                        </span>
                        <span className="reader-bottom-bar-menu-list__label">Exit Lesson</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div
                      className="reader-bottom-bar-expanded-grid"
                      role="group"
                      aria-label="Tools"
                    >
                      {EXPANDED_MENU_GRID_MAIN.map(({ id, label, icon }) => (
                        <button
                          key={id}
                          type="button"
                          className="reader-bottom-bar-expanded-item"
                          onClick={() => expandedHandlers[id]?.()}
                          aria-label={label}
                        >
                          <span className="reader-bottom-bar-expanded-icon">{icon}</span>
                          <span className="reader-bottom-bar-expanded-label">{label}</span>
                        </button>
                      ))}
                    </div>
                    <div className="reader-bottom-bar-expanded-divider" role="separator" aria-hidden="true" />
                    <div
                      className="reader-bottom-bar-expanded-grid"
                      role="group"
                      aria-label="Settings and session"
                    >
                      <button
                        type="button"
                        className="reader-bottom-bar-expanded-item"
                        onClick={() => expandedHandlers.settings?.()}
                        aria-label={EXPANDED_MENU_SETTINGS_ITEM.label}
                      >
                        <span className="reader-bottom-bar-expanded-icon">{EXPANDED_MENU_SETTINGS_ITEM.icon}</span>
                        <span className="reader-bottom-bar-expanded-label">{EXPANDED_MENU_SETTINGS_ITEM.label}</span>
                      </button>
                      <button
                        type="button"
                        className="reader-bottom-bar-expanded-item"
                        onClick={() => onRefresh?.()}
                        aria-label="Refresh"
                      >
                        <span className="reader-bottom-bar-expanded-icon">
                          <RefreshCw size={20} />
                        </span>
                        <span className="reader-bottom-bar-expanded-label">Refresh</span>
                      </button>
                      <button
                        type="button"
                        className="reader-bottom-bar-expanded-item"
                        onClick={() => onExit?.()}
                        aria-label="Exit"
                      >
                        <span className="reader-bottom-bar-expanded-icon">
                          <LogOut size={20} />
                        </span>
                        <span className="reader-bottom-bar-expanded-label">Exit</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
            <button
              type="button"
              className="reader-bottom-bar-side-btn"
              onClick={onLynxAI}
              aria-label="Lynx AI"
            >
              <img src={lynxDefaultIcon} alt="" className="reader-bottom-bar-side-btn-icon" />
            </button>
          </div>
        )}

        {showActiveSelection && (
          <ActiveSelectionBar
            key={selectedWordId ?? 'selection'}
            selectedWordId={selectedWordId}
            selectedWordStatus={selectedWordStatus}
            onSelectedWordStatusChange={onSelectedWordStatusChange!}
            onLynx={onLynxAI}
          />
        )}
      </div>
    </div>
  );

  return (
    <>
      {bar}
      <ReaderMenuSheet
        open={menuSheetOpen}
        onClose={() => setMenuSheetOpen(false)}
        sentenceMode={sentenceActive}
        lessonTitle={lessonTitle ?? menuHeaderTitle ?? ''}
        lessonSource={lessonSource}
        lessonImageSrc={lessonImageSrc}
        lessonPageLabel={lessonPageLabel}
        onPreviousLesson={onMenuPreviousLesson}
        onNextLesson={onMenuNextLesson}
        onShowTranslationChange={() => onShowTranslation?.()}
        onRefresh={onRefresh}
        onTheme={onTheme}
        onSettings={onSettings}
        onHelp={onLynxAI}
        onExpand={() => {
          // Bring up the full-page sheet first; it rises over the menu and
          // covers it, so the menu can unmount behind it without a visible
          // slide-off-screen.
          setCourseInfoOpen(true);
          window.setTimeout(() => setMenuSheetOpen(false), 320);
        }}
      />
      <CourseInfoSheet
        open={courseInfoOpen}
        onClose={() => setCourseInfoOpen(false)}
        courseTitle={lessonSource ?? lessonTitle ?? menuHeaderTitle ?? ''}
        heroImageSrc={lessonImageSrc}
        lessonImageSrc={lessonImageSrc}
        lessonCourse={lessonSource ?? ''}
        lessonTitle={lessonTitle ?? menuHeaderTitle ?? ''}
      />
    </>
  );
};
