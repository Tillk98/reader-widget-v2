import React, { useRef, useCallback, useEffect, useLayoutEffect, useMemo } from 'react';
import { Volume2, Tags, BookOpenText, PanelRight, X } from 'lucide-react';
import lynxFooterIcon from '../assets/lynx-default.png';
import meaningTabActive from '../assets/meaning-active.png';
import meaningTabInactive from '../assets/meaning-inactive.png';
import sentenceTabActive from '../assets/sentence-active.png';
import sentenceTabInactive from '../assets/sentence-inactive.png';
import dictionariesTabActive from '../assets/dictionaries-active.png';
import dictionariesTabInactive from '../assets/dictionaries-inactive.png';
import notesTabActive from '../assets/lynx-notes-active.png';
import notesTabInactive from '../assets/lynx-notes-subtle.png';
import dictionaryGlosbe from '../assets/dictionary-glosbe.png';
import dictionaryWordReference from '../assets/dictionary-wordreference.png';
import dictionaryLinguee from '../assets/dictionary-linguee.png';
import dictionaryDeepL from '../assets/dictionary-deepl.png';
import type { LingQStatusType } from './LingQStatusBar';
import type { PhraseWordItem } from './PhrasePopUp';
import { LingQStatusBar } from './LingQStatusBar';
import { SentenceBlock } from './SentenceBlock';
import { SentenceMenu } from './SentenceMenu';
import type { WordDetailSentenceContextEntry } from './SentenceBlock';
import { LynxMessageActions } from './LynxMessageActions';
import { NoteField } from './NoteField';
import { DictionaryMenuSheet } from './DictionaryMenuSheet';
import type { DictionaryMenuItem } from './DictionaryMenuSheet';
import { MeaningListItem } from './MeaningListItem';
import { MeaningSection } from './MeaningSection';
import { AddMeaningRow, SavedMeaningRow } from './SavedMeaningRow';
import { HorizontalTermList } from './HorizontalTermList';
import type { VocabTermItem } from './VocabTermList';
import {
  loadSavedMeanings,
  saveSavedMeanings,
  makeSavedMeaningId,
  type SavedMeaning,
} from '../utils/savedMeanings';
import './WordDetailBottomSheet.css';

export type { WordDetailSentenceContextEntry } from './SentenceBlock';

/** Aligned with media drawers; lower = easier to dismiss by dragging */
const DRAG_CLOSE_THRESHOLD_PX = 24;

/** Must match `--word-detail-sheet-duration` in WordDetailBottomSheet.css */
const SHEET_TRANSITION_MS = 380;

const DEFAULT_SUGGESTED_MEANINGS = ['Her hair was undone', 'Her hair was disheveled'];
const DEFAULT_TAGS = ['noun', 'adjective', 'phrase'];
const DEFAULT_PRIMARY_MEANING = 'Her hairstyle was messed up ; her hair was disheveled.';
const DEFAULT_QUOTE_LINE = 'Ihre Frisur war aufgelöst';

const DEFAULT_SENTENCE_CONTEXTS: WordDetailSentenceContextEntry[] = [
  {
    lessonTitle: 'Emil und die Detektive Teil 1',
    translation: 'Her hair was disheveled and hung down like three pounds of wool.',
    originalSentence:
      'Ihre Frisur war aufgelöst und hing wie drei Pfund Wolle nach unten. ',
    variant: 'current',
  },
  {
    lessonTitle: 'Felix im Büro',
    translation: 'She ran through the rain and her hair was disheveled.',
    originalSentence: 'Sie rannte durch den Regen und Ihre Frisur war aufgelöst. ',
    variant: 'archived',
  },
];

function deriveSavedMeanings(wordTranslation: string | undefined): string[] {
  const t = wordTranslation?.trim() ?? '';
  if (!t) return [];
  return t.split(';').map((s) => s.trim()).filter(Boolean);
}

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

/** Dictionaries available to add from the "Manage Your Dictionaries" menu (Figma 3424:6571). */
const DEFAULT_MORE_DICTIONARIES: DictionaryMenuItem[] = [
  { id: 'google-search', label: 'Google Search' },
  { id: 'beolingus', label: 'BeoLingus' },
  { id: 'leo', label: 'Leo' },
  { id: 'babla', label: 'bab.la' },
  { id: 'forvo', label: 'Forvo' },
];

export type WordDetailWordNote = {
  meta: string;
  body: string;
};

const DEFAULT_WORD_NOTE: WordDetailWordNote = {
  meta: '',
  body: '',
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
  /** When set, replaces auto-split from `wordTranslation` on `;`. */
  savedMeanings?: string[];
  /** Stored sentence contexts (current lesson first). Defaults to Figma demo data. */
  sentenceContexts?: WordDetailSentenceContextEntry[];
  sentenceTerms?: WordDetailSentenceTerm[];
  /** Called when a term card in the sentence term list is tapped — same as sentence mode's onOpenDetail. */
  onSentenceTermOpen?: (termText: string) => void;
  onSentenceAudio?: (entry: WordDetailSentenceContextEntry) => void;
  onGoToLesson?: (entry: WordDetailSentenceContextEntry) => void;
  /** Lynx “Explain This” primary explanation (typewriter + settle animation uses this on first visit). */
  lynxLatestBody?: string;
  /** Older Lynx messages below the latest card (static in prototype). */
  lynxHistoryMessages?: WordDetailLynxHistoryMessage[];
  /** Host: TTS or play recorded explanation for the given message. */
  onLynxAudio?: (message: WordDetailLynxHistoryMessage) => void;
  /** Host: regenerate explanation for the given message. */
  onLynxRefresh?: (message: WordDetailLynxHistoryMessage) => void;
  /** Dictionary sources shown in the bottom horizontal strip (Dictionaries tab). */
  dictionaryProviders?: WordDetailDictionaryProvider[];
  /** Single user note shown on the Notes tab (static; not AI-generated). */
  wordNote?: WordDetailWordNote;
  /** Called when the user edits the primary meaning in the header field. */
  onWordTranslationChange?: (value: string) => void;
  /** Footer Lynx button — opens the Lynx explanation/chat for this word. */
  onLynx?: () => void;
  /** When set, renders a "Words in this phrase" breakdown on the Meanings tab (phrase LingQ). */
  phraseWords?: PhraseWordItem[];
  /** Tap a word in the phrase breakdown → open that word's detail. */
  onPhraseWordOpen?: (wordId: string) => void;
  /** True when the viewport is ≥768px — shows the side-panel toggle button beside the X. */
  isTablet?: boolean;
  /** True when the widget is docked as a side panel beside the text (rendered inline, no overlay). */
  panelMode?: boolean;
  /** Toggle between the bottom sheet and the docked side panel. */
  onTogglePanelMode?: () => void;
}

export const WordDetailBottomSheet: React.FC<WordDetailBottomSheetProps> = ({
  wordText,
  wordTranslation,
  wordStatus = 'New',
  onWordStatusChange,
  onClose,
  suggestedMeanings = DEFAULT_SUGGESTED_MEANINGS,
  tags = DEFAULT_TAGS,
  savedMeanings: savedMeaningsProp,
  sentenceContexts = DEFAULT_SENTENCE_CONTEXTS,
  sentenceTerms = DEFAULT_SENTENCE_TERMS,
  onSentenceTermOpen,
  onSentenceAudio,
  onGoToLesson,
  lynxLatestBody = DEFAULT_LYNX_LATEST_BODY,
  lynxHistoryMessages = DEFAULT_LYNX_HISTORY,
  onLynxAudio,
  onLynxRefresh,
  dictionaryProviders = DEFAULT_DICTIONARY_PROVIDERS,
  wordNote = DEFAULT_WORD_NOTE,
  onLynx,
  phraseWords,
  onPhraseWordOpen,
  isTablet,
  panelMode,
  onTogglePanelMode,
}) => {
  const handleDragStartYRef = useRef<number | null>(null);
  const onCloseRef = useRef(onClose);
  const hasPresentedRef = useRef(false);
  const panelModeRef = useRef(panelMode ?? false);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    panelModeRef.current = panelMode ?? false;
  }, [panelMode]);

  const [activeTab, setActiveTab] = React.useState<WordDetailTabId>('meanings');

  /**
   * Meanings tab: the header tags collapse once the content is scrolled down (shrinking the
   * header on small screens) and reappear when scrolled back to the top.
   *
   * Collapsing the tag row grows the scroll area, which on short screens can make the content
   * fit entirely — the browser then clamps scrollTop back to 0, which would naively re-expand
   * the tags and oscillate. `collapseGuardRef` ignores scroll events fired during the collapse
   * relayout (the CSS transition) so a single change settles instead of looping.
   */
  const scrollRef = useRef<HTMLDivElement>(null);
  const [headerCondensed, setHeaderCondensed] = React.useState(false);
  const headerCondensedRef = useRef(false);
  const collapseGuardRef = useRef<number | null>(null);
  const handleContentScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || collapseGuardRef.current !== null) return;
    const shouldCondense = el.scrollTop > 8;
    if (shouldCondense === headerCondensedRef.current) return;
    headerCondensedRef.current = shouldCondense;
    setHeaderCondensed(shouldCondense);
    // Block re-toggling until the collapse/expand transition (~0.28s) has settled.
    collapseGuardRef.current = window.setTimeout(() => {
      collapseGuardRef.current = null;
    }, 340);
  }, []);
  useEffect(
    () => () => {
      if (collapseGuardRef.current !== null) clearTimeout(collapseGuardRef.current);
    },
    [],
  );

  const lynxIntroDoneRef = useRef(false);
  const [lynxPhase, setLynxPhase] = React.useState<LynxPhase>('idle');
  const [lynxTypedLength, setLynxTypedLength] = React.useState(0);

  const quoteLine = wordText.trim() !== '' ? wordText : DEFAULT_QUOTE_LINE;
  const primaryMeaning =
    wordTranslation != null && wordTranslation.trim() !== ''
      ? wordTranslation
      : DEFAULT_PRIMARY_MEANING;

  // In panel mode the widget is docked and shown immediately — no slide-in / slide-out.
  const [sheetOpen, setSheetOpen] = React.useState(() => panelMode === true);

  const requestClose = useCallback(() => {
    // Docked panel: dismiss immediately (no slide-down animation).
    if (panelModeRef.current) {
      onCloseRef.current();
      return;
    }
    if (!hasPresentedRef.current) {
      onCloseRef.current();
      return;
    }
    setSheetOpen(false);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    handleDragStartYRef.current = e.clientY;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (handleDragStartYRef.current === null) return;
    e.preventDefault();
    const deltaY = e.clientY - handleDragStartYRef.current;
    if (deltaY >= DRAG_CLOSE_THRESHOLD_PX) {
      handleDragStartYRef.current = null;
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      requestClose();
    }
  }, [requestClose]);

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (handleDragStartYRef.current === null) return;
      const deltaY = e.clientY - handleDragStartYRef.current;
      if (deltaY >= DRAG_CLOSE_THRESHOLD_PX) requestClose();
      handleDragStartYRef.current = null;
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    },
    [requestClose]
  );

  const handlePointerCancel = useCallback((e: React.PointerEvent) => {
    handleDragStartYRef.current = null;
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
  }, []);

  useEffect(() => {
    if (panelMode) return; // docked panel is already open; no slide-in
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setSheetOpen(true));
    });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (sheetOpen) hasPresentedRef.current = true;
  }, [sheetOpen]);

  const panelRef = useRef<HTMLDivElement>(null);

  /* Tablet: present as a centered floating modal (over a light scrim) instead of a bottom sheet.
     Layout/dismissal are CSS-driven — the backdrop click handler on the root closes it. */
  const presentFloating = !!isTablet && !panelMode;

  useEffect(() => {
    if (sheetOpen || !hasPresentedRef.current) return;
    const panel = panelRef.current;
    let finished = false;
    const invokeClose = () => {
      if (finished) return;
      finished = true;
      onCloseRef.current();
    };
    const onTransitionEnd = (e: TransitionEvent) => {
      if (!panel || e.target !== panel || e.propertyName !== 'transform') return;
      panel.removeEventListener('transitionend', onTransitionEnd);
      invokeClose();
    };
    if (panel) {
      panel.addEventListener('transitionend', onTransitionEnd);
    }
    const t = window.setTimeout(invokeClose, SHEET_TRANSITION_MS + 80);
    return () => {
      panel?.removeEventListener('transitionend', onTransitionEnd);
      clearTimeout(t);
    };
  }, [sheetOpen]);

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

  const resolvedSavedMeanings = React.useMemo(() => {
    if (savedMeaningsProp !== undefined) return savedMeaningsProp;
    return deriveSavedMeanings(wordTranslation);
  }, [savedMeaningsProp, wordTranslation]);

  /**
   * Editable, persisted saved meanings (add / edit / delete / reorder). Keyed per word so a
   * customized list is restored next time the sheet opens for that word.
   */
  const savedStoreKey = (wordText ?? '').trim();
  const savedSignature = resolvedSavedMeanings.join('\u0000');
  const [savedMeanings, setSavedMeanings] = React.useState<SavedMeaning[]>(() => {
    const stored = loadSavedMeanings(savedStoreKey);
    return stored ?? resolvedSavedMeanings.map((text) => ({ id: makeSavedMeaningId(), text }));
  });
  useEffect(() => {
    const stored = loadSavedMeanings(savedStoreKey);
    setSavedMeanings(
      stored ?? resolvedSavedMeanings.map((text) => ({ id: makeSavedMeaningId(), text })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedStoreKey, savedSignature]);

  const commitSavedMeanings = useCallback(
    (next: SavedMeaning[]) => {
      saveSavedMeanings(savedStoreKey, next);
      return next;
    },
    [savedStoreKey],
  );

  const addSavedMeaning = useCallback(
    (text: string) => {
      const value = text.trim();
      if (!value) return;
      setSavedMeanings((prev) => {
        if (prev.some((m) => m.text === value)) return prev;
        return commitSavedMeanings([...prev, { id: makeSavedMeaningId(), text: value }]);
      });
    },
    [commitSavedMeanings],
  );

  const editSavedMeaning = useCallback(
    (id: string, text: string) => {
      setSavedMeanings((prev) =>
        commitSavedMeanings(prev.map((m) => (m.id === id ? { ...m, text } : m))),
      );
    },
    [commitSavedMeanings],
  );

  const deleteSavedMeaning = useCallback(
    (id: string) => {
      setSavedMeanings((prev) => commitSavedMeanings(prev.filter((m) => m.id !== id)));
    },
    [commitSavedMeanings],
  );

  /** The master meaning at the top is the amalgamation of the saved meanings. */
  const masterMeaning =
    savedMeanings.length > 0 ? savedMeanings.map((m) => m.text).join(' ; ') : primaryMeaning;

  /** Dictionaries shown in the horizontal strip; editable via the manage menu. */
  const [activeDictionaries, setActiveDictionaries] =
    React.useState<WordDetailDictionaryProvider[]>(dictionaryProviders);
  useEffect(() => {
    setActiveDictionaries(dictionaryProviders);
  }, [dictionaryProviders]);
  const [moreDictionaries, setMoreDictionaries] =
    React.useState<DictionaryMenuItem[]>(DEFAULT_MORE_DICTIONARIES);
  const [dictMenuOpen, setDictMenuOpen] = React.useState(false);

  const handleDictReorder = useCallback((from: number, to: number) => {
    setActiveDictionaries((prev) => {
      if (from === to || from < 0 || to < 0 || from >= prev.length || to >= prev.length) {
        return prev;
      }
      const next = prev.slice();
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  const handleDictRemove = useCallback((id: string) => {
    setActiveDictionaries((prev) => {
      const found = prev.find((p) => p.id === id);
      if (found) {
        setMoreDictionaries((m) =>
          m.some((x) => x.id === id) ? m : [...m, { id: found.id, label: found.label }]
        );
      }
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const handleDictAdd = useCallback(
    (id: string) => {
      const found = moreDictionaries.find((p) => p.id === id);
      setMoreDictionaries((prev) => prev.filter((p) => p.id !== id));
      if (found) {
        setActiveDictionaries((prev) =>
          prev.some((x) => x.id === id) ? prev : [...prev, { id: found.id, label: found.label }]
        );
      }
    },
    [moreDictionaries]
  );

  /** Convert sentenceTerms to the VocabTermItem array HorizontalTermList expects. */
  const sentenceTermItems = useMemo(
    (): VocabTermItem[] =>
      sentenceTerms.map((t) => ({
        id: t.term,
        text: t.term,
        translation: t.meaning || undefined,
      })),
    [sentenceTerms],
  );

  /**
   * Mutable sentence-term statuses: initialised from the prop variants and updated
   * locally when the user taps/long-presses a card to create or change a LingQ.
   * Lazy initialiser avoids a flash where every card briefly appears as "new".
   */
  const [sentenceTermStatusMap, setSentenceTermStatusMap] = React.useState<
    Record<string, LingQStatusType>
  >(() => {
    const map: Record<string, LingQStatusType> = {};
    for (const t of sentenceTerms) {
      if (t.variant === 'lingq') map[t.term] = 'Recognized';
    }
    return map;
  });

  const handleSentenceTermStatusChange = useCallback(
    (wordId: string, status: LingQStatusType) => {
      setSentenceTermStatusMap((prev) => ({ ...prev, [wordId]: status }));
    },
    [],
  );

  return (
    <div
      className={`word-detail-sheet-root ${sheetOpen ? 'is-open' : ''} ${panelMode ? 'is-panel-mode' : ''} ${presentFloating ? 'is-floating' : ''}`}
      role="dialog"
      aria-label="Word details"
      onClick={(e) => !panelMode && e.target === e.currentTarget && requestClose()}
    >
      <div ref={panelRef} className="word-detail-sheet-panel">
        <button
          type="button"
          className="word-detail-sheet-handle"
          aria-label="Drag down or tap to close"
          onClick={(e) => {
            e.stopPropagation();
            requestClose();
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
        />

        {/* Top-right button set (Figma ButtonSet 4613:17842): the side-panel toggle joins the X
            close on tablet (≥768px). The toggle is active (blue) while the panel is docked. */}
        <div className="word-detail-sheet-button-set">
          {(isTablet || panelMode) && (
            <button
              type="button"
              className={`word-detail-sheet-vol-btn word-detail-sheet-panel-toggle${panelMode ? ' is-active' : ''}`}
              aria-label={panelMode ? 'Dock as bottom sheet' : 'Open as side panel'}
              aria-pressed={panelMode}
              onClick={(e) => {
                e.stopPropagation();
                onTogglePanelMode?.();
              }}
            >
              <PanelRight size={16} aria-hidden />
            </button>
          )}
          <button
            type="button"
            className="word-detail-sheet-vol-btn word-detail-sheet-close"
            aria-label="Close word detail"
            onClick={(e) => {
              e.stopPropagation();
              requestClose();
            }}
          >
            <X size={16} aria-hidden />
          </button>
        </div>

        <div className="word-detail-sheet-header-block">
          <div className="word-detail-sheet-header-content">
            <div className="word-detail-sheet-original-row">
              <button type="button" className="word-detail-sheet-audio-btn" aria-label="Play audio">
                <Volume2 size={18} aria-hidden />
              </button>
              <p className="word-detail-sheet-original-text">{quoteLine}</p>
            </div>
            <div className="word-detail-sheet-meaning-row">
              <p className="word-detail-sheet-meaning-text">{masterMeaning}</p>
            </div>
            {meaningsActive && tags.length > 0 && (
              <div
                className={`word-detail-sheet-tag-row${headerCondensed ? ' word-detail-sheet-tag-row--collapsed' : ''}`}
              >
                <button type="button" className="word-detail-sheet-tags-btn" aria-label="Add tags">
                  <Tags size={16} aria-hidden />
                </button>
                <div className="word-detail-sheet-tag-list">
                  {tags.map((tag) => (
                    <span key={tag} className="word-detail-sheet-tag-pill">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
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
            ref={scrollRef}
            onScroll={handleContentScroll}
            className={`word-detail-sheet-scroll${dictionariesActive ? ' word-detail-sheet-scroll--dictionary' : ''}${meaningsActive ? ' word-detail-sheet-scroll--meanings' : ''}`}
          >
            {meaningsActive ? (
              <>
                <MeaningSection
                  label="SAVED MEANINGS"
                  items={savedMeanings}
                  getKey={(m) => m.id}
                  renderItem={(m) => (
                    <SavedMeaningRow
                      meaning={m.text}
                      onSave={(text) => editSavedMeaning(m.id, text)}
                      onDelete={() => deleteSavedMeaning(m.id)}
                    />
                  )}
                  footer={<AddMeaningRow onAdd={(text) => addSavedMeaning(text)} />}
                />

                <MeaningSection
                  label="MORE MEANINGS"
                  items={suggestedMeanings}
                  getKey={(m) => m}
                  renderItem={(m) => (
                    <MeaningListItem meaning={m} cta="add" onCta={() => addSavedMeaning(m)} />
                  )}
                />

                {phraseWords && phraseWords.length > 0 ? (
                  <MeaningSection
                    label="WORDS IN THIS PHRASE"
                    items={phraseWords}
                    getKey={(w) => w.id}
                    renderItem={(w) => (
                      <MeaningListItem
                        originalText={w.text}
                        meaning={w.translation}
                        cta="open"
                        onCta={() => onPhraseWordOpen?.(w.id)}
                      />
                    )}
                  />
                ) : null}
              </>
            ) : null}

            {sentenceActive ? (
              <div className="word-detail-sheet-sentence">
                <div className="word-detail-sheet-sentence__group">
                  {sentenceContexts
                    .filter((e) => e.variant === 'current')
                    .map((entry, i) => (
                      <SentenceBlock key={`current-${i}`} entry={entry} onAudio={onSentenceAudio} />
                    ))}
                  <HorizontalTermList
                    items={sentenceTermItems}
                    wordStatusMap={sentenceTermStatusMap}
                    selectedWordId={wordText}
                    onOpenDetail={(id) => onSentenceTermOpen?.(id)}
                    onStatusChange={handleSentenceTermStatusChange}
                  />
                </div>
                <SentenceMenu
                  label="PAST ENCOUNTERS"
                  entries={sentenceContexts.filter((e) => e.variant !== 'current')}
                  onAudio={onSentenceAudio}
                  onGoToLesson={onGoToLesson}
                />
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
                    <LynxMessageActions
                      payload={{
                        meta:
                          lynxPhase === 'fresh' || lynxPhase === 'settled'
                            ? 'Generated Just Now'
                            : undefined,
                        body: lynxLatestBody,
                      }}
                      onAudio={() =>
                        onLynxAudio?.({
                          meta:
                            lynxPhase === 'fresh' || lynxPhase === 'settled'
                              ? 'Generated Just Now'
                              : '',
                          body: lynxLatestBody,
                        })
                      }
                      onRefresh={() =>
                        onLynxRefresh?.({
                          meta:
                            lynxPhase === 'fresh' || lynxPhase === 'settled'
                              ? 'Generated Just Now'
                              : '',
                          body: lynxLatestBody,
                        })
                      }
                    />
                  </div>
                ) : null}

                {lynxHistoryMessages.map((msg, i) => (
                  <div key={`${msg.meta}-${i}`} className="word-detail-sheet-lynx-card word-detail-sheet-lynx-card--elevated">
                    <p className="word-detail-sheet-lynx-card__meta">{msg.meta}</p>
                    <div className="word-detail-sheet-lynx-card__body">{msg.body}</div>
                    <LynxMessageActions
                      payload={{ meta: msg.meta, body: msg.body }}
                      onAudio={() => onLynxAudio?.(msg)}
                      onRefresh={() => onLynxRefresh?.(msg)}
                    />
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
                <NoteField
                  initialNote={wordNote.body}
                  initialUpdatedAt={wordNote.meta.replace(/^Updated\s+/i, '')}
                />
              </div>
            ) : null}
          </div>

          <div className="word-detail-sheet-content-anchor">
            {dictionariesActive ? (
              <div className="word-detail-sheet-dictionary-bar">
                <button
                  type="button"
                  className="word-detail-sheet-dictionary-manage"
                  aria-label="Manage dictionaries"
                  onClick={() => setDictMenuOpen(true)}
                >
                  <BookOpenText size={16} aria-hidden />
                </button>
                <div className="word-detail-sheet-dictionary-list" role="list" aria-label="Dictionary sources">
                  {activeDictionaries.map((p) => (
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
              </div>
            ) : null}

          </div>
        </div>

        <footer className="word-detail-sheet-footer">
          <div className="word-detail-sheet-footer-row">
            {onWordStatusChange ? (
              <LingQStatusBar
                variant="sheet"
                status={wordStatus}
                onStatusChange={onWordStatusChange}
              />
            ) : (
              <span className="word-detail-sheet-footer-spacer" />
            )}
            {/* SidePanel footer variant: drop the Lynx button (Figma WidgetFooter Page vs SidePanel). */}
            {!panelMode && (
              <button
                type="button"
                className="word-detail-sheet-lynx-btn"
                aria-label="Ask Lynx"
                onClick={() => onLynx?.()}
              >
                <img src={lynxFooterIcon} alt="" className="word-detail-sheet-lynx-btn__icon" aria-hidden />
              </button>
            )}
          </div>
        </footer>
      </div>

      <DictionaryMenuSheet
        open={dictMenuOpen}
        onClose={() => setDictMenuOpen(false)}
        active={activeDictionaries.map((d) => ({ id: d.id, label: d.label }))}
        more={moreDictionaries}
        onReorder={handleDictReorder}
        onRemove={handleDictRemove}
        onAdd={handleDictAdd}
      />
    </div>
  );
};
