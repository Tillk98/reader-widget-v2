import React, { useRef, useEffect, useCallback, useLayoutEffect, useState } from 'react';
import { ChevronRight, Languages } from 'lucide-react';
import type { LingQStatusType } from './LingQStatusBar';
import { LingQStatusBar } from './LingQStatusBar';
import { LingQStatusButton } from './LingQStatusButton';
import { StatusPopover } from './StatusPopover';
import './PhrasePopUp.css';

export interface PhraseWordItem {
  id: string;
  /** Original (target-language) word. */
  text: string;
  /** Word definition. */
  translation: string;
}

interface PhrasePopUpProps {
  /** Original (target-language) phrase text (used for the invalid variant + detail sheet). */
  phraseText: string;
  /** Best-effort joined meaning shown in the header (valid phrase). */
  meaning: string;
  /** Per-word breakdown shown in the list (valid phrase). */
  words: PhraseWordItem[];
  /** A valid phrase is ≤ 9 words within a single sentence. */
  valid: boolean;
  /** LingQ status of the phrase (drives the badge in the header card). */
  status?: LingQStatusType;
  /** Called when the user picks a new status from the inline status picker. */
  onStatusChange?: (status: LingQStatusType) => void;
  /** Per-word LingQ status (keyed by word id) for the breakdown row badges. */
  wordStatuses?: Record<string, LingQStatusType>;
  /** Set the status of one word in the breakdown from its inline vertical picker. */
  onWordStatusChange?: (wordId: string, status: LingQStatusType) => void;
  /** Re-query on each layout/scroll so the popup stays aligned with the selection. */
  getAnchorRect: () => DOMRect | null;
  onClose: () => void;
  /** Valid phrase → open the full word/phrase detail sheet. */
  onExpand?: () => void;
  /** Valid phrase → open the detail sheet for one word in the breakdown. */
  onWordOpen?: (wordId: string) => void;
  /** Invalid phrase → (non-functional) Google Translate handoff. */
  onGoogleTranslate?: () => void;
}

const PHRASE_LIMIT_NOTE = 'Please select up to 9 words from the same sentence to LingQ a phrase.';

interface PhraseWordRowProps {
  word: PhraseWordItem;
  status: LingQStatusType;
  menuOpen: boolean;
  /** Toggle this row's vertical status menu. */
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onStatusChange: (status: LingQStatusType) => void;
  onOpen: () => void;
}

/** One word in the phrase breakdown: status badge + term/meaning opener.
 *  Tapping the badge opens a floating vertical status menu anchored to it. */
const PhraseWordRow: React.FC<PhraseWordRowProps> = ({
  word,
  status,
  menuOpen,
  onToggleMenu,
  onCloseMenu,
  onStatusChange,
  onOpen,
}) => {
  const badgeRef = useRef<HTMLButtonElement>(null);
  return (
    <div className="phrase-popup__row">
      <LingQStatusButton
        ref={badgeRef}
        status={status}
        state="focus"
        className="phrase-popup__row-badge"
        onClick={(e) => { e.stopPropagation(); onToggleMenu(); }}
        onPointerDown={(e) => e.stopPropagation()}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label={`Status ${status}, tap to change`}
      />
      {menuOpen && (
        <StatusPopover
          anchorRef={badgeRef}
          status={status}
          onStatusChange={onStatusChange}
          onClose={onCloseMenu}
        />
      )}
      <button
        type="button"
        className="phrase-popup__row-open"
        onClick={(e) => { e.stopPropagation(); onOpen(); }}
      >
        <span className="phrase-popup__row-text">
          <span className="phrase-popup__row-source">{word.text}</span>
          <span className="phrase-popup__row-def">{word.translation}</span>
        </span>
        <span className="phrase-popup__row-chevron" aria-hidden>
          <ChevronRight size={12} />
        </span>
      </button>
    </div>
  );
};

export const PhrasePopUp: React.FC<PhrasePopUpProps> = ({
  phraseText,
  meaning,
  words,
  valid,
  status = 'New',
  getAnchorRect,
  onClose,
  onExpand,
  onWordOpen,
  onGoogleTranslate,
  onStatusChange,
  wordStatuses,
  onWordStatusChange,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);
  /** 'above' → popup sits above the selection (list rendered above the meaning header). */
  const [placement, setPlacement] = useState<'above' | 'below'>('above');
  const [showStatusBar, setShowStatusBar] = useState(false);
  /** Word id whose inline vertical status picker is open (null = none). */
  const [statusMenuWordId, setStatusMenuWordId] = useState<string | null>(null);

  const calculatePosition = useCallback(() => {
    const el = popupRef.current;
    if (!el) return;
    const anchorRect = getAnchorRect();
    if (!anchorRect) return;

    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const gap = 8;
    const width = rect.width || 240;
    const height = rect.height || 0;

    let left = anchorRect.left + anchorRect.width / 2 - width / 2;
    left = Math.max(8, Math.min(left, vw - 8 - width));

    const spaceAbove = anchorRect.top;
    const spaceBelow = vh - anchorRect.bottom;
    /* Prefer above; flip below only when there isn't room above and there's more below. */
    const place: 'above' | 'below' =
      spaceAbove >= height + gap || spaceAbove >= spaceBelow ? 'above' : 'below';

    let top = place === 'above' ? anchorRect.top - gap - height : anchorRect.bottom + gap;
    top = Math.max(8, Math.min(top, vh - 8 - height));

    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
    if (place !== placement) setPlacement(place);
  }, [getAnchorRect, placement]);

  useLayoutEffect(() => {
    calculatePosition();
  }, [calculatePosition, meaning, valid, placement, words, showStatusBar]);

  useEffect(() => {
    const handleUpdate = () => calculatePosition();
    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('resize', handleUpdate);
    return () => {
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [calculatePosition]);

  /* Re-run positioning whenever the popup resizes (e.g. status-bar morph
     expanding the meaning card) so the right-edge clamp stays accurate. */
  useEffect(() => {
    const el = popupRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => calculatePosition());
    observer.observe(el);
    return () => observer.disconnect();
  }, [calculatePosition]);

  useEffect(() => {
    const isOutside = (target: EventTarget | null) => {
      if (!popupRef.current || !(target instanceof Node)) return false;
      if (popupRef.current.contains(target)) return false;
      /* The per-word vertical status menu is portaled to <body> (outside the popup) —
         interacting with it must not dismiss the phrase popup. */
      if (target instanceof Element && target.closest('.status-popover')) return false;
      return true;
    };
    const handleMouseOutside = (e: MouseEvent) => {
      if (isOutside(e.target)) onClose();
    };
    const handleTouchOutside = (e: TouchEvent) => {
      if (e.changedTouches.length > 0 && isOutside(e.changedTouches[0].target)) onClose();
    };
    document.addEventListener('mousedown', handleMouseOutside);
    document.addEventListener('touchstart', handleTouchOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleMouseOutside);
      document.removeEventListener('touchstart', handleTouchOutside);
    };
  }, [onClose]);

  if (!valid) {
    return (
      <div
        ref={popupRef}
        className="phrase-popup phrase-popup--invalid"
        role="dialog"
        aria-label="Phrase selection"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="phrase-popup__invalid-body">
          <p className="phrase-popup__phrase">{phraseText}</p>
          <button
            type="button"
            className="phrase-popup__translate"
            onClick={(e) => {
              e.stopPropagation();
              onGoogleTranslate?.();
            }}
          >
            <Languages size={16} strokeWidth={2} />
            <span>Google Translate</span>
          </button>
          <p className="phrase-popup__note">{PHRASE_LIMIT_NOTE}</p>
        </div>
      </div>
    );
  }

  const header = (
    <div className={`phrase-popup__meaning-card${showStatusBar ? ' phrase-popup__meaning-card--status-mode' : ''}`}>
      {/* Always in DOM — cross-fades with the status bar on badge tap */}
      <div
        className="phrase-popup__meaning-header"
        role="button"
        tabIndex={0}
        onClick={(e) => { e.stopPropagation(); onExpand?.(); }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); onExpand?.(); } }}
      >
        <LingQStatusButton
          status={status}
          state="focus"
          onClick={(e) => { e.stopPropagation(); setStatusMenuWordId(null); setShowStatusBar(prev => !prev); }}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label={`Status ${status}, tap to change`}
          aria-expanded={showStatusBar}
        />
        <span className="phrase-popup__meaning-col">
          <span className="phrase-popup__meaning-term">{phraseText}</span>
          <span className="phrase-popup__meaning">{meaning || 'Meaning'}</span>
        </span>
      </div>
      <div className="phrase-popup__meaning-statusbar" aria-hidden={!showStatusBar}>
        <LingQStatusBar
          variant="floating"
          status={status}
          onStatusChange={(newStatus) => {
            onStatusChange?.(newStatus);
            setShowStatusBar(false);
          }}
        />
      </div>
    </div>
  );

  // Ignored words drop out of the breakdown; Known words stay (shown with the Known status).
  const visibleWords = words.filter(w => (wordStatuses?.[w.id] ?? 'New') !== 'Ignored');

  const list = (
    <div className="phrase-popup__list-card">
      <div className="phrase-popup__list">
        {visibleWords.map((w, i) => (
          <React.Fragment key={w.id}>
            {i > 0 && <div className="phrase-popup__row-divider" aria-hidden />}
            <PhraseWordRow
              word={w}
              status={wordStatuses?.[w.id] ?? 'New'}
              menuOpen={statusMenuWordId === w.id}
              onToggleMenu={() => {
                setShowStatusBar(false);
                setStatusMenuWordId(prev => (prev === w.id ? null : w.id));
              }}
              onCloseMenu={() => setStatusMenuWordId(null)}
              onStatusChange={(newStatus) => onWordStatusChange?.(w.id, newStatus)}
              onOpen={() => onWordOpen?.(w.id)}
            />
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  return (
    <div
      ref={popupRef}
      className="phrase-popup phrase-popup--valid"
      role="tooltip"
      onPointerDown={(e) => e.stopPropagation()}
    >
      {placement === 'above' ? (
        <>
          {list}
          {header}
        </>
      ) : (
        <>
          {header}
          {list}
        </>
      )}
    </div>
  );
};
