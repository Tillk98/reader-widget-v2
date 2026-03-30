import React from 'react';
import type { Sentence as SentenceType } from '../data/lesson';
import { Word } from './Word';
import './MediaModeLessonContent.css';

export interface MediaModeLessonContentProps {
  sentences: SentenceType[];
  /** Prefix for word span ids: `{prefix}-{word.id}` so sheet words do not collide with paginated reader words. */
  wordDomIdPrefix?: string;
  clickedWords: Set<string>;
  lingqWords: Set<string>;
  knownWords: Set<string>;
  ignoredWords: Set<string>;
  onWordClick: (wordId: string) => void;
}

export const MediaModeLessonContent: React.FC<MediaModeLessonContentProps> = ({
  sentences,
  wordDomIdPrefix,
  clickedWords,
  lingqWords,
  knownWords,
  ignoredWords,
  onWordClick,
}) => {
  return (
    <div className="media-mode-lesson-content">
      {sentences.map((sentence, sentenceIndex) => (
        <div key={sentenceIndex} className="media-mode-sentence-block">
          <p className="media-mode-sentence">
            {sentence.words.map((word, wordIndex) => (
              <React.Fragment key={word.id}>
                <Word
                  word={word}
                  domId={
                    wordDomIdPrefix != null && wordDomIdPrefix !== ''
                      ? `${wordDomIdPrefix}-${word.id}`
                      : undefined
                  }
                  isClicked={clickedWords.has(word.id)}
                  isLingQ={lingqWords.has(word.id)}
                  onClick={onWordClick}
                  isKnown={knownWords.has(word.id)}
                  isIgnored={ignoredWords.has(word.id)}
                />
                {wordIndex < sentence.words.length - 1 && ' '}
              </React.Fragment>
            ))}
          </p>
        </div>
      ))}
    </div>
  );
};
