import React from 'react';
import type { Word as WordType } from '../data/lesson';
import './Word.css';

interface WordProps {
  word: WordType;
  /** When set, used as the span `id` (e.g. to avoid duplicate ids when the same lesson renders in the sheet and on pages). */
  domId?: string;
  isClicked: boolean;
  isLingQ: boolean;
  onClick: (wordId: string) => void;
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
  isKnown,
  isIgnored,
  isPhraseSelected = false,
  isPhraseStart = false,
  isPhraseEnd = false,
}) => {
  const handleClick = () => {
    if (isKnown || isIgnored) return;
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
      onClick={handleClick}
      style={{ cursor: isKnown || isIgnored ? 'default' : 'pointer' }}
    >
      {word.text}
    </span>
  );
};
