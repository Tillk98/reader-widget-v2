import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
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
import type { LingQStatusType } from './LingQStatusBar';
import { ActiveSelectionBar } from './ActiveSelectionBar';
import { MediaPlayerBottomBar } from './MediaPlayerBottomBar';
import sentenceDefaultIcon from '../assets/sentence-default.png';
import reviewDefaultIcon from '../assets/review-default.png';
import './ReaderBottomBar.css';

export interface ReaderBottomBarProps {
  mediaMode?: 'none' | 'audio' | 'video';
  mediaPlayerExpanded?: boolean;
  onMediaPlayerExpand?: () => void;
  onMediaPlayerCollapse?: () => void;
  onMediaClose?: () => void;
  selectedWordId?: string | null;
  selectedWordStatus?: LingQStatusType;
  onSelectedWordStatusChange?: (status: LingQStatusType) => void;
  onPlay?: () => void;
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
  mediaMode = 'none',
  mediaPlayerExpanded = false,
  onMediaPlayerExpand,
  onMediaPlayerCollapse,
  onMediaClose,
  selectedWordId,
  selectedWordStatus = 'New',
  onSelectedWordStatusChange,
  onPlay,
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
  hasVideo = false,
  onVideoMode,
  lessonTitle = 'Lesson',
  lessonSource = '',
}) => {
  const [isActionsExpanded, setIsActionsExpanded] = useState(false);
  const actionsContainerRef = useRef<HTMLDivElement>(null);

  const hasWordSelected = selectedWordId != null;
  const inMediaMode = mediaMode !== 'none';
  const showDefaultChrome = !inMediaMode && !hasWordSelected;

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
      <div
        className={`reader-bottom-bar-inner ${inMediaMode || hasWordSelected ? 'reader-bottom-bar-inner--stack' : ''}`}
      >
        {hasWordSelected && (
          <ActiveSelectionBar
            selectedWordId={selectedWordId}
            selectedWordStatus={selectedWordStatus}
            onSelectedWordStatusChange={onSelectedWordStatusChange!}
          />
        )}

        {inMediaMode && (
          <MediaPlayerBottomBar
            expanded={mediaPlayerExpanded}
            lessonTitle={lessonTitle}
            lessonSource={lessonSource}
            onRequestExpand={() => onMediaPlayerExpand?.()}
            onRequestCollapse={() => onMediaPlayerCollapse?.()}
            onClose={() => onMediaClose?.()}
          />
        )}

        {showDefaultChrome && (
          <div className="reader-bottom-bar-default-row">
            <div className="reader-bottom-bar-play-area">
              <div className="reader-bottom-bar-play-pill">
                <button
                  type="button"
                  className="reader-bottom-bar-play-btn"
                  onClick={() => onPlay?.()}
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
          </div>
        )}
      </div>
    </div>
  );
};
