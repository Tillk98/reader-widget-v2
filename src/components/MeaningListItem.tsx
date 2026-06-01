import React from 'react';
import { Plus, ChevronRight } from 'lucide-react';
import './MeaningListItem.css';

export interface MeaningListItemProps {
  /** Primary meaning / definition (body text). */
  meaning: string;
  /** Optional original-language text shown above the meaning (e.g. the source word in a phrase). */
  originalText?: string;
  /**
   * Trailing call-to-action:
   * - 'add'  → blue "+" pill (More Meanings)
   * - 'open' → grey chevron pill, content row is clickable (Words in this Phrase)
   */
  cta?: 'add' | 'open';
  onCta?: () => void;
}

/** Shared meanings list row — master component for More Meanings and Words in this Phrase. */
export const MeaningListItem: React.FC<MeaningListItemProps> = ({
  meaning,
  originalText,
  cta,
  onCta,
}) => {
  const text = (
    <span className="meaning-list-item__text">
      {originalText != null && originalText !== '' && (
        <span className="meaning-list-item__source">{originalText}</span>
      )}
      <span className="meaning-list-item__meaning">{meaning}</span>
    </span>
  );

  return (
    <div className="meaning-list-item">
      {cta === 'open' ? (
        <button
          type="button"
          className="meaning-list-item__content meaning-list-item__content--button"
          onClick={onCta}
        >
          {text}
          <span className="meaning-list-item__cta meaning-list-item__cta--open" aria-hidden>
            <ChevronRight size={16} />
          </span>
        </button>
      ) : (
        <div className="meaning-list-item__content">
          {text}
          {cta === 'add' && (
            <button
              type="button"
              className="meaning-list-item__cta meaning-list-item__cta--add"
              onClick={onCta}
              aria-label={`Add "${meaning}" to saved meanings`}
            >
              <Plus size={16} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
