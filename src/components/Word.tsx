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
  /** Drag after the long-press popup appeared → live phrase drag-select (viewport coords). */
  onLongPressDragMove?: (clientX: number, clientY: number) => void;
  /** Pointer released after a long-press drag → commit the drag-selected phrase. */
  onLongPressDragEnd?: () => void;
  isKnown: boolean;
  isIgnored: boolean;
  /** Part of an in-progress / active phrase selection. */
  isPhraseSelected?: boolean;
  /** First word of the phrase run (rounds the left edge of the highlight). */
  isPhraseStart?: boolean;
  /** Last word of the phrase run (rounds the right edge of the highlight). */
  isPhraseEnd?: boolean;
  /** The anchor (start) word while picking a phrase — gets a distinct focus ring. */
  isPhraseAnchor?: boolean;
  /** Part of an AI "new phrase" — rendered as a continuous blue band. */
  isNewPhrase?: boolean;
  /** First word of the new-phrase run (rounds the left edge). */
  isNewPhraseStart?: boolean;
  /** Last word of the new-phrase run (rounds the right edge). */
  isNewPhraseEnd?: boolean;
}

export const Word: React.FC<WordProps> = ({
  word,
  domId,
  isClicked,
  isLingQ,
  onClick,
  onLongPress,
  onLongPressDragMove,
  onLongPressDragEnd,
  isKnown,
  isIgnored,
  isPhraseSelected = false,
  isPhraseStart = false,
  isPhraseEnd = false,
  isPhraseAnchor = false,
  isNewPhrase = false,
  isNewPhraseStart = false,
  isNewPhraseEnd = false,
}) => {
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPressRef = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isKnown || isIgnored) return;
    if (e.button !== 0) return;
    didLongPressRef.current = false;

    const origin = { x: e.clientX, y: e.clientY };
    let longPressHasFired = false;
    let draggedAfterLongPress = false;

    const onWindowMove = (ev: PointerEvent) => {
      const dx = ev.clientX - origin.x;
      const dy = ev.clientY - origin.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (longPressHasFired) {
        // Popup is up → a drag now drives phrase drag-select on the text.
        // Keep the listeners alive for the rest of the gesture.
        if (dist > DRAG_CANCEL_PX) {
          draggedAfterLongPress = true;
          onLongPressDragMove?.(ev.clientX, ev.clientY);
        }
        return;
      }
      if (dist > DRAG_CANCEL_PX) {
        // Drag before popup appeared → cancel the pending timer.
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
      if (draggedAfterLongPress) onLongPressDragEnd?.();
      cleanup();
    };
    const onWindowCancel = () => {
      if (longPressTimerRef.current !== null) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      if (draggedAfterLongPress) onLongPressDragEnd?.();
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
      longPressHasFired = true;
      didLongPressRef.current = true;
      onLongPress?.(word.id);
      // Keep move/up/cancel listeners running — onWindowMove will call onLongPressCancel if the user drags.
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
    if (!isPhraseSelected && !isPhraseAnchor && !isNewPhrase) return base;
    return [
      base,
      /* New-phrase band (blue) — superseded by the green selection band when active. */
      isNewPhrase && !isPhraseSelected && 'new-phrase-word',
      isNewPhrase && !isPhraseSelected && isNewPhraseStart && 'new-phrase-word--start',
      isNewPhrase && !isPhraseSelected && isNewPhraseEnd && 'new-phrase-word--end',
      isPhraseSelected && 'phrase-word',
      isPhraseSelected && isPhraseStart && 'phrase-word--start',
      isPhraseSelected && isPhraseEnd && 'phrase-word--end',
      isPhraseAnchor && 'phrase-word--anchor',
    ]
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
