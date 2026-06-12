import React from 'react';
import './MeaningSection.css';

export interface MeaningSectionProps<T> {
  /** Caption label, e.g. "SAVED MEANINGS". */
  label: string;
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Optional node rendered as the last menu row (e.g. AddMeaningRow). */
  footer?: React.ReactNode;
}

/**
 * Menu section (Figma MeaningsMenu / MenuContainer 4029:12351).
 * Static caption header + rounded menu container with hairline dividers between rows.
 */
export function MeaningSection<T>({
  label,
  items,
  getKey,
  renderItem,
  footer,
}: MeaningSectionProps<T>) {
  const entries: { key: string; node: React.ReactNode }[] = items.map((item, i) => ({
    key: getKey(item),
    node: renderItem(item, i),
  }));
  if (footer != null) entries.push({ key: '__footer', node: footer });

  return (
    <section className="meaning-section">
      <div className="meaning-section__header">
        <span className="meaning-section__label">{label}</span>
      </div>
      <div className="meaning-menu">
        <div className="meaning-menu__container">
          {entries.map((entry, i) => (
            <React.Fragment key={entry.key}>
              {i > 0 && <div className="meaning-menu__divider" aria-hidden />}
              {entry.node}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
