import React from 'react';
import type { Word as WordType } from '../data/lesson';
import './Word.css';

interface WordProps {
  word: WordType;
  isClicked: boolean;
  isLingQ: boolean;
  onClick: (wordId: string) => void;
  isKnown: boolean;
  isIgnored: boolean;
}

export const Word: React.FC<WordProps> = ({
  word,
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
      id={word.id}
      className={getClassName()}
      onClick={handleClick}
      style={{ cursor: isKnown || isIgnored ? 'default' : 'pointer' }}
    >
      {word.text}
    </span>
  );
};
