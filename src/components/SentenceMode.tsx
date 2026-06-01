import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import type { Sentence, Word } from '../data/lesson';
import type { LingQStatusType } from './LingQStatusBar';
import { VocabTermList } from './VocabTermList';
import './SentenceMode.css';

const SWIPE_PX = 60;

const PUNCTUATION_ONLY = /^[^\p{L}\p{N}]+$/u;

function isPunctuation(text: string): boolean {
  return PUNCTUATION_ONLY.test(text);
}

/** Build a readable gloss for the sentence from per-word translations. */
function buildSentenceTranslation(words: Word[]): string {
  let out = '';
  for (const w of words) {
    const t = w.translation ?? w.text;
    if (isPunctuation(w.text)) {
      out += t;
    } else {
      out += (out.length ? ' ' : '') + t;
    }
  }
  return out;
}

export interface SentenceModeProps {
  sentences: Sentence[];
  index: number;
  onIndexChange: (i: number) => void;
  wordStatusMap: Record<string, LingQStatusType>;
  /** Currently selected word (drives the LingQ status bar) — null when none. */
  selectedWordId: string | null;
  /** Tap a word in the sentence: surfaces the meaning popup + LingQ status bar. */
  onWordSelect: (wordId: string) => void;
  /** Tap the status badge of a vocabulary list item: surfaces the LingQ status bar only. */
  onListWordSelect: (wordId: string) => void;
  /** Tap a vocabulary list item (word + gloss): opens the full word detail sheet. */
  onListWordOpenDetail: (wordId: string) => void;
  /** Clear the current selection (e.g. tapping the page background). */
  onDeselect: () => void;
}

export const SentenceMode: React.FC<SentenceModeProps> = ({
  sentences,
  index,
  onIndexChange,
  wordStatusMap,
  selectedWordId,
  onWordSelect,
  onListWordSelect,
  onListWordOpenDetail,
  onDeselect,
}) => {
  const [showTranslation, setShowTranslation] = useState(false);

  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const suppressClick = useRef(false);

  const safeIndex = Math.min(Math.max(0, index), Math.max(0, sentences.length - 1));
  const sentence = sentences[safeIndex];

  const vocabWords = useMemo(
    () => (sentence ? sentence.words.filter(w => !isPunctuation(w.text)) : []),
    [sentence]
  );

  const sentenceTranslation = useMemo(
    () => (sentence ? buildSentenceTranslation(sentence.words) : ''),
    [sentence]
  );

  const goTo = useCallback(
    (next: number) => {
      const clamped = Math.min(Math.max(0, next), sentences.length - 1);
      if (clamped !== safeIndex) onIndexChange(clamped);
    },
    [safeIndex, sentences.length, onIndexChange]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goTo(safeIndex - 1);
      else if (e.key === 'ArrowRight') goTo(safeIndex + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goTo, safeIndex]);

  const handlePointerDown = (e: React.PointerEvent) => {
    swipeStart.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy) * 1.5) {
      suppressClick.current = true;
      window.setTimeout(() => (suppressClick.current = false), 0);
      goTo(dx < 0 ? safeIndex + 1 : safeIndex - 1);
    }
  };

  /** Tap a word in the sentence: meaning popup + LingQ status bar. */
  const handleWordTap = (wordId: string) => {
    if (suppressClick.current) return;
    onWordSelect(wordId);
  };

  /** Tap a list item's status badge: LingQ status bar only. */
  const handleListStatus = (wordId: string) => {
    if (suppressClick.current) return;
    onListWordSelect(wordId);
  };

  /** Tap a list item's term: open the full word detail sheet. */
  const handleListDetail = (wordId: string) => {
    if (suppressClick.current) return;
    onListWordOpenDetail(wordId);
  };

  /** Tapping empty page background (not a word, tile, or control) clears selection. */
  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (suppressClick.current) return;
    const target = e.target as HTMLElement | null;
    if (target?.closest('.sentence-mode__word, .vocab-list__tile, button')) return;
    onDeselect();
  };

  if (!sentence) return null;

  return (
    <div
      className="sentence-mode"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onClick={handleBackgroundClick}
    >
      <div className="sentence-mode__inner">
        <p className="sentence-mode__sentence">
          {sentence.words.map((w, i) => {
            const punct = isPunctuation(w.text);
            return (
              <React.Fragment key={w.id}>
                {i > 0 && !punct ? ' ' : ''}
                {punct ? (
                  <span className="sentence-mode__punct">{w.text}</span>
                ) : (
                  <span
                    id={w.id}
                    className={[
                      'sentence-mode__word',
                      selectedWordId === w.id && 'sentence-mode__word--active',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => handleWordTap(w.id)}
                  >
                    {w.text}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </p>

        <button
          type="button"
          className="sentence-mode__translation-toggle"
          onClick={() => setShowTranslation(v => !v)}
          aria-pressed={showTranslation}
        >
          {showTranslation ? <EyeOff size={14} strokeWidth={2} /> : <Eye size={14} strokeWidth={2} />}
          <span>{showTranslation ? 'Hide Translation' : 'Show Translation'}</span>
        </button>

        {showTranslation && <p className="sentence-mode__sentence-translation">{sentenceTranslation}</p>}

        <VocabTermList
          className="sentence-mode__vocab"
          items={vocabWords}
          wordStatusMap={wordStatusMap}
          selectedWordId={selectedWordId}
          onSelect={handleListStatus}
          onOpenDetail={handleListDetail}
        />
      </div>
    </div>
  );
};
