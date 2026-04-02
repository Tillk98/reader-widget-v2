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
  /** When true, group words into block elements per lesson sentence (video lesson layout). */
  videoLessonLayout?: boolean;
  /** Map word id → sentence index in `lesson.sentences` (required when videoLessonLayout). */
  wordToSentenceIndex?: ReadonlyMap<string, number>;
}

/** Split a page’s word list into contiguous runs that belong to the same sentence. */
function groupWordsBySentenceRun(
  words: WordType[],
  wordToSentenceIndex: ReadonlyMap<string, number>
): WordType[][] {
  const runs: WordType[][] = [];
  let current: WordType[] = [];
  let lastSi: number | undefined;

  for (const w of words) {
    const si = wordToSentenceIndex.get(w.id);
    if (si === undefined) {
      if (current.length) {
        runs.push(current);
        current = [];
      }
      current.push(w);
      lastSi = undefined;
      continue;
    }
    if (current.length === 0 || si === lastSi) {
      current.push(w);
      lastSi = si;
    } else {
      runs.push(current);
      current = [w];
      lastSi = si;
    }
  }
  if (current.length) {
    runs.push(current);
  }
  return runs.length > 0 ? runs : [words];
}

export const Page: React.FC<PageProps> = ({
  words,
  clickedWords,
  lingqWords,
  onWordClick,
  knownWords,
  ignoredWords,
  videoLessonLayout = false,
  wordToSentenceIndex,
}) => {
  const useSentenceLayout = Boolean(videoLessonLayout && wordToSentenceIndex && wordToSentenceIndex.size > 0);
  const sentenceRuns = useSentenceLayout
    ? groupWordsBySentenceRun(words, wordToSentenceIndex!)
    : null;

  const renderWord = (word: WordType) => (
    <Word
      word={word}
      isClicked={clickedWords.has(word.id)}
      isLingQ={lingqWords.has(word.id)}
      onClick={onWordClick}
      isKnown={knownWords.has(word.id)}
      isIgnored={ignoredWords.has(word.id)}
    />
  );

  return (
    <div className={['page', videoLessonLayout && 'page--video-lesson-scroll'].filter(Boolean).join(' ')}>
      <div className={['page-content', videoLessonLayout && 'page-content--video-lesson'].filter(Boolean).join(' ')}>
        {useSentenceLayout && sentenceRuns
          ? sentenceRuns.map((run, runIndex) => (
              <p key={`${run[0]?.id ?? runIndex}-${runIndex}`} className="page-content__sentence">
                {run.map((word, index) => (
                  <React.Fragment key={word.id}>
                    {renderWord(word)}
                    {index < run.length - 1 && ' '}
                  </React.Fragment>
                ))}
              </p>
            ))
          : words.map((word, index) => (
              <React.Fragment key={word.id}>
                {renderWord(word)}
                {index < words.length - 1 && ' '}
              </React.Fragment>
            ))}
      </div>
    </div>
  );
};
