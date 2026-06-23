import React from 'react';
import type { Word as WordType } from '../data/lesson';
import { Word } from './Word';
import './Page.css';

interface PageProps {
  words: WordType[];
  clickedWords: Set<string>;
  lingqWords: Set<string>;
  /** The currently-selected word — gets the solid green focus ring. */
  selectedWordId?: string | null;
  onWordClick: (wordId: string) => void;
  onWordLongPress?: (wordId: string) => void;
  /** Drag after the long-press menu appears → live phrase drag-select. */
  onWordLongPressDragMove?: (clientX: number, clientY: number) => void;
  onWordLongPressDragEnd?: () => void;
  knownWords: Set<string>;
  ignoredWords: Set<string>;
  /** When true, group words into block elements per lesson sentence (media lesson layout). */
  mediaLessonLayout?: boolean;
  /** Map word id → sentence index in `lesson.sentences` (required when mediaLessonLayout). */
  wordToSentenceIndex?: ReadonlyMap<string, number>;
  /** Word ids currently part of an active phrase selection. */
  phraseSelectedWords?: ReadonlySet<string>;
  /** The anchor word while picking a phrase — gets a distinct focus highlight. */
  phraseAnchorWordId?: string | null;
  /** Word ids belonging to an AI "new phrase" — rendered as one continuous blue band. */
  newPhraseWords?: ReadonlySet<string>;
  /** Word ids of committed phrase LingQs — rendered as a persistent green band. */
  committedPhraseWords?: ReadonlySet<string>;
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
  selectedWordId,
  onWordClick,
  onWordLongPress,
  onWordLongPressDragMove,
  onWordLongPressDragEnd,
  knownWords,
  ignoredWords,
  mediaLessonLayout = false,
  wordToSentenceIndex,
  phraseSelectedWords,
  phraseAnchorWordId,
  newPhraseWords,
  committedPhraseWords,
}) => {
  const useSentenceLayout = Boolean(mediaLessonLayout && wordToSentenceIndex && wordToSentenceIndex.size > 0);
  const sentenceRuns = useSentenceLayout
    ? groupWordsBySentenceRun(words, wordToSentenceIndex!)
    : null;

  /* Green band covers both the active selection and any committed phrase LingQ. */
  const isPhrase = (word: WordType) =>
    (phraseSelectedWords?.has(word.id) ?? false) || (committedPhraseWords?.has(word.id) ?? false);
  const isNewPhrase = (word: WordType) => newPhraseWords?.has(word.id) ?? false;

  /** Render an ordered run of words with their connecting spaces, applying the
   * continuous phrase highlight (rounded outer edges, filled inter-word spaces). */
  const renderRun = (run: WordType[]) =>
    run.map((word, index) => {
      const selected = isPhrase(word);
      const prevSelected = index > 0 && isPhrase(run[index - 1]);
      const nextSelected = index < run.length - 1 && isPhrase(run[index + 1]);
      /* The actively-selected phrase (drives the popup) — gets the green focus stroke. */
      const activePhrase = phraseSelectedWords?.has(word.id) ?? false;
      const nextActivePhrase =
        index < run.length - 1 && (phraseSelectedWords?.has(run[index + 1].id) ?? false);
      const newPhrase = isNewPhrase(word);
      const prevNewPhrase = index > 0 && isNewPhrase(run[index - 1]);
      const nextNewPhrase = index < run.length - 1 && isNewPhrase(run[index + 1]);
      /* Inter-word space: green when inside an active selection (with the focus stroke when both
         neighbours are the active phrase), else blue when inside a new phrase, else a plain space. */
      const spaceClass =
        selected && nextSelected
          ? `reader-space reader-space--phrase${activePhrase && nextActivePhrase ? ' reader-space--phrase-focus' : ''}`
          : newPhrase && nextNewPhrase
          ? 'reader-space reader-space--new-phrase'
          : 'reader-space';
      return (
        <React.Fragment key={word.id}>
          <Word
            word={word}
            isClicked={clickedWords.has(word.id)}
            isLingQ={lingqWords.has(word.id)}
            isSelected={selectedWordId === word.id}
            onClick={onWordClick}
            onLongPress={onWordLongPress}
            onLongPressDragMove={onWordLongPressDragMove}
            onLongPressDragEnd={onWordLongPressDragEnd}
            isKnown={knownWords.has(word.id)}
            isIgnored={ignoredWords.has(word.id)}
            isPhraseSelected={selected}
            isPhraseFocused={activePhrase}
            isPhraseStart={selected && !prevSelected}
            isPhraseEnd={selected && !nextSelected}
            isPhraseAnchor={phraseAnchorWordId === word.id}
            isNewPhrase={newPhrase}
            isNewPhraseStart={newPhrase && !prevNewPhrase}
            isNewPhraseEnd={newPhrase && !nextNewPhrase}
          />
          {index < run.length - 1 && (
            <span className={spaceClass}>
              {' '}
            </span>
          )}
        </React.Fragment>
      );
    });

  return (
    <div className={['page', mediaLessonLayout && 'page--media-lesson-scroll'].filter(Boolean).join(' ')}>
      <div className={['page-content', mediaLessonLayout && 'page-content--media-lesson'].filter(Boolean).join(' ')}>
        {useSentenceLayout && sentenceRuns
          ? sentenceRuns.map((run, runIndex) => (
              <p key={`${run[0]?.id ?? runIndex}-${runIndex}`} className="page-content__sentence">
                {renderRun(run)}
              </p>
            ))
          : renderRun(words)}
      </div>
    </div>
  );
};
