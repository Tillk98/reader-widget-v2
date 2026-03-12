import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  X,
  Youtube,
  FileText,
  ChevronsUpDown,
  Bot,
  Maximize2,
  Type,
  BarChart3,
  Info,
  RefreshCw,
  Settings,
} from 'lucide-react';
import sentenceIcon from '../assets/sentence-icon.png';
import reviewIcon from '../assets/review-icon.png';
import lessonImage from '../assets/lesson-image.png';
import './ReaderBottomBar.css';

export interface ReaderBottomBarProps {
  onPlay?: () => void;
  onPause?: () => void;
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
  onLessonImageClick?: () => void;
  hasVideo?: boolean;
  onVideoMode?: () => void;
  lessonTitle?: string;
  lessonSource?: string;
}

const EXPANDED_MENU_ITEMS: { id: string; label: string; icon: React.ReactNode; onClick?: () => void }[] = [
  { id: 'lynx', label: 'Lynx AI', icon: <Bot size={20} /> },
  { id: 'simplify', label: 'Simplify', icon: <Maximize2 size={20} /> },
  { id: 'theme', label: 'Theme', icon: <Type size={20} /> },
  { id: 'grammar', label: 'Grammar', icon: <FileText size={20} /> },
  { id: 'statistics', label: 'Statistics', icon: <BarChart3 size={20} /> },
  { id: 'info', label: 'Info', icon: <Info size={20} /> },
  { id: 'refresh', label: 'Refresh', icon: <RefreshCw size={20} /> },
  { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
];

export const ReaderBottomBar: React.FC<ReaderBottomBarProps> = ({
  onPlay,
  onPause,
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
  onLessonImageClick,
  hasVideo = false,
  onVideoMode,
  lessonTitle = 'Lesson',
  lessonSource = '',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isActionsExpanded, setIsActionsExpanded] = useState(false);
  const actionsContainerRef = useRef<HTMLDivElement>(null);

  const handlePlayClick = () => {
    setIsPlaying(true);
    setIsPaused(false);
    onPlay?.();
  };

  const handlePauseInPlayer = () => {
    setIsPaused(true);
  };

  const handlePlayInPlayer = () => {
    setIsPaused(false);
  };

  const handleClosePlayer = () => {
    setIsPlaying(false);
    setIsPaused(false);
    onPause?.();
  };

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
    refresh: onRefresh,
    settings: onSettings,
  };

  return (
    <div className="reader-bottom-bar">
      <div className="reader-bottom-bar-inner">
        <div
          className={`reader-bottom-bar-play-area ${isPlaying ? 'reader-bottom-bar-play-area-playing' : ''} ${isPlaying && isActionsExpanded ? 'reader-bottom-bar-play-area-menu-expanded' : ''}`}
        >
          {!isPlaying ? (
            <>
              <div className="reader-bottom-bar-play-pill">
                <button
                  type="button"
                  className="reader-bottom-bar-play-btn"
                  onClick={handlePlayClick}
                  aria-label="Play"
                >
                  <Play size={24} className="reader-bottom-bar-play-pause-icon" />
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
            </>
          ) : isActionsExpanded ? (
            <div className="reader-bottom-bar-playing-minimal">
              <button
                type="button"
                className="reader-bottom-bar-pause-btn"
                onClick={isPaused ? handlePlayInPlayer : handlePauseInPlayer}
                aria-label={isPaused ? 'Play' : 'Pause'}
              >
                {isPaused ? (
                  <Play size={24} className="reader-bottom-bar-play-pause-icon" />
                ) : (
                  <Pause size={24} className="reader-bottom-bar-play-pause-icon reader-bottom-bar-icon-enter" />
                )}
              </button>
              <button
                type="button"
                className="reader-bottom-bar-lesson-info"
                onClick={() => setIsActionsExpanded(false)}
                aria-label="Close menu and expand player"
              >
                <div className="reader-bottom-bar-lesson-image-wrap">
                  <img
                    src={lessonImage}
                    alt="Lesson"
                    className="reader-bottom-bar-lesson-image"
                  />
                </div>
              </button>
            </div>
          ) : (
            <div className="reader-bottom-bar-playing-inner">
              <div className="reader-bottom-bar-playing-top-row">
                <div className="reader-bottom-bar-playing-left">
                  <button
                    type="button"
                    className="reader-bottom-bar-pause-btn"
                    onClick={isPaused ? handlePlayInPlayer : handlePauseInPlayer}
                    aria-label={isPaused ? 'Play' : 'Pause'}
                  >
                    {isPaused ? (
                      <Play size={24} className="reader-bottom-bar-play-pause-icon" />
                    ) : (
                      <Pause size={24} className="reader-bottom-bar-play-pause-icon reader-bottom-bar-icon-enter" />
                    )}
                  </button>
                  <button
                    type="button"
                    className="reader-bottom-bar-lesson-info"
                    onClick={() => onLessonImageClick?.()}
                    aria-label="Open Audio Mode"
                  >
                    <div className="reader-bottom-bar-lesson-image-wrap">
                      <img
                        src={lessonImage}
                        alt="Lesson"
                        className="reader-bottom-bar-lesson-image"
                      />
                    </div>
                    <div className="reader-bottom-bar-lesson-details">
                      <p className="reader-bottom-bar-lesson-title">{lessonTitle}</p>
                      {lessonSource ? (
                        <p className="reader-bottom-bar-lesson-source">{lessonSource}</p>
                      ) : null}
                    </div>
                  </button>
                </div>
                <div className="reader-bottom-bar-playing-right">
                  <button
                    type="button"
                    className="reader-bottom-bar-close-player-btn"
                    onClick={handleClosePlayer}
                    aria-label="Close player"
                  >
                    <X size={18} className="reader-bottom-bar-close-player-icon" />
                  </button>
                </div>
              </div>
              <div className="reader-bottom-bar-mini-progress-wrap">
                <div className="reader-bottom-bar-mini-progress-track">
                  <div className="reader-bottom-bar-mini-progress-fill" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={`reader-bottom-bar-right ${isPlaying ? 'reader-bottom-bar-right-playing' : ''}`}>
          {isPlaying ? (
            <div ref={actionsContainerRef} className="reader-bottom-bar-right-when-playing">
              {!isActionsExpanded && (
                <div className="reader-bottom-bar-chevron-only">
                  <button
                    type="button"
                    className="reader-bottom-bar-chevron-only-btn"
                    onClick={handleChevronClick}
                    aria-label="Expand menu"
                    aria-expanded={isActionsExpanded}
                  >
                    <ChevronsUpDown size={24} />
                  </button>
                </div>
              )}
              {isActionsExpanded ? (
                <div
                  className="reader-bottom-bar-actions-container expanded"
                  aria-expanded
                >
                  <div className="reader-bottom-bar-expanded-menu">
                    <div className="reader-bottom-bar-expanded-grid">
                      {EXPANDED_MENU_ITEMS.map(({ id, label, icon }) => (
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
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
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
                  <img src={sentenceIcon} alt="" className="reader-bottom-bar-custom-icon" />
                </button>
                <button
                  type="button"
                  className="reader-bottom-bar-menu-btn"
                  onClick={onReview}
                  aria-label="Review"
                >
                  <img src={reviewIcon} alt="" className="reader-bottom-bar-custom-icon" />
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
                <div className="reader-bottom-bar-expanded-grid">
                  {EXPANDED_MENU_ITEMS.map(({ id, label, icon }) => (
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
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
