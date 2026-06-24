import React from 'react';
import { BottomSheet } from './BottomSheet';
import { DictionaryManageContent } from './DictionaryManageContent';
import type { DictionaryMenuItem } from './DictionaryManageContent';

export type { DictionaryMenuItem } from './DictionaryManageContent';

export interface DictionaryMenuSheetProps {
  open: boolean;
  onClose: () => void;
  /** Enabled dictionaries (shown in the horizontal strip). */
  active: DictionaryMenuItem[];
  /** Dictionaries available to add. */
  more: DictionaryMenuItem[];
  /** Accepted for API compatibility; reorder is a decorative handle here (matches the meanings rows). */
  onReorder?: (from: number, to: number) => void;
  /** Remove an active dictionary. */
  onRemove: (id: string) => void;
  /** Add an available dictionary. */
  onAdd: (id: string) => void;
  /** Current dictionary language (UI only — not yet functional). */
  language?: string;
  onChangeLanguage?: () => void;
}

/**
 * Manage Your Dictionaries (Figma DictionaryMenu 3424:6328) — mobile presentation: a floating
 * BottomSheet wrapping the shared {@link DictionaryManageContent}. On tablet the same content is
 * rendered in-widget by `WordDetailBottomSheet` instead.
 */
export const DictionaryMenuSheet: React.FC<DictionaryMenuSheetProps> = ({
  open,
  onClose,
  active,
  more,
  onRemove,
  onAdd,
  language = 'English',
  onChangeLanguage,
}) => {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabel="Manage your dictionaries"
      className="dictionary-menu-sheet"
    >
      <DictionaryManageContent
        active={active}
        more={more}
        onRemove={onRemove}
        onAdd={onAdd}
        language={language}
        onChangeLanguage={onChangeLanguage}
      />
    </BottomSheet>
  );
};
