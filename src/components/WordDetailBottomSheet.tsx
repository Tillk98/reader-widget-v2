import React, { useRef, useCallback, useEffect, useLayoutEffect } from 'react';
import { Volume2, Plus, Tags, Coins } from 'lucide-react';
import meaningTabActive from '../assets/meaning-active.png';
import meaningTabInactive from '../assets/meaning-inactive.png';
import sentenceTabActive from '../assets/sentence-active.png';
import sentenceTabInactive from '../assets/sentence-inactive.png';
import explainTabActive from '../assets/explain-this-active.png';
import explainTabInactive from '../assets/explain-this-inactive.png';
import dictionariesTabActive from '../assets/dictionaries-active.png';
import dictionariesTabInactive from '../assets/dictionaries-inactive.png';
import notesTabActive from '../assets/notes-active.png';
import notesTabInactive from '../assets/notes-inactive.png';
import dictionaryGlosbe from '../assets/dictionary-glosbe.png';
import dictionaryWordReference from '../assets/dictionary-wordreference.png';
import dictionaryLinguee from '../assets/dictionary-linguee.png';
import dictionaryDeepL from '../assets/dictionary-deepl.png';
import type { LingQStatusType } from './LingQStatusBar';
import { LingQStatusBar } from './LingQStatusBar';
import './WordDetailBottomSheet.css';

const DRAG_CLOSE_THRESHOLD_PX = 40;

const DEFAULT_SUGGESTED_MEANINGS = ['Her hair was undone', 'Her hair was disheveled'];
const DEFAULT_RELATED_PHRASE =
  'Ihre Frisur war aufgelöst und hing wie drei Pfund Wolle nach unten.';
const DEFAULT_TAGS = ['noun', 'adjective', 'phrase'];
const DEFAULT_PRIMARY_MEANING = 'Her hairstyle was messed up.';
const DEFAULT_QUOTE_LINE = 'Ihre Frisur war aufgelöst';

const DEFAULT_SENTENCE_CONTEXT =
  'Her hair was disheveled and hung down like three pounds of wool.';
const DEFAULT_SENTENCE_ORIGINAL =
  'Ihre Frisur war aufgelöst und hing wie drei Pfund Wolle nach unten.';

export type WordDetailSentenceTerm = {
  term: string;
  meaning: string;
  variant?: 'default' | 'lingq';
};

const DEFAULT_SENTENCE_TERMS: WordDetailSentenceTerm[] = [
  { term: 'Frisur', meaning: 'hairstyle' },
  { term: 'Aufgelöst', meaning: 'undone' },
  { term: 'Unten', meaning: 'under ; below' },
  { term: 'Pfund', meaning: 'pound', variant: 'lingq' },
];

const LYNX_THINKING_MS = 900;
const LYNX_TYPEWRITER_MS = 18;
const LYNX_SETTLE_DELAY_MS = 3500;

const DEFAULT_LYNX_LATEST_BODY = `"Ihre Frisur war aufgelöst" = Her hair was undone/let down.

Her hairstyle had come apart and was hanging loose — like it had completely fallen out of any updo or styling, just drooping down.`;

export type WordDetailLynxHistoryMessage = {
  meta: string;
  body: string;
};

const DEFAULT_LYNX_HISTORY: WordDetailLynxHistoryMessage[] = [
  {
    meta: 'Generated Mar 20, 9:30 AM EST',
    body: `"Frisur" = hairstyle / hairdo.

The overall way someone's hair is cut, styled, or arranged — whether that's a bob, a bun, or a blowout.`,
  },
];

type LynxPhase = 'idle' | 'thinking' | 'typing' | 'fresh' | 'settled';

export type WordDetailTabId = 'meanings' | 'sentence' | 'explain' | 'dictionaries' | 'notes';

export type WordDetailDictionaryProvider = {
  id: string;
  label: string;
  /** Optional provider logo; omit for blank placeholder tile. */
  iconSrc?: string;
};

const DEFAULT_DICTIONARY_PROVIDERS: WordDetailDictionaryProvider[] = [
  { id: 'glosbe', label: 'Glosbe', iconSrc: dictionaryGlosbe },
  { id: 'word-reference', label: 'Word Reference', iconSrc: dictionaryWordReference },
  { id: 'linguee', label: 'Linguee', iconSrc: dictionaryLinguee },
  { id: 'deepl', label: 'DeepL', iconSrc: dictionaryDeepL },
];

export type WordDetailWordNote = {
  meta: string;
  body: string;
};

const DEFAULT_WORD_NOTE: WordDetailWordNote = {
  meta: 'Updated Mar 20, 9:35 AM EST',
  body:
    'like Frisur can mean the style itself, not just the hair — so eine schlechte Frisur = a bad haircut/style',
};

export interface WordDetailBottomSheetProps {
  /** Selected word or phrase shown beside the quote bar */
  wordText: string;
  wordTranslation?: string;
  wordStatus?: LingQStatusType;
  onWordStatusChange?: (status: LingQStatusType) => void;
  onClose: () => void;
  suggestedMeanings?: string[];
  relatedPhrase?: string;
  tags?: string[];
  coinCount?: number;
  sentenceContextTranslation?: string;
  sentenceOriginal?: string;
  sentenceTerms?: WordDetailSentenceTerm[];
  /** Lynx “Explain This” primary explanation (typewriter + settle animation uses this on first visit). */
  lynxLatestBody?: string;
  /** Older Lynx messages below the latest card (static in prototype). */
  lynxHistoryMessages?: WordDetailLynxHistoryMessage[];
  /** Dictionary sources shown in the bottom horizontal strip (Dictionaries tab). */
  dictionaryProviders?: WordDetailDictionaryProvider[];
  /** Single user note shown on the Notes tab (static; not AI-generated). */
  wordNote?: WordDetailWordNote;
}

export const WordDetailBottomSheet: React.FC<WordDetailBottomSheetProps> = ({
  wordText,
  wordTranslation,
  wordStatus = 'New',
  onWordStatusChange,
  onClose,
  suggestedMeanings = DEFAULT_SUGGESTED_MEANINGS,
  relatedPhrase = DEFAULT_RELATED_PHRASE,
  tags = DEFAULT_TAGS,
  coinCount = 3,
  sentenceContextTranslation = DEFAULT_SENTENCE_CONTEXT,
  sentenceOriginal = DEFAULT_SENTENCE_ORIGINAL,
  sentenceTerms = DEFAULT_SENTENCE_TERMS,
  lynxLatestBody = DEFAULT_LYNX_LATEST_BODY,
  lynxHistoryMessages = DEFAULT_LYNX_HISTORY,
  dictionaryProviders = DEFAULT_DICTIONARY_PROVIDERS,
  wordNote = DEFAULT_WORD_NOTE,
}) => {
  const handleRef = useRef<HTMLDivElement>(null);
  const handleDragStartYRef = useRef<number | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const [activeTab, setActiveTab] = React.useState<WordDetailTabId>('meanings');

  const lynxIntroDoneRef = useRef(false);
  const [lynxPhase, setLynxPhase] = React.useState<LynxPhase>('idle');
  const [lynxTypedLength, setLynxTypedLength] = React.useState(0);

  const quoteLine = wordText.trim() !== '' ? wordText : DEFAULT_QUOTE_LINE;
  const primaryMeaning =
    wordTranslation != null && wordTranslation.trim() !== ''
      ? wordTranslation
      : DEFAULT_PRIMARY_MEANING;

  useEffect(() => {
    const el = handleRef.current;
    if (!el) return;
    const onTouchMove = (e: TouchEvent) => {
      if (handleDragStartYRef.current === null) return;
      e.preventDefault();
      if (e.touches.length > 0) {
        const deltaY = e.touches[0].clientY - handleDragStartYRef.current;
        if (deltaY >= DRAG_CLOSE_THRESHOLD_PX) {
          handleDragStartYRef.current = null;
          onCloseRef.current();
          document.removeEventListener('touchmove', onTouchMove, { capture: true });
          document.removeEventListener('touchend', onTouchEnd, { capture: true });
          document.removeEventListener('touchcancel', onTouchEnd, { capture: true });
        }
      }
    };
    const onTouchEnd = () => {
      handleDragStartYRef.current = null;
      document.removeEventListener('touchmove', onTouchMove, { capture: true });
      document.removeEventListener('touchend', onTouchEnd, { capture: true });
      document.removeEventListener('touchcancel', onTouchEnd, { capture: true });
    };
    const onTouchStart = (e: TouchEvent) => {
      if (e.changedTouches.length > 0) {
        handleDragStartYRef.current = e.changedTouches[0].clientY;
        document.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
        document.addEventListener('touchend', onTouchEnd, { capture: true });
        document.addEventListener('touchcancel', onTouchEnd, { capture: true });
      }
    };
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove, { capture: true });
      document.removeEventListener('touchend', onTouchEnd, { capture: true });
      document.removeEventListener('touchcancel', onTouchEnd, { capture: true });
    };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    handleDragStartYRef.current = e.clientY;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (handleDragStartYRef.current === null) return;
      e.preventDefault();
      const deltaY = e.clientY - handleDragStartYRef.current;
      if (deltaY >= DRAG_CLOSE_THRESHOLD_PX) {
        handleDragStartYRef.current = null;
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
        onClose();
      }
    },
    [onClose]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (handleDragStartYRef.current === null) return;
      const deltaY = e.clientY - handleDragStartYRef.current;
      if (deltaY >= DRAG_CLOSE_THRESHOLD_PX) onClose();
      handleDragStartYRef.current = null;
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    },
    [onClose]
  );

  const handlePointerCancel = useCallback(() => {
    handleDragStartYRef.current = null;
  }, []);

  const [isOpen, setIsOpen] = React.useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsOpen(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const meaningsActive = activeTab === 'meanings';
  const sentenceActive = activeTab === 'sentence';
  const explainActive = activeTab === 'explain';
  const dictionariesActive = activeTab === 'dictionaries';
  const notesActive = activeTab === 'notes';

  useLayoutEffect(() => {
    if (activeTab !== 'explain') return;
    if (lynxIntroDoneRef.current) {
      setLynxPhase('settled');
      setLynxTypedLength(lynxLatestBody.length);
      return;
    }
    setLynxPhase('thinking');
    setLynxTypedLength(0);
    const startTyping = window.setTimeout(() => {
      setLynxPhase('typing');
      setLynxTypedLength(0);
    }, LYNX_THINKING_MS);
    return () => window.clearTimeout(startTyping);
  }, [activeTab, lynxLatestBody]);

  useEffect(() => {
    if (activeTab !== 'explain' || lynxPhase !== 'typing') return;
    if (lynxLatestBody.length === 0) {
      setLynxPhase('fresh');
      return;
    }
    if (lynxTypedLength >= lynxLatestBody.length) {
      setLynxPhase('fresh');
      return;
    }
    const id = window.setTimeout(() => {
      setLynxTypedLength((n) => n + 1);
    }, LYNX_TYPEWRITER_MS);
    return () => window.clearTimeout(id);
  }, [activeTab, lynxPhase, lynxTypedLength, lynxLatestBody]);

  useEffect(() => {
    if (lynxPhase !== 'fresh') return;
    const id = window.setTimeout(() => {
      setLynxPhase('settled');
      lynxIntroDoneRef.current = true;
    }, LYNX_SETTLE_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [lynxPhase]);

  const lynxBusy =
    explainActive && (lynxPhase === 'thinking' || lynxPhase === 'typing' || lynxPhase === 'fresh');

  return (
    <div
      className={`word-detail-sheet-root ${isOpen ? 'is-open' : ''}`}
      role="dialog"
      aria-label="Word details"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="word-detail-sheet-panel">
        <div
          ref={handleRef}
          className="word-detail-sheet-handle"
          aria-hidden
          role="button"
          tabIndex={0}
          aria-label="Drag down to close"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
        />

        <div className="word-detail-sheet-header-block">
          <div className="word-detail-sheet-meaning-section">
            <div className="word-detail-sheet-quote-row">
              <div className="word-detail-sheet-quote-text">
                <span className="word-detail-sheet-quote-bar" aria-hidden />
                <p className="word-detail-sheet-quote-line">{quoteLine}</p>
              </div>
              <button type="button" className="word-detail-sheet-vol-btn" aria-label="Play audio">
                <Volume2 size={18} aria-hidden />
              </button>
            </div>
            <div className="word-detail-sheet-meaning-field">
              <p className="word-detail-sheet-meaning-primary">{primaryMeaning}</p>
            </div>
          </div>

          <div className="word-detail-sheet-tabs" role="tablist" aria-label="Word detail sections">
            <button
              type="button"
              id="word-detail-tab-meanings"
              role="tab"
              className={`word-detail-sheet-tab ${meaningsActive ? 'word-detail-sheet-tab--active' : 'word-detail-sheet-tab--icon-only'}`}
              aria-selected={meaningsActive}
              onClick={() => setActiveTab('meanings')}
            >
              <img
                src={meaningsActive ? meaningTabActive : meaningTabInactive}
                alt=""
                className="word-detail-sheet-tab-img"
                aria-hidden
              />
              <span className="word-detail-sheet-tab__label" aria-hidden={!meaningsActive}>
                Meanings
              </span>
            </button>
            <button
              type="button"
              id="word-detail-tab-sentence"
              role="tab"
              className={`word-detail-sheet-tab ${sentenceActive ? 'word-detail-sheet-tab--active' : 'word-detail-sheet-tab--icon-only'}`}
              aria-selected={sentenceActive}
              onClick={() => setActiveTab('sentence')}
            >
              <img
                src={sentenceActive ? sentenceTabActive : sentenceTabInactive}
                alt=""
                className="word-detail-sheet-tab-img"
                aria-hidden
              />
              <span className="word-detail-sheet-tab__label" aria-hidden={!sentenceActive}>
                Sentence
              </span>
            </button>
            <button
              type="button"
              id="word-detail-tab-explain"
              role="tab"
              className={`word-detail-sheet-tab ${explainActive ? 'word-detail-sheet-tab--active' : 'word-detail-sheet-tab--icon-only'}`}
              aria-selected={explainActive}
              onClick={() => setActiveTab('explain')}
            >
              <img
                src={explainActive ? explainTabActive : explainTabInactive}
                alt=""
                className="word-detail-sheet-tab-img"
                aria-hidden
              />
              <span className="word-detail-sheet-tab__label" aria-hidden={!explainActive}>
                Explain This
              </span>
            </button>
            <button
              type="button"
              id="word-detail-tab-dictionaries"
              role="tab"
              className={`word-detail-sheet-tab ${dictionariesActive ? 'word-detail-sheet-tab--active' : 'word-detail-sheet-tab--icon-only'}`}
              aria-selected={dictionariesActive}
              onClick={() => setActiveTab('dictionaries')}
            >
              <img
                src={dictionariesActive ? dictionariesTabActive : dictionariesTabInactive}
                alt=""
                className="word-detail-sheet-tab-img"
                aria-hidden
              />
              <span className="word-detail-sheet-tab__label" aria-hidden={!dictionariesActive}>
                Dictionaries
              </span>
            </button>
            <button
              type="button"
              id="word-detail-tab-notes"
              role="tab"
              className={`word-detail-sheet-tab ${notesActive ? 'word-detail-sheet-tab--active' : 'word-detail-sheet-tab--icon-only'}`}
              aria-selected={notesActive}
              onClick={() => setActiveTab('notes')}
            >
              <img
                src={notesActive ? notesTabActive : notesTabInactive}
                alt=""
                className="word-detail-sheet-tab-img"
                aria-hidden
              />
              <span className="word-detail-sheet-tab__label" aria-hidden={!notesActive}>
                Notes
              </span>
            </button>
          </div>
        </div>

        <div
          className="word-detail-sheet-main"
          role="tabpanel"
          id="word-detail-sheet-panel"
          aria-labelledby={
            activeTab === 'meanings'
              ? 'word-detail-tab-meanings'
              : activeTab === 'sentence'
                ? 'word-detail-tab-sentence'
                : activeTab === 'explain'
                  ? 'word-detail-tab-explain'
                  : activeTab === 'dictionaries'
                    ? 'word-detail-tab-dictionaries'
                    : activeTab === 'notes'
                      ? 'word-detail-tab-notes'
                      : undefined
          }
          aria-busy={lynxBusy || undefined}
          aria-live={explainActive ? 'polite' : undefined}
        >
          <div
            className={`word-detail-sheet-scroll${dictionariesActive ? ' word-detail-sheet-scroll--dictionary' : ''}`}
          >
            {meaningsActive ? (
              <>
                <section className="word-detail-sheet-block" aria-labelledby="word-detail-suggested-heading">
                  <h2 id="word-detail-suggested-heading" className="word-detail-sheet-section-label">
                    SUGGESTED MEANINGS
                  </h2>
                  <ul className="word-detail-sheet-suggested-list">
                    {suggestedMeanings.map((text, i) => (
                      <li key={`${i}-${text}`}>
                        <button type="button" className="word-detail-sheet-suggested-row">
                          <span className="word-detail-sheet-suggested-text">{text}</span>
                          <Plus size={18} aria-hidden className="word-detail-sheet-suggested-plus" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="word-detail-sheet-block" aria-labelledby="word-detail-related-heading">
                  <h2 id="word-detail-related-heading" className="word-detail-sheet-section-label">
                    RELATED PHRASES
                  </h2>
                  <div className="word-detail-sheet-related-card">
                    <p>{relatedPhrase}</p>
                  </div>
                </section>
              </>
            ) : null}

            {sentenceActive ? (
              <div className="word-detail-sheet-sentence">
                <h2 className="word-detail-sheet-section-label">SENTENCE CONTEXT</h2>
                <p className="word-detail-sheet-sentence-context-body">{sentenceContextTranslation}</p>
                <div className="word-detail-sheet-sentence-original">
                  <div className="word-detail-sheet-sentence-original-text-wrap">
                    <span className="word-detail-sheet-sentence-quote-bar" aria-hidden />
                    <p className="word-detail-sheet-sentence-original-text">{sentenceOriginal}</p>
                  </div>
                  <button type="button" className="word-detail-sheet-vol-btn" aria-label="Play sentence audio">
                    <Volume2 size={18} aria-hidden />
                  </button>
                </div>
              </div>
            ) : null}

            {explainActive ? (
              <div className="word-detail-sheet-explain">
                {lynxPhase === 'idle' || lynxPhase === 'thinking' ? (
                  <div className="word-detail-sheet-lynx-card word-detail-sheet-lynx-card--highlight">
                    <p className="word-detail-sheet-lynx-thinking">Lynx is thinking …</p>
                  </div>
                ) : null}

                {lynxPhase === 'typing' || lynxPhase === 'fresh' || lynxPhase === 'settled' ? (
                  <div
                    className={`word-detail-sheet-lynx-card ${
                      lynxPhase === 'settled'
                        ? 'word-detail-sheet-lynx-card--elevated'
                        : 'word-detail-sheet-lynx-card--highlight'
                    }`}
                  >
                    {(lynxPhase === 'fresh' || lynxPhase === 'settled') && (
                      <p className="word-detail-sheet-lynx-card__meta">Generated Just Now</p>
                    )}
                    <div className="word-detail-sheet-lynx-card__body">
                      {lynxPhase === 'typing'
                        ? lynxLatestBody.slice(0, lynxTypedLength)
                        : lynxLatestBody}
                    </div>
                  </div>
                ) : null}

                {lynxHistoryMessages.map((msg, i) => (
                  <div key={`${msg.meta}-${i}`} className="word-detail-sheet-lynx-card word-detail-sheet-lynx-card--elevated">
                    <p className="word-detail-sheet-lynx-card__meta">{msg.meta}</p>
                    <div className="word-detail-sheet-lynx-card__body">{msg.body}</div>
                  </div>
                ))}
              </div>
            ) : null}

            {dictionariesActive ? (
              <div
                className="word-detail-sheet-dictionary-placeholder"
                aria-label="Dictionary content"
              />
            ) : null}

            {notesActive ? (
              <div className="word-detail-sheet-notes">
                <article className="word-detail-sheet-note-card">
                  <p className="word-detail-sheet-note-card__meta">{wordNote.meta}</p>
                  <p className="word-detail-sheet-note-card__body">{wordNote.body}</p>
                </article>
              </div>
            ) : null}
          </div>

          <div className="word-detail-sheet-content-anchor">
            {meaningsActive ? (
              <div className="word-detail-sheet-tag-row">
                <div className="word-detail-sheet-tag-row-inner">
                  <button type="button" className="word-detail-sheet-tags-btn" aria-label="Add tags">
                    <Tags size={18} aria-hidden />
                  </button>
                  {tags.map((tag) => (
                    <span key={tag} className="word-detail-sheet-tag-pill">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="word-detail-sheet-coin-badge">
                  <span className="word-detail-sheet-coin-count">{coinCount}</span>
                  <Coins size={18} className="word-detail-sheet-coin-icon" aria-hidden />
                </div>
              </div>
            ) : null}

            {sentenceActive ? (
              <div className="word-detail-sheet-term-list" role="list">
                {sentenceTerms.map((t, i) => (
                  <div
                    key={`${t.term}-${i}`}
                    className="word-detail-sheet-term-card"
                    role="listitem"
                  >
                    <span
                      className={`word-detail-sheet-term-dot ${t.variant === 'lingq' ? 'word-detail-sheet-term-dot--lingq' : ''}`}
                      aria-hidden
                    />
                    <div className="word-detail-sheet-term-text">
                      <span className="word-detail-sheet-term-word">{t.term}</span>
                      <span className="word-detail-sheet-term-meaning">{t.meaning}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {dictionariesActive ? (
              <div className="word-detail-sheet-dictionary-list" role="list" aria-label="Dictionary sources">
                {dictionaryProviders.map((p) => (
                  <div key={p.id} role="listitem" className="word-detail-sheet-dictionary-list__item">
                    <button type="button" className="word-detail-sheet-dictionary-card">
                      <span className="word-detail-sheet-dictionary-card__icon-wrap" aria-hidden>
                        {p.iconSrc ? (
                          <img src={p.iconSrc} alt="" className="word-detail-sheet-dictionary-card__icon" />
                        ) : (
                          <span className="word-detail-sheet-dictionary-card__icon-placeholder" />
                        )}
                      </span>
                      <span className="word-detail-sheet-dictionary-card__label">{p.label}</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            {notesActive ? (
              <div className="word-detail-sheet-note-actions">
                <button type="button" className="word-detail-sheet-new-note-btn">
                  <Plus size={18} aria-hidden className="word-detail-sheet-new-note-btn__icon" />
                  <span>New Note</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <footer className="word-detail-sheet-footer">
          {onWordStatusChange ? (
            <LingQStatusBar
              variant="sheet"
              status={wordStatus}
              onStatusChange={onWordStatusChange}
            />
          ) : null}
        </footer>
      </div>
    </div>
  );
};
