import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { X, Menu, ArrowUp } from 'lucide-react';
import streakIcon from '../assets/streak-icon.png';
import { BottomSheet } from './BottomSheet';
import './LynxChatMode.css';

export interface LynxChatModeProps {
  open: boolean;
  /** Close the Lynx sheet and return to the previous reader mode. */
  onClose: () => void;
  /** Opens the lesson stats sheet. */
  onStats?: () => void;
}

/** The phrase the user "highlighted" — fixed example for this prototype. */
const PHRASE = '\u201CIl y a de cela un an\u201D';
/** Total Lynx response chunks revealed one after another. */
const TOTAL_CHUNKS = 3;

export const LynxChatMode: React.FC<LynxChatModeProps> = ({ open, onClose, onStats }) => {
  const [revealed, setRevealed] = useState(0);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const thinking = revealed < TOTAL_CHUNKS;
  const isActive = draft.trim().length > 0;

  useEffect(() => {
    if (!open) {
      setRevealed(0);
      setDraft('');
      return;
    }
    setRevealed(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i <= TOTAL_CHUNKS; i += 1) {
      timers.push(setTimeout(() => setRevealed(i), 1000 + i * 950));
    }
    return () => timers.forEach(clearTimeout);
  }, [open]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [revealed, open]);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      variant="full"
      ariaLabel="Chat with Lynx"
      showDragBar
      className="lynx-sheet"
    >
      {/* ── Header: X close (left) + stats (right) ───────────────── */}
      <header className="lynx-chat__header">
        <button
          type="button"
          className="lynx-chat__header-btn"
          aria-label="Close Lynx"
          onClick={onClose}
        >
          <X size={24} strokeWidth={2} />
        </button>
        <button
          type="button"
          className="lynx-chat__header-btn"
          aria-label="Lesson stats"
          onClick={onStats}
        >
          <img className="lynx-chat__header-stats" src={streakIcon} alt="" />
        </button>
      </header>

      {/* ── Scrollable messages ───────────────────────────────────── */}
      <div className="lynx-chat__scroll" ref={scrollRef}>
        <div className="lynx-chat__messages">
          <div className="lynx-chat__row lynx-chat__row--user">
            <div className="lynx-chat__bubble lynx-chat__bubble--user">
              <p className="lynx-chat__phrase">{PHRASE}</p>
            </div>
          </div>

          {revealed > 0 && (
            <div className="lynx-chat__row lynx-chat__row--lynx">
              <div className="lynx-chat__bubble lynx-chat__bubble--lynx">
                <p className="lynx-chat__text">
                  {'"Il y a de cela un an" ça veut dire "It was a year ago" ou "One year ago" en anglais.'}
                </p>

                {revealed > 1 && (
                  <div className="lynx-chat__extract">
                    <p className="lynx-chat__extract-label">Extrait de la leçon</p>
                    <p className="lynx-chat__extract-body">
                      {'\u201C'}
                      <span className="lynx-chat__extract-highlight">Il y a de cela un an,</span>
                      {' je parlais \u00e0 mon chat Albert d\u2019une \u00e9tude inqui\u00e9tante, publi\u00e9e dans la revue anglophone Stroke.\u201D'}
                    </p>
                  </div>
                )}

                {revealed > 2 && (
                  <p className="lynx-chat__text">
                    Et maintenant? Voulez vous que je utiliser dans un autre contexte?
                  </p>
                )}
              </div>
            </div>
          )}

          {thinking && (
            <div className="lynx-chat__row lynx-chat__row--lynx">
              <div className="lynx-chat__thinking">
                <span className="lynx-chat__thinking-dots" aria-hidden>
                  <span />
                  <span />
                  <span />
                </span>
                <span>Lynx is thinking …</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Input field ───────────────────────────────────────────── */}
      <div className="lynx-chat__input-wrap">
        <div className={['lynx-chat__input', isActive && 'lynx-chat__input--active'].filter(Boolean).join(' ')}>
          {/* Text input */}
          <div className="lynx-chat__input-header">
            <input
              type="text"
              className="lynx-chat__input-field"
              placeholder="Chat with Lynx …"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              aria-label="Chat with Lynx"
            />
          </div>
          {/* Footer: menu (left) | send arrow-up (right, always visible) */}
          <div className="lynx-chat__input-footer">
            <button type="button" className="lynx-chat__input-menu" aria-label="Menu">
              <Menu size={20} strokeWidth={2} />
            </button>
            <button
              type="button"
              className={['lynx-chat__send', isActive && 'lynx-chat__send--active'].filter(Boolean).join(' ')}
              aria-label="Send message"
              onClick={() => setDraft('')}
            >
              <ArrowUp size={20} strokeWidth={2.25} />
            </button>
          </div>
        </div>
      </div>
    </BottomSheet>
  );
};
