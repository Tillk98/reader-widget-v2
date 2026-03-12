import React from 'react';
import type { Word as WordType } from '../data/lesson';
import { Word } from './Word';
import './Page.css';

interface PageProps {
  words: WordType[];
  clickedWords: Set<string>;
  lingqWords: Set<string>;
  onWordClick: (wordId: string) => void;
  knownWords: Set<string>;
  ignoredWords: Set<string>;
}

export const Page: React.FC<PageProps> = ({
  words,
  clickedWords,
  lingqWords,
  onWordClick,
  knownWords,
  ignoredWords,
}) => {
  return (
    <div className="page">
      <div className="page-content">
        {words.map((word, index) => (
          <React.Fragment key={word.id}>
            <Word
              word={word}
              isClicked={clickedWords.has(word.id)}
              isLingQ={lingqWords.has(word.id)}
              onClick={onWordClick}
              isKnown={knownWords.has(word.id)}
              isIgnored={ignoredWords.has(word.id)}
            />
            {index < words.length - 1 && ' '}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
