import React, { useState } from 'react';
import { ChevronUp } from 'lucide-react';
import './MeaningSection.css';

export interface MeaningSectionProps<T> {
  /** Caption label, e.g. "SAVED MEANINGS". */
  label: string;
  /** Whether the section starts expanded. */
  defaultOpen?: boolean;
  /** Adds 12px spacing between rows (More Meanings); otherwise rows are flush. */
  spacious?: boolean;
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T, index: number) => React.ReactNode;
}

/** Collapsible meanings section — shared by Saved / More / Words in this Phrase. */
export function MeaningSection<T>({
  label,
  defaultOpen = true,
  spacious = false,
  items,
  getKey,
  renderItem,
}: MeaningSectionProps<T>) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="meaning-section">
      <button
        type="button"
        className="meaning-section__header"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="meaning-section__label">{label}</span>
        <ChevronUp
          size={18}
          aria-hidden
          className={`meaning-section__chevron${open ? '' : ' meaning-section__chevron--collapsed'}`}
        />
      </button>
      {open && (
        <div className={`meaning-section__list${spacious ? ' meaning-section__list--spacious' : ''}`}>
          {items.map((item, i) => (
            <React.Fragment key={getKey(item)}>{renderItem(item, i)}</React.Fragment>
          ))}
        </div>
      )}
    </section>
  );
}
