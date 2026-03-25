import React, { useState } from 'react';
import { Pause, Play, X, Minimize2 } from 'lucide-react';
import lessonImage from '../assets/lesson-image.png';
import playerBack from '../assets/player-back.png';
import playerForward from '../assets/player-forward.png';
import playerRepeat from '../assets/player-repeat.png';
import sentenceDefaultIcon from '../assets/sentence-default.png';
import './MediaPlayerBottomBar.css';

export interface MediaPlayerBottomBarProps {
  expanded: boolean;
  lessonTitle: string;
  lessonSource?: string;
  /** Collapsed: user tapped the lesson info row */
  onRequestExpand: () => void;
  /** Expanded: minimize control */
  onRequestCollapse: () => void;
  /** Close media mode (page reading) */
  onClose: () => void;
}

export const MediaPlayerBottomBar: React.FC<MediaPlayerBottomBarProps> = ({
  expanded,
  lessonTitle,
  lessonSource,
  onRequestExpand,
  onRequestCollapse,
  onClose,
}) => {
  const [isPaused, setIsPaused] = useState(false);

  const togglePause = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPaused(p => !p);
  };

  if (expanded) {
    return (
      <div className="media-player-bar media-player-bar--expanded" role="region" aria-label="Media player">
        <div className="media-player-bar__progress-row">
          <div className="media-player-bar__progress-track media-player-bar__progress-track--pill">
            <div className="media-player-bar__progress-fill" style={{ width: '12%' }} />
            <div className="media-player-bar__progress-thumb" style={{ left: '12%' }} aria-hidden />
          </div>
        </div>

        <div className="media-player-bar__transport-row">
          <button type="button" className="media-player-bar__icon-btn" aria-label="Skip back 5 seconds">
            <img src={playerBack} alt="" width={18} height={18} />
          </button>
          <button
            type="button"
            className="media-player-bar__play-btn"
            onClick={togglePause}
            aria-label={isPaused ? 'Play' : 'Pause'}
          >
            {isPaused ? <Play size={24} /> : <Pause size={24} />}
          </button>
          <button type="button" className="media-player-bar__icon-btn" aria-label="Skip forward 5 seconds">
            <img src={playerForward} alt="" width={18} height={18} />
          </button>
        </div>

        <div className="media-player-bar__expanded-bottom">
          <button
            type="button"
            className="media-player-bar__icon-btn"
            onClick={onRequestCollapse}
            aria-label="Minimize player"
          >
            <Minimize2 size={18} />
          </button>
          <div className="media-player-bar__menu-pill" role="toolbar" aria-label="Player options">
            <button type="button" className="media-player-bar__menu-pill-btn" aria-label="Playback speed">
              1x
            </button>
            <button type="button" className="media-player-bar__menu-pill-btn" aria-label="Repeat">
              <img src={playerRepeat} alt="" width={18} height={18} />
            </button>
            <button type="button" className="media-player-bar__menu-pill-btn" aria-label="Sentence">
              <img src={sentenceDefaultIcon} alt="" width={18} height={18} className="media-player-bar__menu-pill-icon" />
            </button>
          </div>
          <button type="button" className="media-player-bar__icon-btn" onClick={onClose} aria-label="Close media">
            <X size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="media-player-bar media-player-bar--collapsed" role="region" aria-label="Media player">
      <div className="media-player-bar__collapsed-main">
        <button
          type="button"
          className="media-player-bar__play-btn"
          onClick={togglePause}
          aria-label={isPaused ? 'Play' : 'Pause'}
        >
          {isPaused ? <Play size={24} /> : <Pause size={24} />}
        </button>
        <button
          type="button"
          className="media-player-bar__lesson-card"
          onClick={onRequestExpand}
          aria-label="Expand player"
        >
          <div className="media-player-bar__lesson-thumb-wrap">
            <img src={lessonImage} alt="" className="media-player-bar__lesson-thumb" />
          </div>
          <div className="media-player-bar__lesson-text">
            <p className="media-player-bar__lesson-title">{lessonTitle}</p>
            {lessonSource ? <p className="media-player-bar__lesson-source">{lessonSource}</p> : null}
          </div>
        </button>
        <button type="button" className="media-player-bar__icon-btn" aria-label="Skip back 5 seconds">
          <img src={playerBack} alt="" width={18} height={18} />
        </button>
        <button type="button" className="media-player-bar__icon-btn" onClick={onClose} aria-label="Close media">
          <X size={18} />
        </button>
      </div>
      <div className="media-player-bar__collapsed-progress" aria-hidden>
        <div className="media-player-bar__collapsed-progress-track">
          <div className="media-player-bar__collapsed-progress-fill" />
        </div>
      </div>
    </div>
  );
};
