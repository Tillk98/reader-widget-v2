import React, { useCallback } from 'react';
import { Play, Copy } from 'lucide-react';
import './SentenceBlock.css';

export type WordDetailSentenceContextEntry = {
  lessonTitle: string;
  translation: string;
  originalSentence: string;
  variant: 'current' | 'archived';
  /** e.g. generation date for archived rows (Explain This–style meta). */
  generatedMeta?: string;
  lessonId?: string;
  sentenceId?: string;
};

export interface SentenceBlockProps {
  entry: WordDetailSentenceContextEntry;
  onAudio?: (entry: WordDetailSentenceContextEntry) => void;
}

/** Copies translation line, then original sentence (matches how learners read context). */
function copySentenceClipboardText(entry: WordDetailSentenceContextEntry): string {
  return `${entry.translation}\n${entry.originalSentence}`;
}

/**
 * Sentence context block (Figma SentenceBlock 2354:1326) — blue-subtle card showing the
 * original sentence (leading quote bar), then the lesson title, translation and play / copy
 * actions. (Past-encounter / collapsed states are intentionally not handled here yet.)
 */
export const SentenceBlock: React.FC<SentenceBlockProps> = ({ entry, onAudio }) => {
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(copySentenceClipboardText(entry));
    } catch {
      // Clipboard may be unavailable (e.g. non-secure context); host can still wire copy.
    }
  }, [entry]);

  return (
    <div className="sentence-block">
      <div className="sentence-block__content">
        <div className="sentence-block__original">
          <span className="sentence-block__quote-bar" aria-hidden />
          <p className="sentence-block__original-text">{entry.originalSentence}</p>
        </div>
      </div>
      <div className="sentence-block__expanded">
        <p className="sentence-block__lesson">{entry.lessonTitle}</p>
        <p className="sentence-block__translation">{entry.translation}</p>
        <div className="sentence-block__actions">
          <button
            type="button"
            className="sentence-block__btn"
            aria-label="Play sentence audio"
            onClick={() => onAudio?.(entry)}
          >
            <Play size={16} aria-hidden />
          </button>
          <button
            type="button"
            className="sentence-block__btn"
            aria-label="Copy sentence"
            onClick={handleCopy}
          >
            <Copy size={16} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
};
