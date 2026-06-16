import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { Library } from 'lucide-react';
import { lesson, reviewTerms, buildReviewTerms } from '../data/lesson';
import type { Word } from '../data/lesson';
import { Page as PageComponent } from './Page';
import type { LingQStatusType } from './LingQStatusBar';
import { ReaderPopUp } from './ReaderPopUp';
import { QuickStatusPopup } from './QuickStatusPopup';
import { PhrasePickTooltip } from './PhrasePickTooltip';
import { PhrasePopUp, type PhraseWordItem } from './PhrasePopUp';
import { countWords, isPunctuation, joinWordsText, joinWordsTranslation, MAX_PHRASE_WORDS } from '../utils/phrase';
import { WordDetailBottomSheet } from './WordDetailBottomSheet';
import { ExitLessonPopup } from './ExitLessonPopup';
import { LynxChatMode } from './LynxChatMode';
import { ReaderBottomBar } from './ReaderBottomBar';
import { SentenceMode } from './SentenceMode';
import { ReviewMode } from './ReviewMode';
import {
  ReviewFilterSheet,
  DEFAULT_REVIEW_STATUS,
  type ReviewFilterValue,
  type ReviewStatusKey,
} from './ReviewFilterSheet';
import { VideoModeBottomBar } from './VideoModeBottomBar';
import { VideoModeVideoPlayer } from './VideoModeVideoPlayer';
import videoModeThumbnail from '../assets/video-mode-thumbnail.png';
import lessonImage from '../assets/lesson-image.png';
import streakIcon from '../assets/streak-icon.png';
import { AudioMiniPlayer } from './AudioMiniPlayer';
import { AudioSettingsSheet } from './AudioSettingsSheet';
import { CourseInfoSheet } from './CourseInfoSheet';
import { StatusSnackbar } from './StatusSnackbar';
import { startViewTransition, supportsViewTransition } from '../utils/viewTransition';
import './Reader.css';

const DRAG_THRESHOLD_PX = 10;
const SWIPE_THRESHOLD_RATIO = 0.15;

interface PhraseSelection {
  ids: string[];
  phraseText: string;
  meaning: string;
  /** Per-word breakdown (excludes punctuation) shown in the popup list. */
  words: PhraseWordItem[];
  /** ≤ 9 words within a single sentence → eligible for a phrase LingQ. */
  valid: boolean;
}

type MediaMode = 'none' | 'video' | 'audio';

interface Page {
  words: Word[];
}

export const Reader: React.FC = () => {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [pages, setPages] = useState<Page[]>([]);
  const [clickedWords, setClickedWords] = useState<Set<string>>(new Set());
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
  const [longPressWordId, setLongPressWordId] = useState<string | null>(null);
  /** Active "Select a Phrase" pick: the long-pressed anchor word; the next tapped word completes the phrase. */
  const [phrasePick, setPhrasePick] = useState<{ anchorId: string; anchorIndex: number } | null>(null);
  // Seed a mix of existing LingQ statuses so Review mode shows both saved terms and
  // unsaved ("+") terms out of the box (these words also read as LingQs in the lesson).
  const [wordStatusMap, setWordStatusMap] = useState<Record<string, LingQStatusType>>(() => {
    const seed: Record<string, LingQStatusType> = {};
    const cycle: LingQStatusType[] = ['New', 'Learned', 'Familiar', 'Recognized'];
    // Pre-save a few terms near the top of the list so Review opens on a realistic mix of
    // saved (numbered) and unsaved ("+") terms, without flooding the reading view with LingQs.
    reviewTerms.slice(0, 16).forEach((term, i) => {
      if (i % 3 === 1) seed[term.id] = cycle[i % cycle.length];
    });
    return seed;
  });
  const [sentenceHorizontalList, setSentenceHorizontalList] = useState(false);

  const [snackbar, setSnackbar] = useState<{
    key: number;
    wordId: string;
    status: LingQStatusType;
    previousStatus: LingQStatusType;
  } | null>(null);
  const snackbarKeyRef = useRef(0);

  /** Word ids currently highlighted as part of an in-progress / open phrase selection. */
  const [phraseHighlightIds, setPhraseHighlightIds] = useState<Set<string>>(() => new Set());
  /** Finalized phrase selection driving the phrase popup. */
  const [phraseSelection, setPhraseSelection] = useState<PhraseSelection | null>(null);
  /** Valid phrase expanded into the full detail sheet. */
  const [phraseDetailOpen, setPhraseDetailOpen] = useState(false);
  /** LingQ status per phrase, keyed by the joined word ids of the selection. */
  const [phraseStatusMap, setPhraseStatusMap] = useState<Record<string, LingQStatusType>>({});
  /** "Exit lesson?" confirmation popup, opened from the header Library button. */
  const [exitPopupOpen, setExitPopupOpen] = useState(false);
  /** Course info sheet opened from the audio settings lesson header. */
  const [courseInfoOpen, setCourseInfoOpen] = useState(false);
  /** Full-screen Lynx chat mode, opened from the bottom bar Lynx button. */
  const [lynxChatOpen, setLynxChatOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef<number>(0);
  const dragOffsetPx = useRef<number>(0);
  const ignoreNextWordClick = useRef(false);
  /** Timestamp (ms) when phrase-pick mode was entered — used to suppress ghost clicks on mobile. */
  const phrasePickStartTimeRef = useRef<number>(0);
  /** Skip ResizeObserver pagination while swiping — avoids remounting pages mid-gesture (white flash). */
  const isPageSwipeDraggingRef = useRef(false);
  /** Block pagination recalculation briefly after a page change (resize often fires during transform; recalc remounts rows → flash). */
  const paginationCooldownUntilRef = useRef(0);
  const resizePaginateDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipPaginationCooldownOnMountRef = useRef(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [contentWidthPx, setContentWidthPx] = useState(1);
  const [mediaMode, setMediaMode] = useState<MediaMode>('none');
  const [sentenceMode, setSentenceMode] = useState(false);
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewFilterOpen, setReviewFilterOpen] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<ReviewFilterValue>({
    method: 'list',
    scope: 'lesson',
    status: DEFAULT_REVIEW_STATUS,
  });
  const [videoBarExpanded, setVideoBarExpanded] = useState(false);
  const [isPlaybackPaused, setIsPlaybackPaused] = useState(false);
  const prevMediaModeRef = useRef<MediaMode>(mediaMode);
  /** Measured height of fixed VideoModeBottomBar — positions LingQ strip above it. */
  const [videoBarChromeHeightPx, setVideoBarChromeHeightPx] = useState(0);
  /** Measured height of fixed top video slot — offsets scrollable lesson text. */
  const [videoTopSlotHeightPx, setVideoTopSlotHeightPx] = useState(0);
  /** No View Transitions: slide audio bar out before leaving video mode. */
  const [videoBarExitAnimating, setVideoBarExitAnimating] = useState(false);
  /** Audio-only: floating mini player while still in page mode (no video mini — legal / UX). */
  const [audioMiniPlayerOpen, setAudioMiniPlayerOpen] = useState(false);
  /** True while the mini player plays its slide-out + fade; keeps it mounted until complete. */
  const [audioMiniExitAnimating, setAudioMiniExitAnimating] = useState(false);
  /** Expanded lesson bar: Audio details sheet (video + audio lesson modes). */
  const [audioSettingsOpen, setAudioSettingsOpen] = useState(false);
  const [audioSettingsSheetHeightPx, setAudioSettingsSheetHeightPx] = useState(0);

  const knownWords = React.useMemo(() => {
    const s = new Set<string>();
    for (const [id, status] of Object.entries(wordStatusMap)) {
      if (status === 'Known') s.add(id);
    }
    return s;
  }, [wordStatusMap]);

  const ignoredWords = React.useMemo(() => {
    const s = new Set<string>();
    for (const [id, status] of Object.entries(wordStatusMap)) {
      if (status === 'Ignored') s.add(id);
    }
    return s;
  }, [wordStatusMap]);

  const lingqWords = React.useMemo(() => {
    const s = new Set<string>();
    for (const [id, status] of Object.entries(wordStatusMap)) {
      if (['New', 'Recognized', 'Familiar', 'Learned'].includes(status)) s.add(id);
    }
    return s;
  }, [wordStatusMap]);

  const allWords = React.useMemo(() => {
    const words: Word[] = [];
    lesson.sentences.forEach(sentence => {
      sentence.words.forEach(word => {
        words.push(word);
      });
    });
    return words;
  }, []);

  const wordToSentenceIndex = React.useMemo(() => {
    const m = new Map<string, number>();
    lesson.sentences.forEach((sentence, si) => {
      sentence.words.forEach(w => m.set(w.id, si));
    });
    return m;
  }, []);

  const wordById = React.useMemo(() => {
    const m = new Map<string, Word>();
    allWords.forEach(w => m.set(w.id, w));
    return m;
  }, [allWords]);

  /** Words rendered on the currently visible page (in document order). */
  const currentPageWords = React.useMemo(
    () => pages[currentPageIndex]?.words ?? [],
    [pages, currentPageIndex]
  );
  const currentPageWordIndex = React.useMemo(() => {
    const m = new Map<string, number>();
    currentPageWords.forEach((w, i) => m.set(w.id, i));
    return m;
  }, [currentPageWords]);
  /** Mirror the page word maps in refs so the pointer callbacks stay stable. */
  const currentPageWordsRef = useRef(currentPageWords);
  const currentPageWordIndexRef = useRef(currentPageWordIndex);
  useEffect(() => {
    currentPageWordsRef.current = currentPageWords;
    currentPageWordIndexRef.current = currentPageWordIndex;
  }, [currentPageWords, currentPageWordIndex]);

  const calculatePages = useCallback(() => {
    if (!containerRef.current) return;

    const readerEl = containerRef.current;
    const contentEl = contentRef.current;
    const containerWidth = (contentEl ?? readerEl).clientWidth;
    const PAGE_CONTENT_VERTICAL_PADDING = 12; /* matches Page.css 6px + 6px */
    const readerContentPaddingBottomPage = 64; /* matches .reader-content padding-bottom (page mode) */

    let availableHeight: number;
    if (contentEl) {
      /* Measure the real column: .reader clientHeight mixes in full viewport; content box matches the page stack. */
      availableHeight =
        contentEl.clientHeight - readerContentPaddingBottomPage - PAGE_CONTENT_VERTICAL_PADDING;
    } else {
      /* Loading shell: .reader-content not mounted yet — approximate with legacy reserves */
      const titleHeight = 80;
      const topReserved = 80; /* matches .reader-content margin-top (page mode) */
      const bottomReserved = 64; /* matches .reader-content padding-bottom (page mode) */
      availableHeight =
        readerEl.clientHeight -
        topReserved -
        bottomReserved -
        PAGE_CONTENT_VERTICAL_PADDING -
        titleHeight;
    }

    if (containerWidth === 0 || availableHeight <= 0) {
      if (allWords.length > 0) {
        setPages([{ words: allWords }]);
      }
      return;
    }

    /* Video / audio lesson mode: full lesson in one column; vertical scroll — no horizontal pagination. */
    if (mediaMode === 'video' || mediaMode === 'audio') {
      setPages(allWords.length > 0 ? [{ words: allWords }] : []);
      setCurrentPageIndex(0);
      return;
    }

    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.top = '-9999px';
    tempContainer.style.left = '-9999px';
    const contentWidth = Math.min(containerWidth, 600);
    tempContainer.style.width = `${contentWidth}px`;
    tempContainer.style.paddingTop = '6px';
    tempContainer.style.paddingBottom = '6px';
    tempContainer.style.paddingLeft = '12px';
    tempContainer.style.paddingRight = '12px';
    tempContainer.style.boxSizing = 'border-box';
    tempContainer.style.fontFamily = 'Lora, serif';
    tempContainer.style.fontSize = '18px';
    tempContainer.style.lineHeight = '37.8px';
    tempContainer.style.whiteSpace = 'normal';
    tempContainer.style.wordWrap = 'break-word';
    tempContainer.style.overflow = 'visible';
    document.body.appendChild(tempContainer);

    const applyWordSpanMetrics = (el: HTMLSpanElement) => {
      el.style.display = 'inline-block';
      el.style.padding = '2px 1px';
      el.style.fontFamily = 'Lora, serif';
      el.style.fontSize = '18px';
      el.style.lineHeight = '37.8px';
    };

    const newPages: Page[] = [];
    let currentPage: Word[] = [];

    for (let i = 0; i < allWords.length; i++) {
      const word = allWords[i];

      const wordSpan = document.createElement('span');
      wordSpan.textContent = word.text;
      applyWordSpanMetrics(wordSpan);
      tempContainer.appendChild(wordSpan);

      if (i < allWords.length - 1) {
        tempContainer.appendChild(document.createTextNode(' '));
      }

      const measuredHeight = tempContainer.offsetHeight;

      if (measuredHeight > availableHeight && currentPage.length > 0) {
        if (tempContainer.lastChild) {
          tempContainer.removeChild(tempContainer.lastChild);
        }
        if (tempContainer.lastChild) {
          tempContainer.removeChild(tempContainer.lastChild);
        }

        newPages.push({ words: [...currentPage] });

        currentPage = [word];
        tempContainer.innerHTML = '';
        const newWordSpan = document.createElement('span');
        newWordSpan.textContent = word.text;
        applyWordSpanMetrics(newWordSpan);
        tempContainer.appendChild(newWordSpan);
        if (i < allWords.length - 1) {
          tempContainer.appendChild(document.createTextNode(' '));
        }
      } else {
        currentPage.push(word);
      }
    }

    if (currentPage.length > 0) {
      newPages.push({ words: currentPage });
    }

    document.body.removeChild(tempContainer);

    if (newPages.length === 0 && allWords.length > 0) {
      newPages.push({ words: allWords });
    }

    setPages(newPages);

    setCurrentPageIndex(prev => (prev >= newPages.length ? Math.max(0, newPages.length - 1) : prev));
  }, [allWords, mediaMode]);

  const scheduleResizePaginate = useCallback(() => {
    if (resizePaginateDebounceRef.current) clearTimeout(resizePaginateDebounceRef.current);
    resizePaginateDebounceRef.current = setTimeout(() => {
      resizePaginateDebounceRef.current = null;
      if (isPageSwipeDraggingRef.current) return;
      if (Date.now() < paginationCooldownUntilRef.current) return;
      calculatePages();
    }, 140);
  }, [calculatePages]);

  useEffect(() => {
    if (skipPaginationCooldownOnMountRef.current) {
      skipPaginationCooldownOnMountRef.current = false;
      return;
    }
    paginationCooldownUntilRef.current = Date.now() + 480;
  }, [currentPageIndex]);

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (isPageSwipeDraggingRef.current) return;
      scheduleResizePaginate();
    });

    resizeObserver.observe(containerRef.current);

    const handleResize = () => {
      if (isPageSwipeDraggingRef.current) return;
      scheduleResizePaginate();
    };

    window.addEventListener('resize', handleResize);

    calculatePages();

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      if (resizePaginateDebounceRef.current) clearTimeout(resizePaginateDebounceRef.current);
    };
  }, [calculatePages, scheduleResizePaginate]);

  /** `.reader-content` only mounts after `pages` load; a mount-only effect missed the ref and left width at 1px. */
  useLayoutEffect(() => {
    if (pages.length === 0) return;
    const contentEl = contentRef.current;
    if (!contentEl) return;
    const updateWidth = () => setContentWidthPx(Math.max(1, contentEl.clientWidth));
    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    ro.observe(contentEl);
    return () => ro.disconnect();
  }, [pages.length]);

  /** Word ids covered by a [start, end] range of indices into the current page. */
  const phraseIdsFromRange = useCallback((start: number, end: number): string[] => {
    const a = Math.min(start, end);
    const b = Math.max(start, end);
    return currentPageWordsRef.current.slice(a, b + 1).map(w => w.id);
  }, []);

  const clearPhraseSelection = useCallback(() => {
    setPhraseSelection(null);
    setPhraseDetailOpen(false);
    setPhraseHighlightIds(new Set());
    setPhrasePick(null);
  }, []);

  /** Bounding rect spanning all words in the selection (viewport coords). */
  const phraseAnchorRectFromIds = useCallback((ids: string[]): DOMRect | null => {
    let left = Infinity;
    let top = Infinity;
    let right = -Infinity;
    let bottom = -Infinity;
    for (const id of ids) {
      const el = document.getElementById(id);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      left = Math.min(left, r.left);
      top = Math.min(top, r.top);
      right = Math.max(right, r.right);
      bottom = Math.max(bottom, r.bottom);
    }
    if (left === Infinity) return null;
    return new DOMRect(left, top, right - left, bottom - top);
  }, []);

  /** Build + show a phrase popup from an inclusive index range. Returns false for a single word. */
  const commitPhraseRange = useCallback(
    (start: number, end: number): boolean => {
      const ids = phraseIdsFromRange(start, end);
      if (ids.length <= 1) {
        setPhraseHighlightIds(new Set());
        return false;
      }
      setLongPressWordId(null); // a committed phrase supersedes the quick word menu
      const words = ids.map(id => wordById.get(id)).filter((w): w is Word => Boolean(w));
      const sentenceIds = new Set(ids.map(id => wordToSentenceIndex.get(id)));
      const valid = sentenceIds.size === 1 && countWords(words) <= MAX_PHRASE_WORDS;
      const wordItems: PhraseWordItem[] = words
        .filter(w => !isPunctuation(w.text))
        .map(w => ({ id: w.id, text: w.text, translation: w.translation ?? w.text }));
      setPhraseSelection({
        ids,
        phraseText: joinWordsText(words),
        meaning: joinWordsTranslation(words),
        words: wordItems,
        valid,
      });
      setPhraseHighlightIds(new Set(ids));
      return true;
    },
    [phraseIdsFromRange, wordById, wordToSentenceIndex]
  );

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragStartX.current = e.clientX;
    dragOffsetPx.current = 0;
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!contentRef.current || pages.length === 0) return;
      if (e.pointerType === 'mouse' && e.buttons === 0) return;

      const dx = e.clientX - dragStartX.current;
      if (!isDragging) {
        if (Math.abs(dx) >= DRAG_THRESHOLD_PX) {
          isPageSwipeDraggingRef.current = true;
          setIsDragging(true);
          dragOffsetPx.current = dx;
          setDragOffset(dx);
        }
        return;
      }
      dragOffsetPx.current = dx;
      setDragOffset(dx);
    },
    [isDragging, pages.length]
  );

  const handlePointerUp = useCallback(
    (e?: React.PointerEvent) => {
      if (e?.target) (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      if (!isDragging) return;
      isPageSwipeDraggingRef.current = false;
      ignoreNextWordClick.current = true;
      const contentEl = contentRef.current;
      const width = contentEl ? contentEl.clientWidth : 1;
      const ratio = dragOffsetPx.current / width;
      if (ratio < -SWIPE_THRESHOLD_RATIO && currentPageIndex < pages.length - 1) {
        setCurrentPageIndex(prev => Math.min(pages.length - 1, prev + 1));
      } else if (ratio > SWIPE_THRESHOLD_RATIO && currentPageIndex > 0) {
        setCurrentPageIndex(prev => Math.max(0, prev - 1));
      }
      setIsDragging(false);
      setDragOffset(0);
      dragOffsetPx.current = 0;
    },
    [isDragging, currentPageIndex, pages.length]
  );

  const handlePointerCancel = useCallback((e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    isPageSwipeDraggingRef.current = false;
    setIsDragging(false);
    setDragOffset(0);
    dragOffsetPx.current = 0;
  }, []);

  /* A phrase is anchored to on-screen words: drop it when the page or mode changes. */
  useEffect(() => {
    clearPhraseSelection();
  }, [currentPageIndex, mediaMode, sentenceMode, reviewMode, clearPhraseSelection]);

  /* Phrase-pick mode: tapping a word completes the phrase; tapping anywhere else cancels it. */
  useEffect(() => {
    if (!phrasePick) return;
    const onDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('.sentence-item')) return;
      setPhrasePick(null);
      setPhraseHighlightIds(new Set());
    };
    // Defer so the "Select a Phrase" tap that started this doesn't immediately cancel it.
    const id = window.setTimeout(() => document.addEventListener('pointerdown', onDown, true), 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener('pointerdown', onDown, true);
    };
  }, [phrasePick]);

  /** Long-press a word: show the quick Known / Ignore / Select-a-Phrase popup. */
  const handleWordLongPress = useCallback((wordId: string) => {
    setLongPressWordId(wordId);
    /* Cancel any in-progress page-swipe so the popup drag doesn't accumulate drag distance. */
    setIsDragging(false);
    setDragOffset(0);
    dragOffsetPx.current = 0;
    isPageSwipeDraggingRef.current = false;
    setSnackbar(null);
    setPhrasePick(null);
    setPhraseHighlightIds(new Set());
  }, []);

  /** Dragging after the popup appears now drives the menu (drag-to-select), so keep it open. */
  const handleWordLongPressCancel = useCallback(() => {}, []);

  /**
   * "Select a Phrase" tapped: close the popup and enter phrase-pick mode anchored on the
   * long-pressed word. The next word the user taps completes the phrase (calendar-range style).
   */
  const handleStartPhrasePick = useCallback(() => {
    if (!longPressWordId) return;
    const index = currentPageWordIndex.get(longPressWordId);
    setLongPressWordId(null);
    if (index === undefined) return;
    /* Clear any stale "ignore next click" flag left over from the long-press release so the
     * very first tap in phrase-pick mode is never silently swallowed. */
    ignoreNextWordClick.current = false;
    /* Record entry time so ghost clicks on mobile (synthetic events fired within ~150 ms
     * after the popup tap) are suppressed in handleWordClick. */
    phrasePickStartTimeRef.current = Date.now();
    setPhraseSelection(null);
    setPhraseDetailOpen(false);
    setSnackbar(null);
    setPhrasePick({ anchorId: longPressWordId, anchorIndex: index });
    /* Keep the anchor word highlighted so it's clear it's the phrase's starting point. */
    setPhraseHighlightIds(new Set([longPressWordId]));
  }, [longPressWordId, currentPageWordIndex]);

  const handleWordClick = useCallback(
    (wordId: string) => {
      if (ignoreNextWordClick.current) {
        ignoreNextWordClick.current = false;
        return;
      }
      /* "Select a Phrase" mode: this tap is the phrase's end word (anchor → here, inclusive). */
      if (phrasePick) {
        /* Suppress ghost clicks on mobile: iOS/Android fire a synthetic click ~50–150 ms
         * after the "Select a Phrase" popup tap, landing on whatever word is now visible
         * at those coordinates. Deliberate taps always arrive >300 ms later. */
        if (Date.now() - phrasePickStartTimeRef.current < 300) return;
        const endIndex = currentPageWordIndex.get(wordId);
        if (endIndex !== undefined) commitPhraseRange(phrasePick.anchorIndex, endIndex);
        else setPhraseHighlightIds(new Set());
        setPhrasePick(null);
        return;
      }
      if (knownWords.has(wordId) || ignoredWords.has(wordId)) {
        return;
      }
      /* Selecting a single word dismisses any open phrase selection and snackbar. */
      setPhraseSelection(null);
      setPhraseDetailOpen(false);
      setPhraseHighlightIds(new Set());
      setSnackbar(null);
        if (selectedWordId === wordId) {
        setSelectedWordId(null);
        setClickedWords(prev => {
          const newSet = new Set(prev);
          newSet.delete(wordId);
          return newSet;
        });
      } else {
        setSelectedWordId(wordId);
        setWordStatusMap(prev => ({ ...prev, [wordId]: prev[wordId] ?? 'New' }));
        setClickedWords(prev => {
          const newSet = new Set(prev);
          if (!newSet.has(wordId)) newSet.add(wordId);
          return newSet;
        });
      }
    },
    [selectedWordId, knownWords, ignoredWords, mediaMode, lesson.hasVideo, phrasePick, currentPageWordIndex, commitPhraseRange]
  );

  const handleSentenceWordSelect = useCallback(
    (wordId: string) => {
      handleWordClick(wordId);
    },
    [handleWordClick]
  );

  const handleSentenceListSelect = useCallback(
    (wordId: string) => {
      handleWordClick(wordId);
    },
    [handleWordClick]
  );

  /** Review mode: tap a term to surface its LingQ status bar (no meaning popup). */
  const handleReviewSelect = useCallback(
    (wordId: string) => {
      handleWordClick(wordId);
    },
    [handleWordClick]
  );

  /** Review mode "+": save an untracked word as a LingQ (status "New") and surface the
   * status bar so the user can immediately adjust the level if desired. */
  const handleReviewAdd = useCallback((wordId: string) => {
    setWordStatusMap(prev => ({ ...prev, [wordId]: 'New' }));
    setClickedWords(prev => {
      const next = new Set(prev);
      next.add(wordId);
      return next;
    });
    setSelectedWordId(wordId);
  }, []);

  /** Unified status change handler — updates wordStatusMap and shows the snackbar. */
  const handleStatusChange = useCallback(
    (wordId: string, newStatus: LingQStatusType) => {
      setWordStatusMap(prev => {
        const previousStatus = prev[wordId] ?? 'New';
        snackbarKeyRef.current += 1;
        setSnackbar({
          key: snackbarKeyRef.current,
          wordId,
          status: newStatus,
          previousStatus,
        });
        return { ...prev, [wordId]: newStatus };
      });
    },
    []
  );

  const getWordById = useCallback((wordId: string): Word | undefined => {
    for (const sentence of lesson.sentences) {
      const word = sentence.words.find(w => w.id === wordId);
      if (word) return word;
    }
    return undefined;
  }, []);

  const getWordElement = useCallback((wordId: string): HTMLElement | null => {
    return document.getElementById(wordId);
  }, []);

  const [wordDetailSheetOpen, setWordDetailSheetOpen] = useState(false);
  /** Word detail sheet opened directly from a vocabulary list item (Review / Sentence mode). */
  const [listDetailOpen, setListDetailOpen] = useState(false);
  /** True when viewport is ≥768px (tablet / desktop surface). */
  const [isTablet, setIsTablet] = useState(() => window.innerWidth >= 768);
  /** True when the word detail is displayed as a floating side panel (tablet+ only). */
  const [wordDetailPanelMode, setWordDetailPanelMode] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const tablet = window.innerWidth >= 768;
      setIsTablet(tablet);
      if (!tablet) setWordDetailPanelMode(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setWordDetailSheetOpen(false);
  }, [selectedWordId]);

  const handleClosePopup = useCallback(() => {
    setWordDetailSheetOpen(false);
    setListDetailOpen(false);
    setWordDetailPanelMode(false);
    if (selectedWordId) {
      setClickedWords(prev => {
        const newSet = new Set(prev);
        newSet.delete(selectedWordId);
        return newSet;
      });
    }
    setSelectedWordId(null);
  }, [selectedWordId]);

  /** Tap a vocabulary list item (term): open the full word detail sheet (no status bar / popup). */
  const handleListOpenDetail = useCallback((wordId: string) => {
    setSelectedWordId(wordId);
    setListDetailOpen(true);
    setWordDetailPanelMode(false); // list/review detail always uses the bottom sheet
  }, []);

  /** Tap a word inside the phrase popup's breakdown: open that word's detail sheet. */
  const handlePhraseWordOpen = useCallback(
    (wordId: string) => {
      clearPhraseSelection();
      handleListOpenDetail(wordId);
    },
    [clearPhraseSelection, handleListOpenDetail]
  );

  const selectedWordData = React.useMemo(() => {
    if (!selectedWordId) return null;

    const word = getWordById(selectedWordId);
    if (!word) return null;

    const wordEl = getWordElement(selectedWordId);
    if (!wordEl) return null;

    return { word };
  }, [selectedWordId, getWordById, getWordElement]);

  const resolveSelectedWordAnchorElement = useCallback((): HTMLElement | null => {
    if (!selectedWordId) return null;
    return getWordElement(selectedWordId);
  }, [selectedWordId, getWordElement]);

  const resolveLongPressAnchorElement = useCallback((): HTMLElement | null => {
    if (!longPressWordId) return null;
    return getWordElement(longPressWordId);
  }, [longPressWordId, getWordElement]);

  const [hoveredPageIndex, setHoveredPageIndex] = React.useState<number | null>(null);

  const handleProgressBarClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      if (mediaMode === 'none' && sentenceMode) {
        const count = lesson.sentences.length;
        const idx = Math.min(Math.max(0, Math.floor(percentage * count)), count - 1);
        setSentenceIndex(idx);
        return;
      }
      const pageIndex = Math.min(Math.max(0, Math.floor(percentage * pages.length)), pages.length - 1);
      setCurrentPageIndex(pageIndex);
    },
    [pages.length, mediaMode, sentenceMode]
  );

  const handleProgressBarMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const percentage = mouseX / rect.width;
      const pageIndex = Math.min(Math.max(0, Math.floor(percentage * pages.length)), pages.length - 1);
      setHoveredPageIndex(pageIndex);
    },
    [pages.length]
  );

  const handleProgressBarMouseLeave = useCallback(() => {
    setHoveredPageIndex(null);
  }, []);

  /** Header close (X): closes the lesson — interaction wired in a later step. */
  const handleCloseLesson = useCallback(() => setExitPopupOpen(true), []);

  /** Header stats button: opens lesson stats — interaction wired in a later step. */
  const handleOpenStats = useCallback(() => {}, []);

  /** Review mode filter pill ("Lesson • All") — opens the method / scope / status filter. */
  const handleOpenReviewFilter = useCallback(() => setReviewFilterOpen(true), []);

  const pageColumnPx = Math.max(1, contentWidthPx);
  const trackWidthPx = pages.length * pageColumnPx;
  /** Pixel translate: one column = pageColumnPx; dragOffset is pointer delta in px (same as measure). */
  const pageTranslatePx =
    pages.length === 0 ? 0 : -currentPageIndex * pageColumnPx + dragOffset;

  const isSentenceView = mediaMode === 'none' && sentenceMode;

  /** Entering sentence mode always lands at the top, where the current sentence is. */
  useEffect(() => {
    if (isSentenceView && contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [isSentenceView]);

  /** Map a term to the status category used by the Review filter status bar. */
  const reviewStatusKeyForId = useCallback(
    (id: string): ReviewStatusKey => {
      if (!(id in wordStatusMap)) return 'untracked';
      switch (wordStatusMap[id]) {
        case 'Recognized':
          return '2';
        case 'Familiar':
          return '3';
        case 'Learned':
          return '4';
        case 'Known':
          return 'known';
        case 'Ignored':
          return 'ignored';
        case 'New':
        default:
          return '1';
      }
    },
    [wordStatusMap]
  );

  /** Review terms for the current scope (whole lesson / current page / current sentence). */
  const reviewScopedTerms = React.useMemo(() => {
    switch (reviewFilter.scope) {
      case 'page':
        return buildReviewTerms(pages[currentPageIndex]?.words ?? []);
      case 'sentence':
        return buildReviewTerms(lesson.sentences[sentenceIndex]?.words ?? []);
      case 'lesson':
      default:
        return reviewTerms;
    }
  }, [reviewFilter.scope, pages, currentPageIndex, sentenceIndex]);

  /** Scoped terms narrowed to the selected status categories. */
  const reviewVisibleTerms = React.useMemo(() => {
    const allowed = new Set(reviewFilter.status);
    return reviewScopedTerms.filter(t => allowed.has(reviewStatusKeyForId(t.id)));
  }, [reviewScopedTerms, reviewFilter.status, reviewStatusKeyForId]);

  /** Visible review terms not yet saved as LingQs → blue "+". */
  const reviewUntrackedIds = React.useMemo(() => {
    const ids = new Set<string>();
    for (const term of reviewVisibleTerms) {
      if (!(term.id in wordStatusMap)) ids.add(term.id);
    }
    return ids;
  }, [reviewVisibleTerms, wordStatusMap]);

  /** Header filter pill label: scope • status ("All" when the default range is selected). */
  const reviewFilterLabel = React.useMemo(() => {
    const scopeLabel =
      reviewFilter.scope.charAt(0).toUpperCase() + reviewFilter.scope.slice(1);
    const isDefaultStatus =
      reviewFilter.status.length === DEFAULT_REVIEW_STATUS.length &&
      DEFAULT_REVIEW_STATUS.every(s => reviewFilter.status.includes(s));
    return `${scopeLabel} • ${isDefaultStatus ? 'All' : 'Custom'}`;
  }, [reviewFilter]);

  const totalSentences = lesson.sentences.length;
  const fillProgress = isSentenceView
    ? totalSentences > 0
      ? Math.min(100, ((sentenceIndex + 1) / totalSentences) * 100)
      : 0
    : pages.length > 0
      ? Math.min(100, ((currentPageIndex + 1) / pages.length) * 100)
      : 0;
  const thumbProgress = fillProgress;

  const isPageMode = mediaMode === 'none';
  const isLessonMediaMode = mediaMode === 'video' || mediaMode === 'audio';
  /** Top slot player + fade + top padding (video lessons only). */
  const isVideoChrome = mediaMode === 'video';

  /** Audio mini replaces the default bottom bar (not stacked above it).
   * Word selection does not affect this — in audio mini mode the bottom bar stays as the mini player. */
  const showAudioMiniAsBottomBar =
    (audioMiniPlayerOpen || audioMiniExitAnimating) &&
    mediaMode === 'none' &&
    lesson.hasVideo !== true;

  const contentClassName = [
    'reader-content',
    isLessonMediaMode && 'reader-content--video-mode',
    isLessonMediaMode && videoBarExpanded && 'reader-content--video-expanded',
    showAudioMiniAsBottomBar && 'reader-content--audio-mini',
    isSentenceView && 'reader-content--sentence-mode',
  ]
    .filter(Boolean)
    .join(' ');

  const videoChromeFallbackPx = 132;
  const effectiveVideoChromePx =
    videoBarChromeHeightPx > 0 ? videoBarChromeHeightPx : videoChromeFallbackPx;
  /** Audio settings sheet replaces bar in layout metrics while open. */
  const effectiveLessonBottomChromePx =
    audioSettingsOpen && audioSettingsSheetHeightPx > 0
      ? audioSettingsSheetHeightPx
      : effectiveVideoChromePx;
  /** Fallback until ResizeObserver measures the video chrome (safe area + card + video). */
  const videoTopStackFallbackPx = 236;

  const readerContentVideoStyle: React.CSSProperties | undefined = isLessonMediaMode
    ? isVideoChrome
      ? {
          paddingBottom: `${effectiveLessonBottomChromePx}px`,
          paddingTop:
            videoTopSlotHeightPx > 0
              ? `${videoTopSlotHeightPx}px`
              : `${videoTopStackFallbackPx}px`,
        }
      : {
          paddingBottom: `${effectiveLessonBottomChromePx}px`,
        }
    : undefined;


  /** CSS vars: top stack for video chrome; bottom offset for lesson text fade above expanded media bar. */
  const readerRootStyle: React.CSSProperties | undefined = (() => {
    const vars: Record<string, string> = {};
    if (isVideoChrome) {
      vars['--reader-video-top-stack'] = `${videoTopSlotHeightPx > 0 ? videoTopSlotHeightPx : videoTopStackFallbackPx}px`;
    }
    if (isLessonMediaMode && videoBarExpanded) {
      vars['--reader-lesson-bottom-fade-offset'] = `${effectiveLessonBottomChromePx}px`;
    }
    return Object.keys(vars).length ? (vars as unknown as React.CSSProperties) : undefined;
  })();

  useEffect(() => {
    if (mediaMode !== 'none') return;
    setVideoBarExpanded(false);
    setVideoBarChromeHeightPx(0);
    setVideoTopSlotHeightPx(0);
    setAudioSettingsOpen(false);
    if (!audioMiniPlayerOpen) {
      setIsPlaybackPaused(false);
    }
  }, [mediaMode, audioMiniPlayerOpen]);

  useEffect(() => {
    if (!videoBarExpanded) setAudioSettingsOpen(false);
  }, [videoBarExpanded]);

  /** Leaving lesson media mode: restore default pagination layout and scroll position. */
  useEffect(() => {
    const prev = prevMediaModeRef.current;
    if ((prev === 'video' || prev === 'audio') && mediaMode === 'none') {
      setCurrentPageIndex(0);
      const el = contentRef.current;
      if (el) el.scrollTop = 0;
    }
    prevMediaModeRef.current = mediaMode;
  }, [mediaMode]);

  /** Pause / resume playback (lesson bar, mini player, ReaderBottomBar when word selected). */
  const handlePlaybackPauseToggle = useCallback(() => {
    setIsPlaybackPaused(p => !p);
  }, []);

  /** Default Play: video → full expanded lesson mode; audio → mini player (or resume). */
  const handleDefaultPlay = useCallback(() => {
    if (lesson.hasVideo === true) {
    startViewTransition(() => {
      setMediaMode('video');
      setIsPlaybackPaused(false);
      setVideoBarExpanded(true);
      setAudioMiniPlayerOpen(false);
      setAudioMiniExitAnimating(false);
    });
      return;
    }
    if (audioMiniPlayerOpen) {
      setIsPlaybackPaused(false);
      return;
    }
    startViewTransition(() => {
      setAudioMiniPlayerOpen(true);
      setAudioMiniExitAnimating(false);
      setIsPlaybackPaused(false);
    });
  }, [lesson.hasVideo, audioMiniPlayerOpen]);

  const handleExpandFromAudioMini = useCallback(() => {
    startViewTransition(() => {
      setAudioMiniPlayerOpen(false);
      setAudioMiniExitAnimating(false);
      setMediaMode('audio');
      setVideoBarExpanded(true);
      setIsPlaybackPaused(false);
    });
  }, []);

  const handleAudioMiniExitAnimationComplete = useCallback(() => {
    setAudioMiniPlayerOpen(false);
    setAudioMiniExitAnimating(false);
    /** Pause after exit so the default bar shows Play, but not during the mini dismiss animation (avoids Pause→Play on the mini). */
    setIsPlaybackPaused(true);
  }, []);

  const handleDismissAudioMini = useCallback(() => {
    setAudioMiniExitAnimating(true);
  }, []);

  /** YouTube: always full video lesson mode (expanded bar + top player). */
  const handleEnterVideoModeFromChrome = useCallback(() => {
    startViewTransition(() => {
      setMediaMode('video');
      setIsPlaybackPaused(false);
      setVideoBarExpanded(true);
      setAudioMiniPlayerOpen(false);
      setAudioMiniExitAnimating(false);
    });
  }, []);

  const handleVideoBarExitSlideComplete = useCallback(() => {
    setMediaMode('none');
    setVideoBarExitAnimating(false);
    if (lesson.hasVideo !== true) {
      setAudioMiniPlayerOpen(true);
      setAudioMiniExitAnimating(false);
    } else {
      setAudioMiniPlayerOpen(false);
      setAudioMiniExitAnimating(false);
    }
  }, [lesson.hasVideo]);

  /** Exit expanded lesson mode: audio → page + mini player; video → page only (no mini). */
  const handleExitLessonMedia = useCallback(() => {
    const resumeMini = lesson.hasVideo !== true;
    if (supportsViewTransition()) {
      startViewTransition(() => {
        setMediaMode('none');
        if (resumeMini) {
          setAudioMiniPlayerOpen(true);
          setAudioMiniExitAnimating(false);
        } else {
          setAudioMiniPlayerOpen(false);
          setAudioMiniExitAnimating(false);
        }
      });
      return;
    }
    setVideoBarExitAnimating(true);
  }, [lesson.hasVideo]);

  /** Exit lesson media mode (Escape matches sheet-dismiss habit). */
  useEffect(() => {
    if (mediaMode !== 'video' && mediaMode !== 'audio') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleExitLessonMedia();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mediaMode, handleExitLessonMedia]);

  useEffect(() => {
    if (mediaMode !== 'video' && mediaMode !== 'audio') return;
    const el = contentRef.current;
    if (el) el.scrollTop = 0;
  }, [mediaMode]);

  return (
    <div
      className={[
        'reader',
        isLessonMediaMode && 'reader--video-mode',
        isLessonMediaMode && videoBarExpanded && 'reader--video-mode-expanded',
      ]
        .filter(Boolean)
        .join(' ')}
      ref={containerRef}
      style={readerRootStyle}
    >
      {pages.length === 0 ? (
        <div className="reader-loading">Loading...</div>
      ) : (
        <>
          {isVideoChrome && (
            <VideoModeVideoPlayer
              lessonTitle={lesson.title}
              lessonSource={lesson.source ?? ''}
              lessonImageSrc={lessonImage}
              thumbnailSrc={videoModeThumbnail}
              playbackProgress={0.08}
              isPaused={isPlaybackPaused}
              onTogglePause={handlePlaybackPauseToggle}
              onSlotHeightChange={setVideoTopSlotHeightPx}
            />
          )}
          {isVideoChrome && <div className="reader-video-text-fade--top" aria-hidden />}
          {isPageMode && (
            <div className="reader-progress-container">
              <button
                type="button"
                className="reader-header-button"
                aria-label="Close lesson"
                onClick={handleCloseLesson}
              >
                <Library size={20} strokeWidth={2} />
              </button>
              <div className="reader-progress-bar-wrap">
                <div
                  className="reader-progress-bar"
                  onClick={handleProgressBarClick}
                  onMouseMove={handleProgressBarMouseMove}
                  onMouseLeave={handleProgressBarMouseLeave}
                >
                  <div className="reader-progress-fill" style={{ width: `${fillProgress}%` }} />
                  <div className="reader-progress-thumb" style={{ left: `${thumbProgress}%` }} />
                  {hoveredPageIndex !== null && (
                    <div
                      className="reader-progress-tooltip"
                      style={{ left: `${((hoveredPageIndex + 1) / pages.length) * 100}%` }}
                    >
                      Page {hoveredPageIndex + 1}
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                className="reader-header-button"
                aria-label="Lesson stats"
                onClick={handleOpenStats}
              >
                <img className="reader-header-stats-icon" src={streakIcon} alt="" />
              </button>
            </div>
          )}
          {/* reader-layout: flex-column normally; flex-row in tablet panel mode. */}
          <div className={`reader-layout${isTablet && wordDetailPanelMode ? ' reader-layout--split' : ''}`}>
            <div
              className={contentClassName}
              style={readerContentVideoStyle}
              ref={contentRef}
              onPointerDown={isPageMode && !sentenceMode && !longPressWordId ? handlePointerDown : undefined}
              onPointerMove={isPageMode && !sentenceMode && !longPressWordId ? handlePointerMove : undefined}
              onPointerUp={isPageMode && !sentenceMode && !longPressWordId ? e => handlePointerUp(e) : undefined}
              onPointerLeave={isPageMode && !sentenceMode && !longPressWordId ? () => handlePointerUp() : undefined}
              onPointerCancel={isPageMode && !sentenceMode && !longPressWordId ? handlePointerCancel : undefined}
            >
              <div className="reader-body-vt">
                {isSentenceView ? (
                  <SentenceMode
                    sentences={lesson.sentences}
                    index={sentenceIndex}
                    onIndexChange={setSentenceIndex}
                    wordStatusMap={wordStatusMap}
                    selectedWordId={selectedWordId}
                    onWordSelect={handleSentenceWordSelect}
                    onListWordSelect={handleSentenceListSelect}
                    onListWordOpenDetail={handleListOpenDetail}
                    onListWordStatusChange={(wordId, status) => handleStatusChange(wordId, status)}
                    onDeselect={handleClosePopup}
                  />
                ) : isLessonMediaMode ? (
                  <div className="reader-video-scroll">
                    <PageComponent
                      words={allWords}
                      clickedWords={clickedWords}
                      lingqWords={lingqWords}
                      onWordClick={handleWordClick}
                      onWordLongPress={handleWordLongPress}
                      onWordLongPressCancel={handleWordLongPressCancel}
                      knownWords={knownWords}
                      ignoredWords={ignoredWords}
                      videoLessonLayout
                      wordToSentenceIndex={wordToSentenceIndex}
                      phraseSelectedWords={phraseHighlightIds}
                      phraseAnchorWordId={phrasePick?.anchorId ?? null}
                    />
                  </div>
                ) : (
                  <div
                    className={`pages-container ${isDragging ? 'pages-container-dragging' : ''}`}
                    style={{
                      width: trackWidthPx > 0 ? trackWidthPx : pageColumnPx,
                      transform: `translate3d(${pageTranslatePx}px, 0, 0)`,
                      transition: isDragging ? 'none' : 'transform 0.32s cubic-bezier(0.25, 0.1, 0.25, 1)',
                    }}
                  >
                    {pages.map((page, index) => (
                      <div key={index} className="page-wrapper" style={{ width: pageColumnPx }}>
                        <PageComponent
                          words={page.words}
                          clickedWords={clickedWords}
                          lingqWords={lingqWords}
                          onWordClick={handleWordClick}
                          onWordLongPress={handleWordLongPress}
                          onWordLongPressCancel={handleWordLongPressCancel}
                          knownWords={knownWords}
                          ignoredWords={ignoredWords}
                          videoLessonLayout={false}
                          wordToSentenceIndex={wordToSentenceIndex}
                          phraseSelectedWords={phraseHighlightIds}
                          phraseAnchorWordId={phrasePick?.anchorId ?? null}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Tablet side panel: inline flex sibling of the lesson text (no overlay). */}
            {isTablet && wordDetailPanelMode && selectedWordId && selectedWordData && (() => {
              const wordId = selectedWordId;
              const word = selectedWordData.word;
              return (
                <div className="reader-panel-slot">
                  <WordDetailBottomSheet
                    key={wordId}
                    wordText={word.text}
                    wordTranslation={word.translation}
                    wordStatus={wordStatusMap[wordId] ?? 'New'}
                    onWordStatusChange={status => handleStatusChange(wordId, status)}
                    onClose={handleClosePopup}
                    isTablet={isTablet}
                    panelMode={true}
                    onTogglePanelMode={() => setWordDetailPanelMode(false)}
                  />
                </div>
              );
            })()}
          </div>
          {isLessonMediaMode && videoBarExpanded && (
            <div className="reader-lesson-fade-bottom" aria-hidden />
          )}
          {isLessonMediaMode && (
            <VideoModeBottomBar
              onChromeHeightChange={setVideoBarChromeHeightPx}
              expanded={videoBarExpanded}
              onExpandedChange={setVideoBarExpanded}
              onExitVideoMode={handleExitLessonMedia}
              onDismiss={handleExitLessonMedia}
              lessonMedia={mediaMode === 'video' ? 'video' : 'audio'}
              exiting={videoBarExitAnimating}
              onExitSlideComplete={handleVideoBarExitSlideComplete}
              lessonTitle={lesson.title}
              lessonSource={lesson.source ?? ''}
              lessonImageSrc={lessonImage}
              isPaused={isPlaybackPaused}
              onTogglePause={handlePlaybackPauseToggle}
              onAudioDetails={() => setAudioSettingsOpen(true)}
            />
          )}
          <AudioSettingsSheet
            open={
              audioSettingsOpen &&
              ((isLessonMediaMode && videoBarExpanded) || showAudioMiniAsBottomBar)
            }
            onClose={() => setAudioSettingsOpen(false)}
            lessonTitle={lesson.title}
            lessonSource={lesson.source ?? ''}
            lessonImageSrc={lessonImage}
            onLessonClick={() => {
              setCourseInfoOpen(true);
              window.setTimeout(() => setAudioSettingsOpen(false), 320);
            }}
            onChromeHeightChange={setAudioSettingsSheetHeightPx}
          />
          <ReviewMode
            open={reviewMode}
            onClose={() => setReviewMode(false)}
            onOpenFilter={handleOpenReviewFilter}
            reviewFilterLabel={reviewFilterLabel}
            onLynxAI={() => setLynxChatOpen(true)}
            onStats={handleOpenStats}
            terms={reviewVisibleTerms}
            wordStatusMap={wordStatusMap}
            untrackedIds={reviewUntrackedIds}
            selectedWordId={selectedWordId}
            onSelect={handleReviewSelect}
            onStatusChange={handleStatusChange}
            onOpenDetail={handleListOpenDetail}
            onAdd={handleReviewAdd}
            onDeselect={handleClosePopup}
            onMarkKnown={(wordId) => handleStatusChange(wordId, 'Known')}
            onMarkIgnored={(wordId) => handleStatusChange(wordId, 'Ignored')}
          />
          <ReviewFilterSheet
            open={reviewFilterOpen}
            onClose={() => setReviewFilterOpen(false)}
            value={reviewFilter}
            onApply={setReviewFilter}
            lessonTitle={lesson.title}
            lessonSource={lesson.source ?? ''}
            lessonImageSrc={lessonImage}
            onLessonClick={() => {
              setCourseInfoOpen(true);
              window.setTimeout(() => setReviewFilterOpen(false), 320);
            }}
          />
          {/* Compact popup → floating card (tablet) or bottom sheet (mobile).
              Not shown in sentence mode — the horizontal word list handles word interaction there. */}
          {selectedWordId && selectedWordData && !reviewMode && !listDetailOpen &&
           !isSentenceView && !(isTablet && wordDetailPanelMode) && (
            <ReaderPopUp
              key={selectedWordId}
              wordId={selectedWordId}
              wordText={selectedWordData.word.text}
              wordTranslation={selectedWordData.word.translation}
              resolveAnchorElement={resolveSelectedWordAnchorElement}
              wordStatus={wordStatusMap[selectedWordId] ?? 'New'}
              onWordStatusChange={status => handleStatusChange(selectedWordId, status)}
              onClose={handleClosePopup}
              onWordDetailSheetOpen={() => setWordDetailSheetOpen(true)}
              isTablet={isTablet}
              panelMode={false}
              onTogglePanelMode={isTablet ? () => setWordDetailPanelMode(true) : undefined}
            />
          )}
          {phraseSelection && !phraseDetailOpen && (
            <PhrasePopUp
              key={phraseSelection.ids.join('-')}
              phraseText={phraseSelection.phraseText}
              meaning={phraseSelection.meaning}
              words={phraseSelection.words}
              valid={phraseSelection.valid}
              getAnchorRect={() => phraseAnchorRectFromIds(phraseSelection.ids)}
              onClose={clearPhraseSelection}
              onExpand={phraseSelection.valid ? () => setPhraseDetailOpen(true) : undefined}
              onWordOpen={handlePhraseWordOpen}
              onGoogleTranslate={() => {}}
            />
          )}
          {phraseDetailOpen && phraseSelection && (() => {
            const phraseKey = phraseSelection.ids.join('-');
            return (
              <WordDetailBottomSheet
                key={phraseKey}
                wordText={phraseSelection.phraseText}
                wordTranslation={phraseSelection.meaning}
                wordStatus={phraseStatusMap[phraseKey] ?? 'New'}
                onWordStatusChange={status =>
                  setPhraseStatusMap(prev => ({ ...prev, [phraseKey]: status }))
                }
                phraseWords={phraseSelection.words}
                onPhraseWordOpen={handlePhraseWordOpen}
                onClose={clearPhraseSelection}
              />
            );
          })()}
          {listDetailOpen && selectedWordId && (() => {
            const word = getWordById(selectedWordId);
            if (!word) return null;
            const wordId = selectedWordId;
            return (
              <WordDetailBottomSheet
                key={wordId}
                wordText={word.text}
                wordTranslation={word.translation}
                wordStatus={wordStatusMap[wordId] ?? 'New'}
                onWordStatusChange={status => handleStatusChange(wordId, status)}
                onClose={handleClosePopup}
                isTablet={isTablet}
                panelMode={isTablet && wordDetailPanelMode}
                onTogglePanelMode={isTablet ? () => setWordDetailPanelMode(prev => !prev) : undefined}
              />
            );
          })()}
          {!isLessonMediaMode && !showAudioMiniAsBottomBar && (
            <ReaderBottomBar
              audioMiniActive={audioMiniPlayerOpen}
              expandedMenuLayout={lesson.expandedMenuLayout ?? 'list'}
              mediaMode={mediaMode}
              isVideoPlaying={audioMiniPlayerOpen && !isPlaybackPaused}
              lessonImageSrc={lessonImage}
              wordDetailSheetOpen={wordDetailSheetOpen || listDetailOpen || phraseDetailOpen || (isTablet && wordDetailPanelMode && selectedWordId != null)}
              selectedWordId={selectedWordId}
              selectedWordStatus={selectedWordId ? (wordStatusMap[selectedWordId] ?? 'New') : undefined}
              onSelectedWordStatusChange={
                selectedWordId
                  ? status => {
                      const wordId = selectedWordId;
                      handleStatusChange(wordId, status);
                      setClickedWords(prev => {
                        const next = new Set(prev);
                        next.delete(wordId);
                        return next;
                      });
                      setSelectedWordId(null);
                    }
                  : undefined
              }
              horizontalListOn={sentenceHorizontalList}
              onHorizontalListChange={setSentenceHorizontalList}
              sentenceModeActive={sentenceMode}
              onSentence={() =>
                setSentenceMode(v => {
                  const next = !v;
                  if (next) setReviewMode(false);
                  return next;
                })
              }
              reviewModeActive={reviewMode}
              onReview={() => {
                setSentenceMode(false);
                setReviewMode(true);
              }}
              onPlay={handleDefaultPlay}
              onToggleVideoPlayback={handlePlaybackPauseToggle}
              onExpandVideoBar={() => {
                if (lesson.hasVideo !== true && audioMiniPlayerOpen) {
                  handleExpandFromAudioMini();
                } else {
                  setVideoBarExpanded(true);
                }
              }}
              hasVideo={lesson.hasVideo === true}
              onVideoMode={handleEnterVideoModeFromChrome}
              onLynxAI={() => setLynxChatOpen(true)}
              onExit={() => {}}
              menuHeaderTitle={lesson.lessonMenuTitle ?? lesson.title}
              menuHeaderSubtitle={lesson.lessonMenuSubtitle}
              lessonTitle={lesson.title}
              lessonSource={lesson.source}
              onShowTranslation={() => {}}
              onMenuPreviousLesson={() => {}}
              onMenuNextLesson={() => {}}
            />
          )}
          {showAudioMiniAsBottomBar && (
            <AudioMiniPlayer
              lessonTitle={lesson.title}
              lessonSource={lesson.source ?? ''}
              lessonImageSrc={lessonImage}
              isPaused={isPlaybackPaused}
              isExiting={audioMiniExitAnimating}
              onTogglePause={handlePlaybackPauseToggle}
              onExpand={handleExpandFromAudioMini}
              onMenu={() => setAudioSettingsOpen(true)}
              onDismiss={handleDismissAudioMini}
              onExitAnimationComplete={handleAudioMiniExitAnimationComplete}
              playbackProgress={0.08}
            />
          )}
        </>
      )}
      <ExitLessonPopup open={exitPopupOpen} onClose={() => setExitPopupOpen(false)} />
      <CourseInfoSheet
        open={courseInfoOpen}
        onClose={() => setCourseInfoOpen(false)}
        courseTitle={lesson.source ?? lesson.title}
        heroImageSrc={lessonImage}
        lessonImageSrc={lessonImage}
        lessonCourse={lesson.source ?? ''}
        lessonTitle={lesson.title}
      />
      <LynxChatMode
        open={lynxChatOpen}
        onClose={() => setLynxChatOpen(false)}
        onStats={handleOpenStats}
      />
      {snackbar && (
        <StatusSnackbar
          key={snackbar.key}
          status={snackbar.status}
          bottomOffsetPx={
            isLessonMediaMode
              ? effectiveLessonBottomChromePx + 16
              : sentenceHorizontalList
              ? 150
              : undefined
          }
          onUndo={() => {
            setWordStatusMap(prev => ({ ...prev, [snackbar.wordId]: snackbar.previousStatus }));
            setSnackbar(null);
          }}
          onDismiss={() => setSnackbar(null)}
        />
      )}
      {longPressWordId && (
        <QuickStatusPopup
          key={longPressWordId}
          resolveAnchorElement={resolveLongPressAnchorElement}
          variant={lingqWords.has(longPressWordId) ? 'full' : 'quick'}
          currentStatus={wordStatusMap[longPressWordId] ?? 'New'}
          onStatusChange={(status) => {
            handleStatusChange(longPressWordId, status);
            setLongPressWordId(null);
            /* Close the meaning popup too, so drag-select matches tap-select (whose outside
               pointerdown on the menu would otherwise be what dismisses the popup). */
            handleClosePopup();
          }}
          onSelectPhrase={handleStartPhrasePick}
          onClose={() => setLongPressWordId(null)}
        />
      )}
      {phrasePick && <PhrasePickTooltip />}
    </div>
  );
};
