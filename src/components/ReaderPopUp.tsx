import React, { useRef, useEffect, useCallback, useLayoutEffect, useState } from 'react';
import {
  ChevronRight,
  Volume2,
  Coins,
  Languages,
  FileText,
  Sparkles,
  SquarePen,
  Tag,
  Plus,
  Copy,
  RefreshCw,
  PenLine,
} from 'lucide-react';
import type { LingQStatusType } from './LingQStatusBar';
import { LingQStatusBar } from './LingQStatusBar';
import dictionaryDeepl from '../assets/dictionary-deepl.png';
import dictionaryGlosbe from '../assets/dictionary-glosbe.png';
import dictionaryLinguee from '../assets/dictionary-linguee.png';
import dictionaryWordReference from '../assets/dictionary-wordreference.png';
import './ReaderPopUp.css';

const DICTIONARIES: Array<{ id: string; label: string; image: string }> = [
  { id: 'deepl', label: 'DeepL Translate', image: dictionaryDeepl },
  { id: 'glosbe', label: 'Glosbe', image: dictionaryGlosbe },
  { id: 'wordreference', label: 'Word Reference', image: dictionaryWordReference },
  { id: 'linguee', label: 'Linguee', image: dictionaryLinguee },
];

interface ReaderPopUpProps {
  wordId: string;
  wordText: string;
  wordTranslation?: string;
  wordTransliteration?: string;
  anchorRect: DOMRect;
  wordStatus?: LingQStatusType;
  onWordStatusChange?: (status: LingQStatusType) => void;
  onClose: () => void;
}

export const ReaderPopUp: React.FC<ReaderPopUpProps> = ({
  wordTranslation,
  wordTransliteration,
  anchorRect,
  wordStatus = 'New',
  onWordStatusChange,
  onClose,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const meaningSectionRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMeaningFieldFocused, setIsMeaningFieldFocused] = useState(false);
  const [activeTab, setActiveTab] = useState<'meaning' | 'sentence' | 'explain'>('meaning');

  const meaning = wordTranslation ?? '';

  const calculatePosition = useCallback(() => {
    if (!popupRef.current) return;

    const popupRect = popupRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const gap = 6;
    const popupWidth = popupRect.width || 80;

    let left = anchorRect.left + anchorRect.width / 2 - popupWidth / 2;
    if (left < 8) left = 8;
    if (left + popupWidth > viewportWidth - 8) left = viewportWidth - 8 - popupWidth;

    const bottom = window.innerHeight - anchorRect.top + gap;

    popupRef.current.style.left = `${left}px`;
    popupRef.current.style.bottom = `${bottom}px`;
  }, [anchorRect]);

  useLayoutEffect(() => {
    calculatePosition();
  }, [calculatePosition, meaning, wordTransliteration, isExpanded]);

  useEffect(() => {
    const handleUpdate = () => calculatePosition();
    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('resize', handleUpdate);
    return () => {
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [calculatePosition]);

  useEffect(() => {
    const isOutside = (target: EventTarget | null) => {
      if (!popupRef.current || !(target instanceof Node)) return false;
      if (popupRef.current.contains(target)) return false;
      const bar = document.querySelector('.reader-bottom-bar');
      if (bar && bar.contains(target)) return false;
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

  const handleExpandClick = (e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation();
    setIsExpanded(true);
  };

  if (isExpanded) {
    return (
      <div
        ref={popupRef}
        className="reader-popup-widget reader-popup-widget--expanded"
        role="dialog"
        aria-label="Word details"
      >
        <div className="reader-popup-widget-expanded-header">
          <div className="reader-popup-widget-expanded-header-row">
            <div className="reader-popup-widget-term reader-popup-widget-term--expanded">
              <span className="reader-popup-widget-meaning">{meaning || 'Meaning'}</span>
              {wordTransliteration != null && wordTransliteration !== '' && (
                <span className="reader-popup-widget-transliteration">
                  {wordTransliteration}
                </span>
              )}
            </div>
            <div className="reader-popup-widget-expanded-actions">
              <button
                type="button"
                className="reader-popup-widget-icon-btn"
                aria-label="Volume"
              >
                <Volume2 size={18} />
              </button>
              <div className="reader-popup-widget-coins" aria-hidden>
                <span className="reader-popup-widget-coins-value">4</span>
                <Coins size={18} />
              </div>
            </div>
          </div>
          <div className="reader-popup-widget-tabs">
            <button
              type="button"
              className={`reader-popup-widget-tab ${activeTab === 'meaning' ? 'reader-popup-widget-tab--active' : ''}`}
              onClick={() => setActiveTab('meaning')}
              aria-label="Meaning"
              aria-pressed={activeTab === 'meaning'}
            >
              <Languages size={18} aria-hidden />
              {activeTab === 'meaning' ? <span>Meaning</span> : null}
            </button>
            <button
              type="button"
              className={`reader-popup-widget-tab ${activeTab === 'sentence' ? 'reader-popup-widget-tab--active' : ''}`}
              onClick={() => setActiveTab('sentence')}
              aria-label="Sentence"
              aria-pressed={activeTab === 'sentence'}
            >
              <FileText size={18} aria-hidden />
              {activeTab === 'sentence' ? <span>Sentence</span> : null}
            </button>
            <button
              type="button"
              className={`reader-popup-widget-tab ${activeTab === 'explain' ? 'reader-popup-widget-tab--active' : ''}`}
              onClick={() => setActiveTab('explain')}
              aria-label="Explain"
              aria-pressed={activeTab === 'explain'}
            >
              <Sparkles size={18} aria-hidden />
              {activeTab === 'explain' ? <span>Explain</span> : null}
            </button>
          </div>
        </div>
        <div className="reader-popup-widget-content">
          {activeTab === 'meaning' && (
            <>
              <div ref={meaningSectionRef} className="reader-popup-widget-meaning-section">
                <button
                  type="button"
                  className="reader-popup-widget-meaning-row"
                  aria-label="Edit meaning"
                  onFocus={() => setIsMeaningFieldFocused(true)}
                  onBlur={(e) => {
                    if (
                      meaningSectionRef.current &&
                      e.relatedTarget instanceof Node &&
                      meaningSectionRef.current.contains(e.relatedTarget)
                    ) {
                      return;
                    }
                    setIsMeaningFieldFocused(false);
                  }}
                >
                  <div className="reader-popup-widget-meaning-field">
                    <span className="reader-popup-widget-meaning-field-text">
                      {meaning || 'Meaning'}
                    </span>
                    <SquarePen size={18} aria-hidden />
                  </div>
                </button>
                {isMeaningFieldFocused && (
                  <>
                    <div className="reader-popup-widget-meaning-actions">
                      <button
                        type="button"
                        className="reader-popup-widget-meaning-cancel"
                        onClick={() => setIsMeaningFieldFocused(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="reader-popup-widget-meaning-save"
                        onClick={() => setIsMeaningFieldFocused(false)}
                      >
                        Save
                      </button>
                    </div>
                    <div className="reader-popup-widget-suggested-meanings">
                      <button type="button" className="reader-popup-widget-suggested-meaning">
                        <span className="reader-popup-widget-suggested-meaning-text">Suggested meaning</span>
                        <Plus size={18} aria-hidden />
                      </button>
                      <button type="button" className="reader-popup-widget-suggested-meaning">
                        <span className="reader-popup-widget-suggested-meaning-text">Suggested meaning</span>
                        <Plus size={18} aria-hidden />
                      </button>
                    </div>
                  </>
                )}
              </div>
              <div className="reader-popup-widget-dictionaries">
                {DICTIONARIES.map((d) => (
                  <div key={d.id} className="reader-popup-widget-dictionary-chip">
                    <div className="reader-popup-widget-dictionary-chip__icon">
                      <img src={d.image} alt="" />
                    </div>
                    <span className="reader-popup-widget-dictionary-chip__label">{d.label}</span>
                  </div>
                ))}
              </div>
              <div className="reader-popup-widget-tags">
                <button
                  type="button"
                  className="reader-popup-widget-tag-add"
                  aria-label="Add tag"
                >
                  <Tag size={18} aria-hidden />
                </button>
                <span className="reader-popup-widget-tag-chip">tag</span>
                <span className="reader-popup-widget-tag-chip">tag</span>
              </div>
            </>
          )}
          {activeTab === 'sentence' && (
            <div className="reader-popup-widget-sentence-section">
              <div className="reader-popup-widget-sentence-block">
                <p className="reader-popup-widget-sentence-original">
                  Can you please use the other towel?
                </p>
                <p className="reader-popup-widget-sentence-translation">
                  Kannst du bitte das andere Handtuch benutzen?
                </p>
              </div>
              <div className="reader-popup-widget-sentence-chips">
                <div className="reader-popup-widget-sentence-chip">
                  <span className="reader-popup-widget-sentence-chip__badge">1</span>
                  <div className="reader-popup-widget-sentence-chip__text">
                    <span className="reader-popup-widget-sentence-chip__term">Kannst</span>
                    <span className="reader-popup-widget-sentence-chip__definition">Can</span>
                  </div>
                </div>
                <div className="reader-popup-widget-sentence-chip">
                  <span className="reader-popup-widget-sentence-chip__badge">1</span>
                  <div className="reader-popup-widget-sentence-chip__text">
                    <span className="reader-popup-widget-sentence-chip__term">Bitte</span>
                    <span className="reader-popup-widget-sentence-chip__definition">Please</span>
                  </div>
                </div>
                <div className="reader-popup-widget-sentence-chip">
                  <span className="reader-popup-widget-sentence-chip__badge">1</span>
                  <div className="reader-popup-widget-sentence-chip__text">
                    <span className="reader-popup-widget-sentence-chip__term">Handtuch</span>
                    <span className="reader-popup-widget-sentence-chip__definition">Handtowel</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'explain' && (
            <div className="reader-popup-widget-explain-section">
              <div className="reader-popup-widget-explain-text">
                {`The German verb "benutzen" means "to use" in English.

It is a regular verb, so its forms are: benutze (ich), benutzt (du/er/sie/es/ihr), benutzen (wir/Sie/sie).

"benutzen" = to use (something for a purpose). For example: „Kannst du bitte das andere Handtuch benutzen?" — Can you please use the other towel?`}
              </div>
              <div className="reader-popup-widget-explain-actions">
                <button type="button" className="reader-popup-widget-icon-btn" aria-label="Volume">
                  <Volume2 size={18} />
                </button>
                <button type="button" className="reader-popup-widget-icon-btn" aria-label="Copy">
                  <Copy size={18} />
                </button>
                <button type="button" className="reader-popup-widget-icon-btn" aria-label="Refresh">
                  <RefreshCw size={18} />
                </button>
                <button type="button" className="reader-popup-widget-icon-btn" aria-label="Edit">
                  <PenLine size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
        <footer className="reader-popup-widget-footer">
          {onWordStatusChange ? (
            <LingQStatusBar status={wordStatus} onStatusChange={onWordStatusChange} />
          ) : null}
        </footer>
      </div>
    );
  }

  return (
    <div
      ref={popupRef}
      className="reader-popup-widget"
      role="tooltip"
      onClick={handleExpandClick}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="reader-popup-widget-header">
        <div className="reader-popup-widget-term">
          <span className="reader-popup-widget-meaning">{meaning || 'Meaning'}</span>
          {wordTransliteration != null && wordTransliteration !== '' && (
            <span className="reader-popup-widget-transliteration">{wordTransliteration}</span>
          )}
        </div>
        <div className="reader-popup-widget-chevron-btn" aria-hidden>
          <ChevronRight size={18} />
        </div>
      </div>
    </div>
  );
};
