import React, { useCallback, useState } from 'react';
import { Play, Copy, ArrowUpRight, ChevronDown, ChevronUp } from 'lucide-react';
import type { WordDetailSentenceContextEntry } from './SentenceBlock';
import './SentenceMenuItem.css';

export interface SentenceMenuItemProps {
  entry: WordDetailSentenceContextEntry;
  onAudio?: (entry: WordDetailSentenceContextEntry) => void;
  onGoToLesson?: (entry: WordDetailSentenceContextEntry) => void;
  /** Start expanded (defaults to collapsed — past encounters open on tap). */
  defaultExpanded?: boolean;
}

function copySentenceClipboardText(entry: WordDetailSentenceContextEntry): string {
  return `${entry.translation}\n${entry.originalSentence}`;
}

/**
 * Past-encounter sentence row (Figma SentenceMenuItem 4446:89869 / 4446:89868).
 * Collapsed: the original sentence + chevron, the whole row toggles open.
 * Expanded: original sentence, lesson title, translation and play / copy / go-to-lesson actions.
 */
export const SentenceMenuItem: React.FC<SentenceMenuItemProps> = ({
  entry,
  onAudio,
  onGoToLesson,
  defaultExpanded = false,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(copySentenceClipboardText(entry));
    } catch {
      // Clipboard may be unavailable (e.g. non-secure context); host can still wire copy.
    }
  }, [entry]);

  if (!expanded) {
    return (
      <button
        type="button"
        className="sentence-menu-item sentence-menu-item--collapsed"
        aria-expanded={false}
        aria-label={`Expand sentence: ${entry.originalSentence.trim()}`}
        onClick={() => setExpanded(true)}
      >
        <div className="sentence-menu-item__content">
          <div className="sentence-menu-item__original">
            <span className="sentence-menu-item__quote-bar" aria-hidden />
            <p className="sentence-menu-item__original-text">{entry.originalSentence}</p>
          </div>
          <span className="sentence-menu-item__expand" aria-hidden>
            <ChevronDown size={12} />
          </span>
        </div>
      </button>
    );
  }

  return (
    <div className="sentence-menu-item sentence-menu-item--expanded">
      <div className="sentence-menu-item__content">
        <div className="sentence-menu-item__original">
          <span className="sentence-menu-item__quote-bar" aria-hidden />
          <p className="sentence-menu-item__original-text">{entry.originalSentence}</p>
        </div>
        <button
          type="button"
          className="sentence-menu-item__expand sentence-menu-item__expand--btn"
          aria-label="Collapse sentence"
          onClick={() => setExpanded(false)}
        >
          <ChevronUp size={12} />
        </button>
      </div>
      <div className="sentence-menu-item__expanded-content">
        <p className="sentence-menu-item__lesson">{entry.lessonTitle}</p>
        <p className="sentence-menu-item__translation">{entry.translation}</p>
        <div className="sentence-menu-item__actions">
          <button
            type="button"
            className="sentence-menu-item__btn"
            aria-label="Play sentence audio"
            onClick={() => onAudio?.(entry)}
          >
            <Play size={16} aria-hidden />
          </button>
          <button
            type="button"
            className="sentence-menu-item__btn"
            aria-label="Copy sentence"
            onClick={handleCopy}
          >
            <Copy size={16} aria-hidden />
          </button>
          <button
            type="button"
            className="sentence-menu-item__btn"
            aria-label="Go to lesson"
            onClick={() => onGoToLesson?.(entry)}
          >
            <ArrowUpRight size={16} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
};
