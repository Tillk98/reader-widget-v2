import React, { useState, useEffect, useRef, useCallback } from 'react';
import { lesson } from '../data/lesson';
import type { Word } from '../data/lesson';
import { Page as PageComponent } from './Page';
import type { LingQStatusType } from './LingQStatusBar';
import { ReaderPopUp } from './ReaderPopUp';
import { ReaderBottomBar } from './ReaderBottomBar';
import { MediaModeLessonContent } from './MediaModeLessonContent';
import { DrawerVideoPlayer } from './DrawerVideoPlayer';
import videoThumbnail from '../assets/video-thumbnail.png';
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
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [mediaMode, setMediaMode] = useState<'none' | 'audio' | 'video'>('none');
  const [mediaPlayerExpanded, setMediaPlayerExpanded] = useState(false);

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

  const calculatePages = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    if (containerWidth === 0 || containerHeight === 0) {
      if (allWords.length > 0) {
        setPages([{ words: allWords }]);
      }
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
    tempContainer.style.paddingLeft = '1px';
    tempContainer.style.paddingRight = '1px';
    tempContainer.style.boxSizing = 'border-box';
    tempContainer.style.fontFamily = 'Lora, serif';
    tempContainer.style.fontSize = '18px';
    tempContainer.style.lineHeight = '37.8px';
    tempContainer.style.whiteSpace = 'normal';
    tempContainer.style.wordWrap = 'break-word';
    tempContainer.style.overflow = 'visible';
    document.body.appendChild(tempContainer);

    const newPages: Page[] = [];
    let currentPage: Word[] = [];
    const pagePadding = 16;
    const titleHeight = 80;
    const topReserved = 40;
    const bottomReserved = 80;
    const availableHeight = containerHeight - topReserved - bottomReserved - pagePadding - titleHeight;

    for (let i = 0; i < allWords.length; i++) {
      const word = allWords[i];

      const wordSpan = document.createElement('span');
      wordSpan.textContent = word.text;
      wordSpan.style.display = 'inline-block';
      wordSpan.style.padding = '2px 1px';
      wordSpan.style.fontFamily = 'Lora, serif';
      wordSpan.style.fontSize = '18px';
      wordSpan.style.lineHeight = '37.8px';
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
        newWordSpan.style.display = 'inline-block';
        newWordSpan.style.padding = '2px 1px';
        newWordSpan.style.fontFamily = 'Lora, serif';
        newWordSpan.style.fontSize = '18px';
        newWordSpan.style.lineHeight = '37.8px';
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
  }, [allWords]);

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      calculatePages();
    });

    resizeObserver.observe(containerRef.current);

    const handleResize = () => {
      calculatePages();
    };

    window.addEventListener('resize', handleResize);

    calculatePages();

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [calculatePages]);

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

  const handleClosePopup = useCallback(() => {
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
    const anchorRect = wordEl?.getBoundingClientRect();
    if (!anchorRect) return null;

    return { word, anchorRect };
  }, [selectedWordId, getWordById, getWordElement]);

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

  const contentWidth = contentRef.current?.clientWidth ?? 1;
  const dragOffsetPercent = contentWidth > 0 ? (dragOffset / contentWidth) * 100 : 0;
  const pageTransform = -currentPageIndex * 100 + dragOffsetPercent;

  const fillProgress = pages.length > 0 ? Math.min(100, ((currentPageIndex + 1) / pages.length) * 100) : 0;
  const thumbProgress = fillProgress;

  const inMediaMode = mediaMode !== 'none';
  const contentClassName = [
    'reader-content',
    inMediaMode ? 'reader-content--media' : '',
    inMediaMode && (mediaPlayerExpanded ? 'reader-content--media-expanded' : 'reader-content--media-collapsed'),
  ]
    .filter(Boolean)
    .join(' ');

  const handleMediaClose = useCallback(() => {
    setMediaMode('none');
    setMediaPlayerExpanded(false);
  }, []);

  return (
    <div className="reader" ref={containerRef}>
      {pages.length === 0 ? (
        <div className="reader-loading">Loading...</div>
      ) : (
        <>
          {!inMediaMode && (
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
            ref={contentRef}
            onPointerDown={!inMediaMode ? handlePointerDown : undefined}
            onPointerMove={!inMediaMode ? handlePointerMove : undefined}
            onPointerUp={!inMediaMode ? e => handlePointerUp(e) : undefined}
            onPointerLeave={!inMediaMode ? () => handlePointerUp() : undefined}
            onPointerCancel={!inMediaMode ? handlePointerCancel : undefined}
          >
            {!inMediaMode ? (
              <div
                className={`pages-container ${isDragging ? 'pages-container-dragging' : ''}`}
                style={{
                  transform: `translateX(${pageTransform}%)`,
                  transition: isDragging ? 'none' : 'transform 0.3s ease-in-out',
                }}
              >
                {pages.map((page, index) => (
                  <div key={index} className="page-wrapper">
                    <PageComponent
                      words={page.words}
                      clickedWords={clickedWords}
                      lingqWords={lingqWords}
                      onWordClick={handleWordClick}
                      knownWords={knownWords}
                      ignoredWords={ignoredWords}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <>
                {mediaMode === 'video' && (
                  <div className="reader-media-video-wrap">
                    <DrawerVideoPlayer videoUrl={lesson.videoUrl} posterUrl={videoThumbnail} />
                  </div>
                )}
                <div className="reader-media-lesson-scroll">
                  <MediaModeLessonContent
                    sentences={lesson.sentences}
                    clickedWords={clickedWords}
                    lingqWords={lingqWords}
                    knownWords={knownWords}
                    ignoredWords={ignoredWords}
                    onWordClick={handleWordClick}
                  />
                </div>
              </>
            )}
          </div>
          {selectedWordId && selectedWordData && (
            <ReaderPopUp
              key={selectedWordId}
              wordId={selectedWordId}
              wordText={selectedWordData.word.text}
              wordTranslation={selectedWordData.word.translation}
              anchorRect={selectedWordData.anchorRect}
              wordStatus={wordStatusMap[selectedWordId] ?? 'New'}
              onWordStatusChange={status =>
                setWordStatusMap(prev => ({ ...prev, [selectedWordId]: status }))
              }
              onClose={handleClosePopup}
            />
          )}
          <ReaderBottomBar
            mediaMode={mediaMode}
            mediaPlayerExpanded={mediaPlayerExpanded}
            onMediaPlayerExpand={() => setMediaPlayerExpanded(true)}
            onMediaPlayerCollapse={() => setMediaPlayerExpanded(false)}
            onMediaClose={handleMediaClose}
            selectedWordId={selectedWordId}
            selectedWordStatus={selectedWordId ? (wordStatusMap[selectedWordId] ?? 'New') : undefined}
            onSelectedWordStatusChange={
              selectedWordId
                ? status => setWordStatusMap(prev => ({ ...prev, [selectedWordId]: status }))
                : undefined
            }
            onPlay={() => {
              setMediaMode('audio');
              setMediaPlayerExpanded(false);
            }}
            hasVideo={lesson.hasVideo ?? false}
            onVideoMode={() => {
              setMediaMode('video');
              setMediaPlayerExpanded(false);
            }}
            lessonTitle={lesson.title}
            lessonSource={lesson.source ?? ''}
          />
        </>
      )}
    </div>
  );
};
