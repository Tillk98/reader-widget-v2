import React, { useRef } from 'react';
import type { Word as WordType } from '../data/lesson';
import './Word.css';

const LONG_PRESS_MS = 450;
const DRAG_CANCEL_PX = 6;

interface WordProps {
  word: WordType;
  /** When set, used as the span `id` (e.g. to avoid duplicate ids when the same lesson renders in the sheet and on pages). */
  domId?: string;
  isClicked: boolean;
  isLingQ: boolean;
  onClick: (wordId: string) => void;
  /** Called when the user holds the word for LONG_PRESS_MS without releasing. Does NOT trigger onClick. */
  onLongPress?: (wordId: string) => void;
  isKnown: boolean;
  isIgnored: boolean;
  /** Part of an in-progress / active phrase selection. */
  isPhraseSelected?: boolean;
  /** First word of the phrase run (rounds the left edge of the highlight). */
  isPhraseStart?: boolean;
  /** Last word of the phrase run (rounds the right edge of the highlight). */
  isPhraseEnd?: boolean;
}

export const Word: React.FC<WordProps> = ({
  word,
  domId,
  isClicked,
  isLingQ,
  onClick,
  onLongPress,
  isKnown,
  isIgnored,
  isPhraseSelected = false,
  isPhraseStart = false,
  isPhraseEnd = false,
}) => {
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPressRef = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isKnown || isIgnored) return;
    if (e.button !== 0) return;
    didLongPressRef.current = false;

    const origin = { x: e.clientX, y: e.clientY };

    const onWindowMove = (ev: PointerEvent) => {
      const dx = ev.clientX - origin.x;
      const dy = ev.clientY - origin.y;
      if (Math.sqrt(dx * dx + dy * dy) > DRAG_CANCEL_PX) {
        // Drag detected before long-press fired — cancel the timer
        if (longPressTimerRef.current !== null) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
        cleanup();
      }
    };

    const onWindowUp = () => {
      if (longPressTimerRef.current !== null) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      cleanup();
    };
    const onWindowCancel = () => {
      if (longPressTimerRef.current !== null) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      cleanup();
    };

    const cleanup = () => {
      window.removeEventListener('pointermove', onWindowMove);
      window.removeEventListener('pointerup', onWindowUp);
      window.removeEventListener('pointercancel', onWindowCancel);
    };

    window.addEventListener('pointermove', onWindowMove);
    window.addEventListener('pointerup', onWindowUp);
    window.addEventListener('pointercancel', onWindowCancel);

    longPressTimerRef.current = setTimeout(() => {
      longPressTimerRef.current = null;
      cleanup(); // stop drag-cancel tracking — popup is now visible
      didLongPressRef.current = true;
      onLongPress?.(word.id);
    }, LONG_PRESS_MS);
  };

  // Safety-net handlers (the window listeners above handle the real work).
  const handlePointerMove = () => { /* handled at window level */ };
  const handlePointerUp = () => { /* handled at window level */ };
  const handlePointerCancel = () => { /* handled at window level */ };

  const handleClick = () => {
    if (isKnown || isIgnored) return;
    if (didLongPressRef.current) {
      didLongPressRef.current = false;
      return;
    }
    onClick(word.id);
  };

  const getClassName = () => {
    const base = isKnown || isIgnored ? 'sentence-item' : `sentence-item ${isClicked || isLingQ ? 'yellow-word' : 'blue-word'}`;
    if (!isPhraseSelected) return base;
    return [base, 'phrase-word', isPhraseStart && 'phrase-word--start', isPhraseEnd && 'phrase-word--end']
      .filter(Boolean)
      .join(' ');
  };

  return (
    <span
      id={domId ?? word.id}
      className={getClassName()}
      style={{ cursor: isKnown || isIgnored ? 'default' : 'pointer' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onClick={handleClick}
      onContextMenu={(e) => e.preventDefault()}
    >
      {word.text}
    </span>
  );
};
