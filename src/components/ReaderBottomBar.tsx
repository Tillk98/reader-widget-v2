import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Youtube,
  FileText,
  ChevronsUpDown,
  Bot,
  PictureInPicture,
  CaseSensitive,
  ChartColumn,
  Info,
  RefreshCw,
  Settings,
  LogOut,
} from 'lucide-react';
import type { LingQStatusType } from './LingQStatusBar';
import { ActiveSelectionBar } from './ActiveSelectionBar';
import sentenceDefaultIcon from '../assets/sentence-default.png';
import reviewDefaultIcon from '../assets/review-default.png';
import './ReaderBottomBar.css';

export interface ReaderBottomBarProps {
  mediaMode?: 'none' | 'video';
  isVideoPlaying?: boolean;
  lessonImageSrc?: string;
  selectedWordId?: string | null;
  selectedWordStatus?: LingQStatusType;
  onSelectedWordStatusChange?: (status: LingQStatusType) => void;
  onPlay?: () => void;
  onToggleVideoPlayback?: () => void;
  onExpandVideoBar?: () => void;
  onSentence?: () => void;
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
}

/** After the sheet is open, wait this long before swapping the LingQ strip for the default play / menu row. */
const WORD_DETAIL_DEFAULT_CHROME_DELAY_MS = 1000;

const EXPANDED_SECONDARY_ITEMS: { id: string; label: string; icon: React.ReactNode }[] = [
  { id: 'lynx', label: 'Lynx AI', icon: <Bot size={20} /> },
  { id: 'simplify', label: 'Simplify', icon: <PictureInPicture size={20} /> },
  { id: 'theme', label: 'Theme', icon: <CaseSensitive size={20} /> },
  { id: 'grammar', label: 'Grammar', icon: <FileText size={20} /> },
  { id: 'statistics', label: 'Statistics', icon: <ChartColumn size={20} /> },
  { id: 'info', label: 'Info', icon: <Info size={20} /> },
  { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
];

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
}) => {
  const [isActionsExpanded, setIsActionsExpanded] = useState(false);
  const [defaultChromeAfterSheetDelay, setDefaultChromeAfterSheetDelay] = useState(false);
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
   * In video mode (inline lesson + video bar), the strip hides after the delay but is not replaced
   * by the default row — there is no separate default menu in that layout.
   */
  const showDefaultChrome =
    !hasWordSelected ||
    (wordDetailSheetOpen && defaultChromeAfterSheetDelay && mediaMode !== 'video');
  /** LingQ strip: word selected, and either sheet not open yet or still inside the pre-default delay while sheet is open. */
  const showActiveSelection =
    hasWordSelected &&
    (!wordDetailSheetOpen || !defaultChromeAfterSheetDelay);

  /** Keep default chrome in DOM while morphing out so the pill can transition into the LingQ strip (page mode only). */
  const renderDefaultChromeLayer =
    showDefaultChrome || (hasWordSelected && showActiveSelection && mediaMode === 'none');
  const isDefaultChromeMorphingOut =
    hasWordSelected && showActiveSelection && mediaMode === 'none' && !showDefaultChrome;

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
    setIsActionsExpanded(prev => !prev);
    onChevrons?.();
  };

  const expandedHandlers: Record<string, (() => void) | undefined> = {
    lynx: onLynxAI,
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
                  className="reader-bottom-bar-menu-btn"
                  onClick={onSentence}
                  aria-label="Sentence"
                >
                  <img src={sentenceDefaultIcon} alt="" className="reader-bottom-bar-custom-icon" />
                </button>
                <button
                  type="button"
                  className="reader-bottom-bar-menu-btn"
                  onClick={onReview}
                  aria-label="Review"
                >
                  <img src={reviewDefaultIcon} alt="" className="reader-bottom-bar-custom-icon" />
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
              <div className="reader-bottom-bar-expanded-menu">
                <div className="reader-bottom-bar-expanded-secondary">
                  {EXPANDED_SECONDARY_ITEMS.map(({ id, label, icon }) => (
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
                <div className="reader-bottom-bar-expanded-primary">
                  <button
                    type="button"
                    className="reader-bottom-bar-expanded-item reader-bottom-bar-expanded-item--primary-refresh"
                    onClick={() => onRefresh?.()}
                    aria-label="Refresh"
                  >
                    <span className="reader-bottom-bar-expanded-icon reader-bottom-bar-expanded-icon--primary-refresh">
                      <RefreshCw size={20} />
                    </span>
                    <span className="reader-bottom-bar-expanded-label">Refresh</span>
                  </button>
                  <button
                    type="button"
                    className="reader-bottom-bar-expanded-item reader-bottom-bar-expanded-item--primary-exit"
                    onClick={() => onExit?.()}
                    aria-label="Exit"
                  >
                    <span className="reader-bottom-bar-expanded-icon reader-bottom-bar-expanded-icon--primary-exit">
                      <LogOut size={20} />
                    </span>
                    <span className="reader-bottom-bar-expanded-label">Exit</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showActiveSelection && (
          <ActiveSelectionBar
            key={selectedWordId ?? 'selection'}
            selectedWordId={selectedWordId}
            selectedWordStatus={selectedWordStatus}
            onSelectedWordStatusChange={onSelectedWordStatusChange!}
          />
        )}
      </div>
    </div>
  );

  return bar;
};
