import React, { useCallback, useState } from 'react';
import { Play, Copy, ArrowUpRight, ChevronUp } from 'lucide-react';

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
  /** Current lesson sentence opens expanded; stored sentences start collapsed and expand on click. */
  const [expanded, setExpanded] = useState(entry.variant === 'current');

  const handleCopy = useCallback(async () => {
    const text = copySentenceClipboardText(entry);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard may be unavailable (e.g. non-secure context); host can still wire copy.
    }
  }, [entry]);

  if (!expanded) {
    return (
      <button
        type="button"
        className="word-detail-sentence-block word-detail-sentence-block--collapsed"
        aria-expanded={false}
        aria-label={`Expand stored sentence: ${entry.originalSentence.trim()}`}
        onClick={() => setExpanded(true)}
      >
        <span className="word-detail-sentence-block__quote-bar" aria-hidden />
        <span className="word-detail-sentence-block__original-text">{entry.originalSentence}</span>
      </button>
    );
  }

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
        {entry.variant === 'archived' ? (
          <button
            type="button"
            className="word-detail-sheet-icon-btn"
            aria-label="Collapse sentence"
            onClick={() => setExpanded(false)}
          >
            <ChevronUp size={18} aria-hidden />
          </button>
        ) : null}
        <button
          type="button"
          className="word-detail-sheet-icon-btn"
          aria-label="Play sentence audio"
          onClick={() => onAudio?.(entry)}
        >
          <Play size={18} aria-hidden />
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
