import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Eye, EyeOff, Volume2, Check } from 'lucide-react';
import type { Sentence, Word } from '../data/lesson';
import type { LingQStatusType } from './LingQStatusBar';
import './SentenceMode.css';

const SWIPE_PX = 60;

/** Learning statuses map to the 1–4 badge shown on the vocabulary tile. */
const LEARNING_NUMBER: Partial<Record<LingQStatusType, number>> = {
  New: 1,
  Recognized: 2,
  Familiar: 3,
  Learned: 4,
};

/** Tapping the status badge cycles through these. */
const STATUS_CYCLE: LingQStatusType[] = ['New', 'Recognized', 'Familiar', 'Learned', 'Known'];

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
  onWordStatusChange: (wordId: string, status: LingQStatusType) => void;
}

export const SentenceMode: React.FC<SentenceModeProps> = ({
  sentences,
  index,
  onIndexChange,
  wordStatusMap,
  onWordStatusChange,
}) => {
  const [showTranslation, setShowTranslation] = useState(false);
  const [activeWordId, setActiveWordId] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
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

  // Reset the followed word when the sentence changes.
  useEffect(() => {
    setActiveWordId(null);
  }, [safeIndex]);

  // Vocabulary list follows the tapped word (annotation: keep the current word in view).
  useEffect(() => {
    if (!activeWordId || !listRef.current) return;
    const tile = listRef.current.querySelector<HTMLElement>(`[data-word-id="${activeWordId}"]`);
    tile?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [activeWordId]);

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

  const handleWordTap = (wordId: string) => {
    if (suppressClick.current) return;
    setActiveWordId(prev => (prev === wordId ? null : wordId));
  };

  const cycleStatus = (wordId: string) => {
    const current = wordStatusMap[wordId] ?? 'New';
    const i = STATUS_CYCLE.indexOf(current);
    const next = STATUS_CYCLE[(i + 1) % STATUS_CYCLE.length];
    onWordStatusChange(wordId, next);
  };

  if (!sentence) return null;

  return (
    <div
      className="sentence-mode"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
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
                    className={[
                      'sentence-mode__word',
                      activeWordId === w.id && 'sentence-mode__word--active',
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

        <div className="sentence-mode__vocab" ref={listRef}>
          {vocabWords.map((w, i) => {
            const status = wordStatusMap[w.id] ?? 'New';
            const number = LEARNING_NUMBER[status];
            return (
              <React.Fragment key={w.id}>
                {i > 0 && <div className="sentence-mode__vocab-divider" aria-hidden />}
                <div
                  className={[
                    'sentence-mode__tile',
                    activeWordId === w.id && 'sentence-mode__tile--active',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  data-word-id={w.id}
                >
                  <div className="sentence-mode__term">
                    <button
                      type="button"
                      className={[
                        'sentence-mode__status',
                        status === 'Known' && 'sentence-mode__status--known',
                        status === 'Ignored' && 'sentence-mode__status--ignored',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => cycleStatus(w.id)}
                      aria-label={`Word status: ${status}`}
                    >
                      {status === 'Known' ? (
                        <Check size={16} strokeWidth={2.25} />
                      ) : (
                        <span className="sentence-mode__status-num">{number ?? ''}</span>
                      )}
                    </button>
                    <div className="sentence-mode__term-text">
                      <p className="sentence-mode__term-word">{w.text}</p>
                      <p className="sentence-mode__term-gloss">{w.translation ?? w.text}</p>
                    </div>
                  </div>
                  <button type="button" className="sentence-mode__audio" aria-label={`Play ${w.text}`}>
                    <Volume2 size={20} strokeWidth={1.75} />
                  </button>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
