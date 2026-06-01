import type { Word } from '../data/lesson';

/** Maximum number of words allowed in a phrase LingQ. */
export const MAX_PHRASE_WORDS = 9;

/** A token that is purely punctuation / symbols (no letters or digits). */
const PUNCTUATION_ONLY = /^[^\p{L}\p{N}]+$/u;

export function isPunctuation(text: string): boolean {
  return PUNCTUATION_ONLY.test(text.trim());
}

/** Number of real (non-punctuation) words in a token list. */
export function countWords(words: Word[]): number {
  return words.reduce((n, w) => (isPunctuation(w.text) ? n : n + 1), 0);
}

/** Join tokens into readable text, attaching punctuation to the preceding word. */
function joinTokens(values: string[], texts: string[]): string {
  let out = '';
  values.forEach((value, i) => {
    if (isPunctuation(texts[i])) {
      out += value;
    } else {
      out += out.length ? ` ${value}` : value;
    }
  });
  return out;
}

/** Original-language phrase text. */
export function joinWordsText(words: Word[]): string {
  return joinTokens(
    words.map(w => w.text),
    words.map(w => w.text)
  );
}

/** Best-effort phrase meaning built from per-word translations. */
export function joinWordsTranslation(words: Word[]): string {
  return joinTokens(
    words.map(w => w.translation ?? w.text),
    words.map(w => w.text)
  );
}
