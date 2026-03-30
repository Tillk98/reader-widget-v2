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
}

export const Word: React.FC<WordProps> = ({
  word,
  domId,
  isClicked,
  isLingQ,
  onClick,
  isKnown,
  isIgnored,
}) => {
  const handleClick = () => {
    if (isKnown || isIgnored) return;
    onClick(word.id);
  };

  const getClassName = () => {
    if (isKnown || isIgnored) {
      return 'sentence-item';
    }
    return `sentence-item ${isClicked || isLingQ ? 'yellow-word' : 'blue-word'}`;
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
