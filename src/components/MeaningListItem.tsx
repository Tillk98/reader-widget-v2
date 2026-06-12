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

/** Shared menu row (Figma MeaningMenuItem) — master component for More Meanings and Words in this Phrase. */
export const MeaningListItem: React.FC<MeaningListItemProps> = ({
  meaning,
  originalText,
  cta,
  onCta,
}) => {
  const hasOriginal = originalText != null && originalText !== '';
  const text = (
    <span className={`meaning-menu-item__text${hasOriginal ? ' meaning-menu-item__text--stacked' : ''}`}>
      {hasOriginal && <span className="meaning-menu-item__source">{originalText}</span>}
      <span className="meaning-menu-item__meaning">{meaning}</span>
    </span>
  );

  if (cta === 'open') {
    return (
      <div className="meaning-menu-item">
        <button
          type="button"
          className="meaning-menu-item__content meaning-menu-item__content--button"
          onClick={onCta}
        >
          {text}
          <span className="meaning-menu-item__btnset">
            <span className="reader-btn reader-btn--plain" aria-hidden>
              <ChevronRight size={16} />
            </span>
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="meaning-menu-item">
      <div className="meaning-menu-item__content">
        {text}
        {cta === 'add' && (
          <span className="meaning-menu-item__btnset">
            <button
              type="button"
              className="reader-btn reader-btn--accent"
              onClick={onCta}
              aria-label={`Add "${meaning}" to saved meanings`}
            >
              <Plus size={16} />
            </button>
          </span>
        )}
      </div>
    </div>
  );
};
