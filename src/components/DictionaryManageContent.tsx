import React from 'react';
import { Languages, ChevronRight } from 'lucide-react';
import { MeaningSection } from './MeaningSection';
import { SavedMeaningRow } from './SavedMeaningRow';
import { MeaningListItem } from './MeaningListItem';
import './DictionaryMenuSheet.css';

const noop = () => {};

export interface DictionaryMenuItem {
  id: string;
  label: string;
}

export interface DictionaryManageContentProps {
  /** Enabled dictionaries (drag-to-reorder handle + swipe-to-delete). */
  active: DictionaryMenuItem[];
  /** Dictionaries available to add (blue "+"). */
  more: DictionaryMenuItem[];
  onRemove: (id: string) => void;
  onAdd: (id: string) => void;
  /** Current dictionary language (UI only — not yet functional). */
  language?: string;
  onChangeLanguage?: () => void;
}

/**
 * The "Manage Your Dictionaries" body (Figma 3424:6328 / 4735:17292) — Your/More dictionary
 * sections + Language footer. Shared by the mobile bottom sheet (`DictionaryMenuSheet`) and the
 * tablet in-widget view (rendered inside the word-detail widget with a back button).
 */
export const DictionaryManageContent: React.FC<DictionaryManageContentProps> = ({
  active,
  more,
  onRemove,
  onAdd,
  language = 'English',
  onChangeLanguage,
}) => {
  return (
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
  );
};
