import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { lesson } from '../data/lesson';
import type { Word } from '../data/lesson';
import { Page as PageComponent } from './Page';
import type { LingQStatusType } from './LingQStatusBar';
import { ReaderPopUp } from './ReaderPopUp';
import { ReaderBottomBar } from './ReaderBottomBar';
import { VideoModeBottomBar } from './VideoModeBottomBar';
import { VideoModeVideoPlayer } from './VideoModeVideoPlayer';
import videoModeThumbnail from '../assets/video-mode-thumbnail.png';
import lessonImage from '../assets/lesson-image.png';
import { startViewTransition, supportsViewTransition } from '../utils/viewTransition';
import './Reader.css';

const DRAG_THRESHOLD_PX = 10;
const SWIPE_THRESHOLD_RATIO = 0.15;

interface Page {
  words: Word[];
}

export const Reader: React.FC = () => {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [pages, setPages] = useState<Page[]>([]);
  const [clickedWords, setClickedWords] = useState<Set<string>>(new Set());
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
  const [wordStatusMap, setWordStatusMap] = useState<Record<string, LingQStatusType>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef<number>(0);
  const dragOffsetPx = useRef<number>(0);
  const ignoreNextWordClick = useRef(false);
  /** Skip ResizeObserver pagination while swiping — avoids remounting pages mid-gesture (white flash). */
  const isPageSwipeDraggingRef = useRef(false);
  /** Block pagination recalculation briefly after a page change (resize often fires during transform; recalc remounts rows → flash). */
  const paginationCooldownUntilRef = useRef(0);
  const resizePaginateDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipPaginationCooldownOnMountRef = useRef(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [contentWidthPx, setContentWidthPx] = useState(1);
  const [mediaMode, setMediaMode] = useState<'none' | 'video'>('none');
  const [videoBarExpanded, setVideoBarExpanded] = useState(false);
  const [isPlaybackPaused, setIsPlaybackPaused] = useState(false);
  const prevMediaModeRef = useRef<'none' | 'video'>(mediaMode);
  /** Measured height of fixed VideoModeBottomBar — positions LingQ strip above it. */
  const [videoBarChromeHeightPx, setVideoBarChromeHeightPx] = useState(0);
  /** Measured height of fixed top video slot — offsets scrollable lesson text. */
  const [videoTopSlotHeightPx, setVideoTopSlotHeightPx] = useState(0);
  /** No View Transitions: slide audio bar out before leaving video mode. */
  const [videoBarExitAnimating, setVideoBarExitAnimating] = useState(false);

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

  const calculatePages = useCallback(() => {
    if (!containerRef.current) return;

    const readerEl = containerRef.current;
    const contentEl = contentRef.current;
    const containerWidth = (contentEl ?? readerEl).clientWidth;
    const PAGE_CONTENT_VERTICAL_PADDING = 16; /* matches Page.css 8px + 8px */
    const readerContentPaddingBottomPage = 80; /* matches .reader-content padding-bottom (page mode) */

    let availableHeight: number;
    if (contentEl) {
      /* Measure the real column: .reader clientHeight mixes in full viewport; content box matches the page stack. */
      availableHeight =
        contentEl.clientHeight - readerContentPaddingBottomPage - PAGE_CONTENT_VERTICAL_PADDING;
    } else {
      /* Loading shell: .reader-content not mounted yet — approximate with legacy reserves */
      const titleHeight = 80;
      const topReserved = 40;
      const bottomReserved = 80;
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

    /* Video mode: full lesson in one column; vertical scroll — no horizontal pagination. */
    if (mediaMode === 'video') {
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
    tempContainer.style.paddingTop = '8px';
    tempContainer.style.paddingBottom = '8px';
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

  const handleWordClick = useCallback(
    (wordId: string) => {
      if (ignoreNextWordClick.current) {
        ignoreNextWordClick.current = false;
        return;
      }
      if (knownWords.has(wordId) || ignoredWords.has(wordId)) {
        return;
      }
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
    [selectedWordId, knownWords, ignoredWords]
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

  useEffect(() => {
    setWordDetailSheetOpen(false);
  }, [selectedWordId]);

  const handleClosePopup = useCallback(() => {
    setWordDetailSheetOpen(false);
    if (selectedWordId) {
      setClickedWords(prev => {
        const newSet = new Set(prev);
        newSet.delete(selectedWordId);
        return newSet;
      });
    }
    setSelectedWordId(null);
  }, [selectedWordId]);

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

  const [hoveredPageIndex, setHoveredPageIndex] = React.useState<number | null>(null);

  const handleProgressBarClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      const pageIndex = Math.min(Math.max(0, Math.floor(percentage * pages.length)), pages.length - 1);
      setCurrentPageIndex(pageIndex);
    },
    [pages.length]
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

  const pageColumnPx = Math.max(1, contentWidthPx);
  const trackWidthPx = pages.length * pageColumnPx;
  /** Pixel translate: one column = pageColumnPx; dragOffset is pointer delta in px (same as measure). */
  const pageTranslatePx =
    pages.length === 0 ? 0 : -currentPageIndex * pageColumnPx + dragOffset;

  const fillProgress = pages.length > 0 ? Math.min(100, ((currentPageIndex + 1) / pages.length) * 100) : 0;
  const thumbProgress = fillProgress;

  const isPageMode = mediaMode === 'none';
  const isVideoModeOpen = mediaMode === 'video';
  const contentClassName = [
    'reader-content',
    isVideoModeOpen && 'reader-content--video-mode',
    isVideoModeOpen && videoBarExpanded && 'reader-content--video-expanded',
  ]
    .filter(Boolean)
    .join(' ');

  const videoChromeFallbackPx = 132;
  const effectiveVideoChromePx =
    videoBarChromeHeightPx > 0 ? videoBarChromeHeightPx : videoChromeFallbackPx;
  /** Fallback until ResizeObserver measures the video chrome (safe area + card + video). */
  const videoTopStackFallbackPx = 236;

  const readerContentVideoStyle: React.CSSProperties | undefined = isVideoModeOpen
    ? {
        paddingBottom: `${effectiveVideoChromePx}px`,
        paddingTop:
          videoTopSlotHeightPx > 0
            ? `${videoTopSlotHeightPx}px`
            : `${videoTopStackFallbackPx}px`,
      }
    : undefined;

  const lingqStripAnchorAboveVideoBarPx =
    isVideoModeOpen && selectedWordId != null ? effectiveVideoChromePx : undefined;

  /** Top of video bar from viewport bottom — drives fixed text fade (LingQ strip overlays text, not included) */
  const readerRootStyle: React.CSSProperties | undefined = isVideoModeOpen
    ? ({
        '--reader-video-chrome-stack': `${effectiveVideoChromePx}px`,
        '--reader-video-top-stack': `${videoTopSlotHeightPx > 0 ? videoTopSlotHeightPx : videoTopStackFallbackPx}px`,
      } as React.CSSProperties)
    : undefined;

  useEffect(() => {
    if (mediaMode !== 'video') {
      setVideoBarExpanded(false);
      setIsPlaybackPaused(false);
      setVideoBarChromeHeightPx(0);
      setVideoTopSlotHeightPx(0);
    }
  }, [mediaMode]);

  /** Leaving video mode: restore default pagination layout and scroll position. */
  useEffect(() => {
    if (prevMediaModeRef.current === 'video' && mediaMode === 'none') {
      setCurrentPageIndex(0);
      const el = contentRef.current;
      if (el) el.scrollTop = 0;
    }
    prevMediaModeRef.current = mediaMode;
  }, [mediaMode]);

  /** Pause / resume playback while staying in video mode (ReaderBottomBar mini controls when word selected). */
  const handlePlaybackPauseToggle = useCallback(() => {
    setIsPlaybackPaused(p => !p);
  }, []);

  /** Enter video mode from the default bottom bar play control. */
  const handleEnterVideoMode = useCallback(() => {
    startViewTransition(() => {
      setMediaMode('video');
      setIsPlaybackPaused(false);
      setVideoBarExpanded(false);
    });
  }, []);

  const handleVideoBarExitSlideComplete = useCallback(() => {
    setMediaMode('none');
    setVideoBarExitAnimating(false);
  }, []);

  const handleExitVideoMode = useCallback(() => {
    if (supportsViewTransition()) {
      startViewTransition(() => setMediaMode('none'));
      return;
    }
    setVideoBarExitAnimating(true);
  }, []);

  /** Exit video mode (Escape matches sheet-dismiss habit). */
  useEffect(() => {
    if (mediaMode !== 'video') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleExitVideoMode();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mediaMode, handleExitVideoMode]);

  useEffect(() => {
    if (mediaMode !== 'video') return;
    const el = contentRef.current;
    if (el) el.scrollTop = 0;
  }, [mediaMode]);

  return (
    <div
      className={[
        'reader',
        isVideoModeOpen && 'reader--video-mode',
        isVideoModeOpen && videoBarExpanded && 'reader--video-mode-expanded',
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
          {isVideoModeOpen && (
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
          {isVideoModeOpen && <div className="reader-video-text-fade--top" aria-hidden />}
          {isVideoModeOpen && <div className="reader-video-text-fade" aria-hidden />}
          {isPageMode && (
            <div className="reader-progress-container">
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
          )}
          <div
            className={contentClassName}
            style={readerContentVideoStyle}
            ref={contentRef}
            onPointerDown={isPageMode ? handlePointerDown : undefined}
            onPointerMove={isPageMode ? handlePointerMove : undefined}
            onPointerUp={isPageMode ? e => handlePointerUp(e) : undefined}
            onPointerLeave={isPageMode ? () => handlePointerUp() : undefined}
            onPointerCancel={isPageMode ? handlePointerCancel : undefined}
          >
            <div className="reader-body-vt">
              {isVideoModeOpen ? (
                <div className="reader-video-scroll">
                  <PageComponent
                    words={allWords}
                    clickedWords={clickedWords}
                    lingqWords={lingqWords}
                    onWordClick={handleWordClick}
                    knownWords={knownWords}
                    ignoredWords={ignoredWords}
                    videoLessonLayout
                    wordToSentenceIndex={wordToSentenceIndex}
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
                        knownWords={knownWords}
                        ignoredWords={ignoredWords}
                        videoLessonLayout={false}
                        wordToSentenceIndex={wordToSentenceIndex}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {isVideoModeOpen && (
            <VideoModeBottomBar
              onChromeHeightChange={setVideoBarChromeHeightPx}
              expanded={videoBarExpanded}
              onExpandedChange={setVideoBarExpanded}
              onExitVideoMode={handleExitVideoMode}
              exiting={videoBarExitAnimating}
              onExitSlideComplete={handleVideoBarExitSlideComplete}
              lessonTitle={lesson.title}
              lessonSource={lesson.source ?? ''}
              lessonImageSrc={lessonImage}
              isPaused={isPlaybackPaused}
              onTogglePause={handlePlaybackPauseToggle}
            />
          )}
          {selectedWordId && selectedWordData && (
            <ReaderPopUp
              key={selectedWordId}
              wordId={selectedWordId}
              wordText={selectedWordData.word.text}
              wordTranslation={selectedWordData.word.translation}
              resolveAnchorElement={resolveSelectedWordAnchorElement}
              wordStatus={wordStatusMap[selectedWordId] ?? 'New'}
              onWordStatusChange={status =>
                setWordStatusMap(prev => ({ ...prev, [selectedWordId]: status }))
              }
              onClose={handleClosePopup}
              onWordDetailSheetOpen={() => setWordDetailSheetOpen(true)}
            />
          )}
          {(mediaMode !== 'video' || selectedWordId != null) && (
            <ReaderBottomBar
              mediaMode={mediaMode}
              isVideoPlaying={mediaMode === 'video' && !isPlaybackPaused}
              anchorAboveVideoBarPx={lingqStripAnchorAboveVideoBarPx}
              lessonImageSrc={lessonImage}
              wordDetailSheetOpen={wordDetailSheetOpen}
              selectedWordId={selectedWordId}
              selectedWordStatus={selectedWordId ? (wordStatusMap[selectedWordId] ?? 'New') : undefined}
              onSelectedWordStatusChange={
                selectedWordId
                  ? status => setWordStatusMap(prev => ({ ...prev, [selectedWordId]: status }))
                  : undefined
              }
              onPlay={handleEnterVideoMode}
              onToggleVideoPlayback={handlePlaybackPauseToggle}
              onExpandVideoBar={() => {
                setVideoBarExpanded(true);
              }}
              hasVideo={false}
              onVideoMode={handleEnterVideoMode}
              onExit={() => {}}
            />
          )}
        </>
      )}
    </div>
  );
};
