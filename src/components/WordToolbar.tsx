import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  BookA,
  Check,
  ChevronRight,
  Copy,
  EyeOff,
  LetterText,
  MessageSquare,
  NotebookPen,
  Plus,
  RefreshCw,
  CircleCheck,
  X,
} from 'lucide-react';
import lynxIconGrey from '../assets/lynx-icon-grey.png';
import './WordToolbar.css';

interface WordToolbarProps {
  wordId: string;
  wordText: string;
  wordTranslation?: string;
  wordElement: HTMLElement | null;
  anchorRect?: DOMRect;
  invalidSelectionText?: string;
  wordLevel: number;
  onSetWordLevel: (wordId: string, level: number) => void;
  onClose: () => void;
  onMarkAsKnown: (wordId: string) => void;
  onIgnore: (wordId: string) => void;
  onOpenAIChat: (wordText: string) => void;
  onInspectSentence: (wordId: string) => void;
}

export const WordToolbar: React.FC<WordToolbarProps> = ({
  wordId,
  wordText,
  wordTranslation,
  wordElement,
  anchorRect,
  invalidSelectionText,
  wordLevel,
  onClose,
  onMarkAsKnown,
  onIgnore,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [popupPosition, setPopupPosition] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    maxHeight?: number;
  }>({
    top: 0,
    left: 0,
  });
  const [toolbarPosition, setToolbarPosition] = useState<{
    top?: number;
    bottom?: number;
    left: number;
  } | null>(null);
  const [panelPosition, setPanelPosition] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    maxHeight?: number;
  } | null>(null);
  const [hoverBridgePositions, setHoverBridgePositions] = useState<
    Array<{
      top: number;
      left: number;
      width: number;
      height: number;
    }>
  >([]);
  const [panelWidth, setPanelWidth] = useState<number | null>(null);
  const [placement, setPlacement] = useState<'above' | 'below'>('above');
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'meaning' | 'status' | 'sentence' | 'notes' | 'explain'>(
    'meaning'
  );
  const [meaningQuery, setMeaningQuery] = useState('');
  const [addedMeaning, setAddedMeaning] = useState<string | null>(null);
  const [isMeaningFlash, setIsMeaningFlash] = useState(false);
  const translation = wordTranslation || wordText;
  const [selectedMeaning, setSelectedMeaning] = useState(translation);
  const [explainStatus, setExplainStatus] = useState<'idle' | 'loading' | 'streaming' | 'done'>(
    'idle'
  );
  const [explainText, setExplainText] = useState('');
  const previousMeaningRef = useRef<string | null>(null);
  const flashTimeoutRef = useRef<number | null>(null);
  const explainTimeoutRef = useRef<number | null>(null);
  const explainIntervalRef = useRef<number | null>(null);
  const selectedMeaningRef = useRef<HTMLSpanElement>(null);
  const headerMeaningRef = useRef<HTMLSpanElement>(null);
  const [isHeaderMeaningTruncated, setIsHeaderMeaningTruncated] = useState(false);
  const [canShowMeaningTooltip, setCanShowMeaningTooltip] = useState(false);
  const [isMeaningHovered, setIsMeaningHovered] = useState(false);
  const [isSelectedMeaningWrapped, setIsSelectedMeaningWrapped] = useState(false);
  const showActions = isExpanded || isHovered;
  const [meaningOptions, setMeaningOptions] = useState([
    { text: 'monetize', count: '2.5k' },
    { text: 'make money off of', count: '2.5k' },
    { text: 'to profit from', count: '1.5k' },
    { text: 'monetization', count: '1.5k' },
    { text: 'generate revenue', count: '980' },
    { text: 'profitize', count: '420' },
  ]);
  const addMeaningTimeoutRef = useRef<number | null>(null);
  const normalizedQuery = meaningQuery.trim().toLowerCase();
  const filteredMeanings = meaningOptions.filter(option =>
    option.text.toLowerCase().includes(normalizedQuery)
  );
  const sortedMeanings = [...filteredMeanings];
  const selectedIndex = sortedMeanings.findIndex(option => option.text === selectedMeaning);
  if (selectedIndex === -1 && selectedMeaning.trim()) {
    sortedMeanings.unshift({ text: selectedMeaning, count: '' });
  } else if (selectedIndex > 0) {
    sortedMeanings.unshift(...sortedMeanings.splice(selectedIndex, 1));
  }
  const canAddMeaning =
    normalizedQuery.length > 0 &&
    !meaningOptions.some(option => option.text.toLowerCase() === normalizedQuery);
  const totalMeaningItems = filteredMeanings.length + (canAddMeaning ? 1 : 0);
  const showMeaningFade = totalMeaningItems > 3;
  const dictionaries = [
    { id: 'deepl', name: 'Deepl Translator', icon: 'english-flag.png' },
    { id: 'glosbe', name: 'Glosbe', icon: 'english-flag.png' },
    { id: 'conjugueur', name: 'Le Conjugueur', icon: 'english-flag.png' },
  ];
  const explainChunks = [
    'monetisons — "we monetize" (turn into money)\n',
    "YouTubers monetize videos by enabling ads. Here, they're saying not all videos have ads, ",
    'so engagement (likes/shares) helps them earn in other ways.',
  ];

  useEffect(() => {
    setSelectedMeaning(translation);
  }, [translation, wordId]);

  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current !== null) {
        window.clearTimeout(flashTimeoutRef.current);
      }
      if (addMeaningTimeoutRef.current !== null) {
        window.clearTimeout(addMeaningTimeoutRef.current);
      }
      if (explainTimeoutRef.current !== null) {
        window.clearTimeout(explainTimeoutRef.current);
      }
      if (explainIntervalRef.current !== null) {
        window.clearInterval(explainIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (previousMeaningRef.current && previousMeaningRef.current !== selectedMeaning) {
      setIsMeaningFlash(true);
      if (flashTimeoutRef.current !== null) {
        window.clearTimeout(flashTimeoutRef.current);
      }
      flashTimeoutRef.current = window.setTimeout(() => {
        setIsMeaningFlash(false);
      }, 900);
    }
    previousMeaningRef.current = selectedMeaning;
  }, [selectedMeaning]);


  useEffect(() => {
    if (!(isExpanded && activeTab === 'explain')) {
      if (explainTimeoutRef.current !== null) {
        window.clearTimeout(explainTimeoutRef.current);
      }
      if (explainIntervalRef.current !== null) {
        window.clearInterval(explainIntervalRef.current);
      }
      setExplainStatus('idle');
      setExplainText('');
      return;
    }

    setExplainStatus('loading');
    setExplainText('');
    if (explainTimeoutRef.current !== null) {
      window.clearTimeout(explainTimeoutRef.current);
    }
    if (explainIntervalRef.current !== null) {
      window.clearInterval(explainIntervalRef.current);
    }

    explainTimeoutRef.current = window.setTimeout(() => {
      let chunkIndex = 0;
      setExplainStatus('streaming');
      explainIntervalRef.current = window.setInterval(() => {
        if (chunkIndex >= explainChunks.length) {
          if (explainIntervalRef.current !== null) {
            window.clearInterval(explainIntervalRef.current);
          }
          setExplainStatus('done');
          return;
        }
        setExplainText(prev => prev + explainChunks[chunkIndex]);
        chunkIndex += 1;
      }, 600);
    }, 3000);
  }, [activeTab, isExpanded, selectedMeaning]);

  useLayoutEffect(() => {
    if (!(isExpanded && activeTab === 'meaning')) {
      setIsSelectedMeaningWrapped(false);
      return;
    }

    const measure = () => {
      if (!selectedMeaningRef.current) return;
      const { scrollHeight, clientHeight } = selectedMeaningRef.current;
      setIsSelectedMeaningWrapped(scrollHeight > clientHeight + 1);
    };

    const frame = window.requestAnimationFrame(measure);
    window.addEventListener('resize', measure);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', measure);
    };
  }, [activeTab, isExpanded, selectedMeaning, sortedMeanings.length]);

  useLayoutEffect(() => {
    const measure = () => {
      if (!headerMeaningRef.current) return;
      const { scrollWidth, clientWidth } = headerMeaningRef.current;
      setIsHeaderMeaningTruncated(scrollWidth > clientWidth + 1);
    };

    const frame = window.requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', measure);
    };
  }, [selectedMeaning, isExpanded, isHovered]);

  useEffect(() => {
    if (isExpanded) {
      setCanShowMeaningTooltip(false);
    }
  }, [isExpanded, selectedMeaning]);

  const handleExpand = (
    tab: 'meaning' | 'status' | 'sentence' | 'notes' | 'explain'
  ) => {
    setActiveTab(tab);
    setIsExpanded(true);
  };

  useEffect(() => {
    const updatePosition = () => {
      const element = wordElement || document.getElementById(wordId);
      if (!element || !popupRef.current) return;

      const rect = anchorRect ?? element.getBoundingClientRect();
      const maxToolbarWidth = 340;
      const popupHeight = popupRef.current.offsetHeight || 0;
      const popupWidth = Math.min(popupRef.current.offsetWidth || 0, maxToolbarWidth);
      const toolbarHeight = toolbarRef.current?.offsetHeight || 0;
      const toolbarWidth = Math.min(toolbarRef.current?.offsetWidth || 0, maxToolbarWidth);
      const panelHeight = panelRef.current?.offsetHeight || 0;
      const measuredPanelWidth = Math.min(
        panelRef.current?.offsetWidth || popupWidth,
        maxToolbarWidth
      );
      const gapWord = 6;
      const gapToolbar = 8;
      const gapPanel = 8;
      const edge = 8;

      const spaceAbove = rect.top - gapWord - edge;
      const spaceBelow = window.innerHeight - rect.bottom - gapWord - edge;
      const contentHeight =
        popupHeight +
        (showActions
          ? isExpanded
            ? gapPanel + panelHeight + gapPanel + toolbarHeight
            : gapToolbar + toolbarHeight
          : 0);
      const fitsAbove = spaceAbove >= contentHeight;
      const fitsBelow = spaceBelow >= contentHeight;
      let nextPlacement: 'above' | 'below';

      if (fitsAbove && fitsBelow) {
        nextPlacement = spaceAbove >= spaceBelow ? 'above' : 'below';
      } else if (fitsAbove) {
        nextPlacement = 'above';
      } else if (fitsBelow) {
        nextPlacement = 'below';
      } else {
        nextPlacement = spaceAbove >= spaceBelow ? 'above' : 'below';
      }

      let left = rect.left;
      const maxLeft = Math.max(edge, window.innerWidth - maxToolbarWidth - edge);
      left = Math.min(Math.max(left, edge), maxLeft);

      if (nextPlacement === 'below') {
        const top = rect.bottom + gapWord;
        setPopupPosition({ top, bottom: undefined, left, maxHeight: Math.max(0, spaceBelow) });
      } else {
        const maxHeight = Math.max(0, spaceAbove);
        const bottom = window.innerHeight - rect.top + gapWord;
        setPopupPosition({ top: undefined, bottom, left, maxHeight });
      }
      setPlacement(nextPlacement);

      if (!showActions) {
        setToolbarPosition(null);
        setPanelPosition(null);
        setPanelWidth(null);
        setHoverBridgePositions([]);
        return;
      }

      const maxStackWidth = Math.max(popupWidth, measuredPanelWidth, toolbarWidth);
      const panelMaxLeft = Math.max(edge, window.innerWidth - maxStackWidth - edge);
      const panelLeft = Math.min(Math.max(left, edge), panelMaxLeft);
      const bridgeWidth = Math.min(maxStackWidth, window.innerWidth - edge * 2);
      const bridgeLeft = Math.min(Math.max(left, edge), window.innerWidth - bridgeWidth - edge);
      const bridges: Array<{ top: number; left: number; width: number; height: number }> = [];

      if (nextPlacement === 'below') {
        const popupTop = rect.bottom + gapWord;
        const popupBottom = popupTop + popupHeight;
        if (isExpanded) {
          const toolbarTop = popupBottom + gapToolbar;
          const panelTop = toolbarTop + toolbarHeight + gapPanel;
          const panelBottom = panelTop + panelHeight;
          const panelSpaceBelow = window.innerHeight - panelTop - edge;
          setToolbarPosition({ top: toolbarTop, bottom: undefined, left });
          setPanelPosition({
            top: panelTop,
            bottom: undefined,
            left: panelLeft,
            maxHeight: Math.max(0, panelSpaceBelow),
          });
          setPanelWidth(measuredPanelWidth);
          bridges.push({
            top: popupBottom,
            left: bridgeLeft,
            width: bridgeWidth,
            height: gapToolbar,
          });
          bridges.push({
            top: toolbarTop + toolbarHeight,
            left: bridgeLeft,
            width: bridgeWidth,
            height: gapPanel,
          });
        } else {
          setPanelPosition(null);
          setPanelWidth(null);
          const toolbarTop = popupTop + popupHeight + gapToolbar;
          setToolbarPosition({ top: toolbarTop, bottom: undefined, left });
          bridges.push({
            top: popupBottom,
            left: bridgeLeft,
            width: bridgeWidth,
            height: gapToolbar,
          });
        }
      } else {
        const popupBottom = rect.top - gapWord;
        const popupTop = popupBottom - popupHeight;
        if (isExpanded) {
          const toolbarBottom = popupTop - gapToolbar;
          const panelBottom = toolbarBottom - gapPanel;
          const panelTop = panelBottom - panelHeight;
          const panelSpaceAbove = popupTop - gapToolbar - gapPanel - edge;
          setToolbarPosition({
            top: undefined,
            bottom: window.innerHeight - toolbarBottom,
            left,
          });
          setPanelPosition({
            top: panelTop,
            bottom: undefined,
            left: panelLeft,
            maxHeight: Math.max(0, panelSpaceAbove),
          });
          setPanelWidth(measuredPanelWidth);
          bridges.push({
            top: toolbarBottom,
            left: bridgeLeft,
            width: bridgeWidth,
            height: gapToolbar,
          });
          bridges.push({
            top: panelBottom,
            left: bridgeLeft,
            width: bridgeWidth,
            height: gapPanel,
          });
        } else {
          setPanelPosition(null);
          setPanelWidth(null);
          const toolbarBottom = popupTop - gapToolbar;
          setToolbarPosition({
            top: undefined,
            bottom: window.innerHeight - toolbarBottom,
            left,
          });
          bridges.push({
            top: toolbarBottom,
            left: bridgeLeft,
            width: bridgeWidth,
            height: gapToolbar,
          });
        }
      }
      setHoverBridgePositions(bridges);
    };

    const raf = requestAnimationFrame(updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [
    wordElement,
    wordId,
    anchorRect,
    translation,
    invalidSelectionText,
    isExpanded,
    isHovered,
    activeTab,
    selectedMeaning,
    sortedMeanings.length,
  ]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        !(toolbarRef.current && toolbarRef.current.contains(event.target as Node)) &&
        !(panelRef.current && panelRef.current.contains(event.target as Node)) &&
        wordElement &&
        !wordElement.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose, wordElement]);

  const statusLabels: Record<number, string> = {
    1: 'New',
    2: 'Recognized',
    3: 'Familiar',
    4: 'Learned',
  };

  const statusToolbar = (
    <div className="meaning-popup-actions-inner meaning-popup-status-toolbar">
      {[1, 2, 3, 4].map(level => (
        <button
          key={level}
          className={`meaning-popup-action meaning-popup-tooltip meaning-popup-status-level${
            level === wordLevel ? ' active' : ''
          }${level === 1 ? ' status-1' : ''}`}
          type="button"
          aria-label={`Set LingQ status ${statusLabels[level]}`}
          data-tooltip={statusLabels[level]}
        >
          <span className="meaning-popup-status-circle">{level}</span>
        </button>
      ))}
      <div className="meaning-popup-toolbar-divider" />
      <button
        className="meaning-popup-action meaning-popup-tooltip known"
        type="button"
        aria-label="Mark as known"
        data-tooltip="Known"
        onClick={() => onMarkAsKnown(wordId)}
      >
        <Check size={18} />
      </button>
      <button
        className="meaning-popup-action meaning-popup-tooltip ignore"
        type="button"
        aria-label="Ignore"
        data-tooltip="Ignore"
        onClick={() => onIgnore(wordId)}
      >
        <EyeOff size={18} />
      </button>
    </div>
  );

  const iconActions = (
    <div className="meaning-popup-actions-inner meaning-popup-icon-actions">
      <button
        className={`meaning-popup-action meaning-popup-tooltip${
          isExpanded && activeTab === 'sentence' ? ' active' : ''
        }`}
        type="button"
        aria-label="Sentence Translation"
        data-tooltip="Sentence Translation"
        onClick={() => handleExpand('sentence')}
      >
        <LetterText size={18} />
      </button>
      <button
        className={`meaning-popup-action meaning-popup-tooltip${
          isExpanded && activeTab === 'notes' ? ' active' : ''
        }`}
        type="button"
        aria-label="Notes"
        data-tooltip="Notes"
        onClick={() => handleExpand('notes')}
      >
        <NotebookPen size={18} />
      </button>
      <button
        className={`meaning-popup-action lynx meaning-popup-tooltip${
          isExpanded && activeTab === 'explain' ? ' active' : ''
        }`}
        type="button"
        aria-label="Explain This"
        data-tooltip="Explain This"
        onClick={() => handleExpand('explain')}
      >
        <img src={lynxIconGrey} alt="" className="meaning-popup-lynx" />
      </button>
    </div>
  );

  const actions = (
    <div className="meaning-popup-toolbar-actions">
      {isExpanded ? null : statusToolbar}
    </div>
  );

  const headerMeaning = (
    <button
      className={`meaning-popup-meaning-option meaning-popup-header-meaning${
        isMeaningFlash ? ' flash' : ''
      }`}
      type="button"
      onClick={() => handleExpand('meaning')}
      onMouseEnter={() => {
        setIsMeaningHovered(true);
      }}
      onMouseLeave={() => {
        setIsMeaningHovered(false);
        setCanShowMeaningTooltip(true);
      }}
    >
      <span className="meaning-popup-header-meaning-content">
        <span ref={headerMeaningRef} className="meaning-popup-header-meaning-text">
          {selectedMeaning}
        </span>
        <ChevronRight className="meaning-popup-header-meaning-chevron" size={16} />
      </span>
    </button>
  );

  const panelContent = (
    <div className="meaning-popup-panel">
      {activeTab === 'meaning' ? (
        <>
          <div className="meaning-popup-search">
            <input
              className="meaning-popup-search-input"
              placeholder="Search or add a new meaning ..."
              value={meaningQuery}
              onChange={event => {
                const nextValue = event.target.value;
                setMeaningQuery(nextValue);
                if (addedMeaning && nextValue.trim() !== addedMeaning) {
                  setAddedMeaning(null);
                }
              }}
            />
            {meaningQuery.trim().length > 0 && (
              <button
                className="meaning-popup-search-clear"
                type="button"
                aria-label="Clear search"
                onClick={() => setMeaningQuery('')}
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div className="meaning-popup-meaning-row">
            <div
              className={`meaning-popup-meaning-list-wrap${showMeaningFade ? ' show-fade' : ''}`}
            >
              <div
                className={`meaning-popup-meaning-list${isSelectedMeaningWrapped ? ' is-expanded' : ''}`}
              >
                {sortedMeanings
                  .filter(option => option.text !== selectedMeaning)
                  .map(option => {
                    const metaLabel = option.count;
                  return (
                    <button
                      key={option.text}
                      className="meaning-popup-meaning-option"
                      type="button"
                      onClick={() => setSelectedMeaning(option.text)}
                    >
                      <span className="meaning-popup-meaning-option-text">
                        <span>{option.text}</span>
                      </span>
                      {metaLabel ? (
                        <span className="meaning-popup-meaning-meta">
                          <span className="meaning-popup-meaning-count">{metaLabel}</span>
                        </span>
                      ) : null}
                    </button>
                  );
                })}
                {canAddMeaning && (
                  <button
                    className={`meaning-popup-meaning-add${
                      addedMeaning && addedMeaning === meaningQuery.trim() ? ' success' : ''
                    }`}
                    type="button"
                    onClick={() => {
                      const nextValue = meaningQuery.trim();
                      if (!nextValue) return;
                      setSelectedMeaning(nextValue);
                      setAddedMeaning(nextValue);
                      if (addMeaningTimeoutRef.current !== null) {
                        window.clearTimeout(addMeaningTimeoutRef.current);
                      }
                      addMeaningTimeoutRef.current = window.setTimeout(() => {
                        setMeaningOptions(prevOptions => {
                          if (prevOptions.some(option => option.text === nextValue)) {
                            return prevOptions;
                          }
                          return [...prevOptions, { text: nextValue, count: '' }];
                        });
                        setAddedMeaning(null);
                      }, 3000);
                    }}
                  >
                    <span className="meaning-popup-meaning-add-label">{meaningQuery.trim()}</span>
                    <span className="meaning-popup-meaning-add-action">
                      {addedMeaning && addedMeaning === meaningQuery.trim() ? (
                        <Check size={18} />
                      ) : (
                        <Plus size={18} />
                      )}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="meaning-popup-panel-divider" />
          <div className="meaning-popup-dictionaries">
            <button
              className="meaning-popup-dictionary-action"
              type="button"
              aria-label="Open dictionary"
            >
              <BookA size={18} />
            </button>
            {dictionaries.map(dictionary => (
              <div key={dictionary.id} className="meaning-popup-dictionary">
                <img
                  src={new URL(`../assets/${dictionary.icon}`, import.meta.url).toString()}
                  alt=""
                  className="meaning-popup-dictionary-icon"
                />
                <span>{dictionary.name}</span>
              </div>
            ))}
          </div>
        </>
      ) : activeTab === 'sentence' ? (
        <div className="meaning-popup-sentence">
          <div className="meaning-popup-sentence-source">We do not monetize all of our videos.</div>
          <div className="meaning-popup-sentence-translation">
            Nous ne monétisons pas toutes nos vidéos.
          </div>
        </div>
      ) : activeTab === 'explain' ? (
        <div className="meaning-popup-explain">
          {explainStatus === 'loading' ? (
            <div className="meaning-popup-explain-loading">
              <span>Lynx is thinking</span>
              <span className="meaning-popup-explain-ellipsis" aria-hidden="true">
                <span>.</span>
                <span>.</span>
                <span>.</span>
              </span>
            </div>
          ) : (
            <>
              <p className="meaning-popup-explain-text">{explainText}</p>
              <div className="meaning-popup-explain-actions">
                <button type="button" aria-label="Regenerate explanation">
                  <RefreshCw size={18} />
                </button>
                <button type="button" aria-label="Add as note">
                  <NotebookPen size={18} />
                </button>
                <button type="button" aria-label="Copy explanation" className="copy">
                  <Copy size={18} />
                </button>
                <button type="button" aria-label="Ask Lynx" className="chat">
                  <MessageSquare size={18} />
                </button>
              </div>
            </>
          )}
        </div>
      ) : activeTab === 'status' ? (
        <div className="meaning-popup-status-panel">
          <div className="meaning-popup-status-list">
            {[
              { level: 1, label: 'New' },
              { level: 2, label: 'Recognized' },
              { level: 3, label: 'Familiar' },
              { level: 4, label: 'Learned' },
            ].map(item => (
              <button
                key={item.level}
                className={`meaning-popup-status-row${item.level === wordLevel ? ' active' : ''}`}
                type="button"
              >
                <span className="meaning-popup-status-left">
                  <span
                    className={`meaning-popup-status-icon${
                      item.level === wordLevel ? ' active' : ''
                    }`}
                  >
                    {item.level}
                  </span>
                  <span className="meaning-popup-status-label">{item.label}</span>
                </span>
                <span className="meaning-popup-status-shortcut">{item.level}</span>
              </button>
            ))}
          </div>
          <div className="meaning-popup-status-divider" />
          <div className="meaning-popup-status-actions">
            <button className="meaning-popup-status-action known" type="button">
              <span className="meaning-popup-status-left">
                <CircleCheck size={18} />
                <span>Known</span>
              </span>
              <span className="meaning-popup-status-shortcut">k</span>
            </button>
            <button className="meaning-popup-status-action ignore" type="button">
              <span className="meaning-popup-status-left">
                <EyeOff size={18} />
                <span>Ignore</span>
              </span>
              <span className="meaning-popup-status-shortcut">x</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="meaning-popup-panel-empty" />
      )}
    </div>
  );

  const expandedPanel = isExpanded && panelPosition ? (
    <div
      ref={panelRef}
      className={`meaning-popup-panel-detached placement-${placement}`}
      style={{
        position: 'fixed',
        left: `${panelPosition.left}px`,
        top: panelPosition.top !== undefined ? `${panelPosition.top}px` : undefined,
        bottom: panelPosition.bottom !== undefined ? `${panelPosition.bottom}px` : undefined,
        maxHeight:
          panelPosition.maxHeight !== undefined ? `${panelPosition.maxHeight}px` : undefined,
        width: panelWidth ? `${panelWidth}px` : undefined,
      }}
    >
      {panelContent}
    </div>
  ) : null;

  const handleHoverLeave = (event: React.MouseEvent<HTMLDivElement>) => {
    const nextTarget = event.relatedTarget as Node | null;
    const isBridgeTarget =
      nextTarget instanceof HTMLElement &&
      nextTarget.classList.contains('meaning-popup-hover-bridge');
    if (
      nextTarget &&
      (popupRef.current?.contains(nextTarget) ||
        toolbarRef.current?.contains(nextTarget) ||
        panelRef.current?.contains(nextTarget) ||
        isBridgeTarget)
    ) {
      return;
    }
    setIsHovered(false);
  };

  return (
    <>
      <div
        ref={popupRef}
        className={`meaning-popup placement-${placement}${isHovered ? ' is-hovered' : ''}${
          isExpanded ? ' is-expanded' : ''
        }`}
        style={{
          position: 'fixed',
          left: `${popupPosition.left}px`,
          top: popupPosition.top !== undefined ? `${popupPosition.top}px` : undefined,
          bottom: popupPosition.bottom !== undefined ? `${popupPosition.bottom}px` : undefined,
          maxHeight:
            popupPosition.maxHeight !== undefined ? `${popupPosition.maxHeight}px` : undefined,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleHoverLeave}
      >
        {invalidSelectionText ? (
          <div className="meaning-popup-invalid">{invalidSelectionText}</div>
        ) : (
          <div className={`meaning-popup-header${isExpanded ? ' is-expanded' : ''}`}>
            <div className="meaning-popup-header-row">
              {headerMeaning}
              {isExpanded ? iconActions : null}
              {isExpanded && isHeaderMeaningTruncated && (
                <div
                  className={`meaning-popup-header-meaning-tooltip${
                    isMeaningHovered && canShowMeaningTooltip ? ' is-visible' : ''
                  }`}
                  role="tooltip"
                >
                  {selectedMeaning}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {showActions &&
        hoverBridgePositions.map((bridge, index) => (
          <div
            key={`bridge-${index}`}
            className="meaning-popup-hover-bridge"
            style={{
              position: 'fixed',
              left: `${bridge.left}px`,
              top: `${bridge.top}px`,
              width: `${bridge.width}px`,
              height: `${bridge.height}px`,
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleHoverLeave}
          />
        ))}
      {showActions && !isExpanded && toolbarPosition && (
        <div
          ref={toolbarRef}
          className={`meaning-popup-toolbar placement-${placement}${
            showActions ? ' is-visible' : ''
          }${isExpanded ? ' is-expanded' : ''}`}
          style={{
            position: 'fixed',
            left: `${toolbarPosition.left}px`,
            top: toolbarPosition.top !== undefined ? `${toolbarPosition.top}px` : undefined,
            bottom: toolbarPosition.bottom !== undefined ? `${toolbarPosition.bottom}px` : undefined,
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={handleHoverLeave}
        >
          {actions}
        </div>
      )}
      {expandedPanel}
    </>
  );
};
