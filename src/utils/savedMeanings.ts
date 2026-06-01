/**
 * Per-word saved meanings store. Supports add / edit / delete / reorder and persists to
 * localStorage so a word's customized list is restored next time any detail sheet opens.
 *
 * Items are modeled as { id, text } so reordering and editing stay stable even when two
 * meanings share the same text.
 */
export interface SavedMeaning {
  id: string;
  text: string;
}

const PREFIX = 'lingq.reader.savedMeanings.';
let counter = 0;

export function makeSavedMeaningId(): string {
  counter += 1;
  return `sm-${Date.now().toString(36)}-${counter.toString(36)}`;
}

/** Returns the stored list, or `null` when the word has never been customized. */
export function loadSavedMeanings(key: string): SavedMeaning[] | null {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter(
      (x): x is SavedMeaning =>
        !!x && typeof x.id === 'string' && typeof x.text === 'string',
    );
  } catch {
    return null;
  }
}

export function saveSavedMeanings(key: string, list: SavedMeaning[]): void {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(list));
  } catch {
    /* ignore (private mode / quota) */
  }
}
