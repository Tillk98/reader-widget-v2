import React, { useCallback } from 'react';
import { Volume2, Copy, ArrowUpRight } from 'lucide-react';

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
  onGoToLesson?: (entry: WordDetailSentenceContextEntry) => void;
}

/** Copies translation line, then original sentence (matches how learners read context). */
function copySentenceClipboardText(entry: WordDetailSentenceContextEntry): string {
  return `${entry.translation}\n${entry.originalSentence}`;
}

export const SentenceBlock: React.FC<SentenceBlockProps> = ({ entry, onAudio, onGoToLesson }) => {
  const handleCopy = useCallback(async () => {
    const text = copySentenceClipboardText(entry);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard may be unavailable (e.g. non-secure context); host can still wire copy.
    }
  }, [entry]);

  const variantClass =
    entry.variant === 'current'
      ? 'word-detail-sentence-block--current'
      : 'word-detail-sentence-block--archived';

  return (
    <div className={`word-detail-sentence-block ${variantClass}`}>
      <div className="word-detail-sentence-block__caption">
        <p className="word-detail-sentence-block__lesson">{entry.lessonTitle}</p>
        {entry.generatedMeta != null && entry.generatedMeta.trim() !== '' ? (
          <p className="word-detail-sentence-block__meta">{entry.generatedMeta}</p>
        ) : null}
      </div>
      <p className="word-detail-sentence-block__translation">{entry.translation}</p>
      <div className="word-detail-sentence-block__original-row">
        <div className="word-detail-sentence-block__original-text-wrap">
          <span className="word-detail-sentence-block__quote-bar" aria-hidden />
          <p className="word-detail-sentence-block__original-text">{entry.originalSentence}</p>
        </div>
      </div>
      <div className="word-detail-sentence-block__actions">
        <button
          type="button"
          className="word-detail-sheet-icon-btn"
          aria-label="Play sentence audio"
          onClick={() => onAudio?.(entry)}
        >
          <Volume2 size={18} aria-hidden />
        </button>
        <button type="button" className="word-detail-sheet-icon-btn" aria-label="Copy sentence" onClick={handleCopy}>
          <Copy size={18} aria-hidden />
        </button>
        <button
          type="button"
          className="word-detail-sheet-icon-btn"
          aria-label="Go to lesson"
          onClick={() => onGoToLesson?.(entry)}
        >
          <ArrowUpRight size={18} aria-hidden />
        </button>
      </div>
    </div>
  );
};
