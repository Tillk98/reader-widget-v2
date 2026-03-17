import React, { useRef, useCallback, useEffect } from 'react';
import {
  Volume2,
  SquarePen,
  Copy,
  RefreshCw,
  PenLine,
  NotebookPen,
  Coins,
  Check,
  Plus,
} from 'lucide-react';
import sentenceIconGrey from '../assets/sentence-icon-grey.png';
import lynxIconGrey from '../assets/lynx-icon-grey.png';
import addTagsIcon from '../assets/add-tags-icon.png';
import dictionaryDeepl from '../assets/dictionary-deepl.png';
import dictionaryGlosbe from '../assets/dictionary-glosbe.png';
import dictionaryWordReference from '../assets/dictionary-wordreference.png';
import dictionaryLinguee from '../assets/dictionary-linguee.png';
import type { LingQStatusType } from './LingQStatusBar';
import { LingQStatusBar } from './LingQStatusBar';
import './WordDetailBottomSheet.css';

const DRAG_CLOSE_THRESHOLD_PX = 40;

const DICTIONARIES: Array<{ id: string; label: string; image: string }> = [
  { id: 'deepl', label: 'DeepL Translate', image: dictionaryDeepl },
  { id: 'glosbe', label: 'Glosbe', image: dictionaryGlosbe },
  { id: 'wordreference', label: 'Word Reference', image: dictionaryWordReference },
  { id: 'linguee', label: 'Linguee', image: dictionaryLinguee },
];

export interface WordDetailBottomSheetProps {
  wordTranslation?: string;
  wordTransliteration?: string;
  wordStatus?: LingQStatusType;
  onWordStatusChange?: (status: LingQStatusType) => void;
  onClose: () => void;
}

export const WordDetailBottomSheet: React.FC<WordDetailBottomSheetProps> = ({
  wordTranslation,
  wordTransliteration: _wordTransliteration,
  wordStatus = 'New',
  onWordStatusChange,
  onClose,
}) => {
  const handleRef = useRef<HTMLDivElement>(null);
  const handleDragStartYRef = useRef<number | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const phrase = wordTranslation ?? 'Meaning';

  const [isEditingMeaning, setIsEditingMeaning] = React.useState(false);
  const [editingMeaning, setEditingMeaning] = React.useState(phrase);
  const meaningInputRef = React.useRef<HTMLInputElement>(null);

  const handleEditClick = useCallback(() => {
    setEditingMeaning(phrase);
    setIsEditingMeaning(true);
    // Focus input on next paint so it's mounted
    requestAnimationFrame(() => meaningInputRef.current?.focus());
  }, [phrase]);

  const handleDoneClick = useCallback(() => {
    setIsEditingMeaning(false);
  }, []);

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
      if (handleDragStartYRef.current !== null) onCloseRef.current();
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
      else onClose();
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
        <header className="word-detail-sheet-header">
          <div className="word-detail-sheet-header-row">
            {!isEditingMeaning && (
              <button type="button" className="word-detail-sheet-icon-btn" aria-label="Volume">
                <Volume2 size={18} />
              </button>
            )}
            {isEditingMeaning ? (
              <>
                <input
                  ref={meaningInputRef}
                  type="text"
                  className="word-detail-sheet-meaning-input"
                  value={editingMeaning}
                  onChange={(e) => setEditingMeaning(e.target.value)}
                  aria-label="Edit meaning"
                />
                <button
                  type="button"
                  className="word-detail-sheet-icon-btn word-detail-sheet-edit-btn"
                  aria-label="Done"
                  onClick={handleDoneClick}
                >
                  <Check size={18} />
                </button>
              </>
            ) : (
              <>
                <span className="word-detail-sheet-phrase">{phrase}</span>
                <button
                  type="button"
                  className="word-detail-sheet-icon-btn word-detail-sheet-edit-btn"
                  aria-label="Edit"
                  onClick={handleEditClick}
                >
                  <SquarePen size={18} />
                </button>
              </>
            )}
          </div>
        </header>

        {!isEditingMeaning && (
        <div className="word-detail-sheet-tags">
          <div className="word-detail-sheet-tags-left">
            <button type="button" className="word-detail-sheet-tag-add" aria-label="Add tag">
              <img src={addTagsIcon} alt="" className="word-detail-sheet-tag-add-icon" aria-hidden />
            </button>
            <span className="word-detail-sheet-tag-chip">tag</span>
            <span className="word-detail-sheet-tag-chip">tag</span>
          </div>
          <div className="word-detail-sheet-tags-right">
            <span className="word-detail-sheet-tag-count">3</span>
            <Coins size={18} className="word-detail-sheet-coin" />
          </div>
        </div>
        )}

        <div className="word-detail-sheet-content">
          {isEditingMeaning ? (
            <>
              <div className="word-detail-sheet-edit-content">
                <div className="word-detail-sheet-suggested-meanings">
                  <button type="button" className="word-detail-sheet-suggested-meaning">
                    <span className="word-detail-sheet-suggested-meaning-text">Suggested meaning</span>
                    <Plus size={18} aria-hidden />
                  </button>
                  <button type="button" className="word-detail-sheet-suggested-meaning">
                    <span className="word-detail-sheet-suggested-meaning-text">Suggested meaning</span>
                    <Plus size={18} aria-hidden />
                  </button>
                </div>
                <div className="word-detail-sheet-dictionaries">
                  {DICTIONARIES.map((d) => (
                    <div key={d.id} className="word-detail-sheet-dictionary-chip">
                      <div className="word-detail-sheet-dictionary-chip__icon">
                        <img src={d.image} alt="" />
                      </div>
                      <span className="word-detail-sheet-dictionary-chip__label">{d.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
          <>
          <section className="word-detail-sheet-section">
            <div className="word-detail-sheet-section-header">
              <img src={sentenceIconGrey} alt="" className="word-detail-sheet-section-icon" aria-hidden />
              <span>SENTENCE</span>
            </div>
            <div className="word-detail-sheet-sentence">
              <p className="word-detail-sheet-sentence-original">Can you please use the other towel?</p>
              <p className="word-detail-sheet-sentence-translation">Kannst du bitte das andere Handtuch benutzen?</p>
            </div>
          </section>

          <section className="word-detail-sheet-section">
            <div className="word-detail-sheet-section-header">
              <img src={lynxIconGrey} alt="" className="word-detail-sheet-section-icon" aria-hidden />
              <span>EXPLAIN</span>
            </div>
            <div className="word-detail-sheet-explain-text">
              <p>
                The German verb &quot;benutzen&quot; means &quot;to use&quot; in English.
              </p>
              <p>
                It is a regular verb, so its forms are: benutze (ich), benutzt (du/er/sie/es/ihr), benutzen
                (wir/Sie/sie).
              </p>
              <p>
                &quot;benutzen&quot; = to use (something for a purpose). For example: „Kannst du bitte das andere
                Handtuch benutzen?&quot; — Can you please use the other towel?
              </p>
            </div>
            <div className="word-detail-sheet-explain-actions">
              <button type="button" className="word-detail-sheet-icon-btn" aria-label="Volume">
                <Volume2 size={18} />
              </button>
              <button type="button" className="word-detail-sheet-icon-btn" aria-label="Copy">
                <Copy size={18} />
              </button>
              <button type="button" className="word-detail-sheet-icon-btn" aria-label="Refresh">
                <RefreshCw size={18} />
              </button>
              <button type="button" className="word-detail-sheet-icon-btn" aria-label="Edit">
                <PenLine size={18} />
              </button>
            </div>
          </section>

          <section className="word-detail-sheet-section">
            <div className="word-detail-sheet-section-header">
              <NotebookPen size={18} aria-hidden />
              <span>NOTES</span>
            </div>
            <div className="word-detail-sheet-notes-field">
              <span className="word-detail-sheet-notes-placeholder">Add a note ...</span>
              <button type="button" className="word-detail-sheet-icon-btn" aria-label="Edit note">
                <SquarePen size={18} />
              </button>
            </div>
          </section>
          </>
          )}
        </div>

        {!isEditingMeaning && (
          <footer className="word-detail-sheet-footer">
            {onWordStatusChange ? (
              <LingQStatusBar status={wordStatus} onStatusChange={onWordStatusChange} />
            ) : null}
          </footer>
        )}
      </div>
    </div>
  );
};
