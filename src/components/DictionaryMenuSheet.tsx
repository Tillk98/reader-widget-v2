import React from 'react';
import { Languages, ChevronRight } from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import { MeaningSection } from './MeaningSection';
import { SavedMeaningRow } from './SavedMeaningRow';
import { MeaningListItem } from './MeaningListItem';
import './DictionaryMenuSheet.css';

const noop = () => {};

export interface DictionaryMenuItem {
  id: string;
  label: string;
}

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
 * Manage Your Dictionaries (Figma DictionaryMenu 3424:6328). Built on the same MenuContainer /
 * MeaningMenuItem components as the meanings tab: "Your Dictionaries" reuse the saved-meaning row
 * (drag handle + swipe-to-delete, no inline edit) and "More Dictionaries" reuse the suggested row
 * (blue "+" add button).
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
      <div className="dictionary-menu">
        <MeaningSection
          label="YOUR DICTIONARIES"
          items={active}
          getKey={(d) => d.id}
          renderItem={(d) => (
            <SavedMeaningRow
              meaning={d.label}
              editable={false}
              onSave={noop}
              onDelete={() => onRemove(d.id)}
            />
          )}
        />

        <MeaningSection
          label="MORE DICTIONARIES"
          items={more}
          getKey={(d) => d.id}
          renderItem={(d) => (
            <MeaningListItem meaning={d.label} cta="add" onCta={() => onAdd(d.id)} />
          )}
        />

        {/* Language — footer row (not a menu item) */}
        <section className="dictionary-menu__section dictionary-menu__section--footer">
          <button
            type="button"
            className="dictionary-menu__item dictionary-menu__item--button"
            onClick={onChangeLanguage}
          >
            <span className="dictionary-menu__label">
              <Languages size={16} strokeWidth={2} className="dictionary-menu__item-icon" aria-hidden />
              <span className="dictionary-menu__item-text">Language</span>
            </span>
            <span className="dictionary-menu__value">
              {language}
              <ChevronRight size={16} strokeWidth={2} aria-hidden />
            </span>
          </button>
        </section>
      </div>
    </BottomSheet>
  );
};
