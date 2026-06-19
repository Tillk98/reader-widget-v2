import React from 'react';
import { SentenceMenuItem } from './SentenceMenuItem';
import type { WordDetailSentenceContextEntry } from './SentenceBlock';
import './SentenceMenu.css';

export interface SentenceMenuProps {
  /** Optional caption above the menu (e.g. "PAST ENCOUNTERS"). */
  label?: string;
  entries: WordDetailSentenceContextEntry[];
  onAudio?: (entry: WordDetailSentenceContextEntry) => void;
  onGoToLesson?: (entry: WordDetailSentenceContextEntry) => void;
}

/**
 * Past-encounter sentence menu (Figma SentenceMenu 4446:89642) — a rounded grey container
 * of collapsible SentenceMenuItems separated by hairline dividers.
 */
export const SentenceMenu: React.FC<SentenceMenuProps> = ({
  label,
  entries,
  onAudio,
  onGoToLesson,
}) => {
  if (entries.length === 0) return null;
  return (
    <section className="sentence-menu">
      {label ? (
        <div className="sentence-menu__header">
          <span className="sentence-menu__label">{label}</span>
        </div>
      ) : null}
      <div className="sentence-menu__container">
        {entries.map((entry, i) => (
          <React.Fragment key={`${entry.lessonTitle}-${i}`}>
            {i > 0 && <div className="sentence-menu__divider" aria-hidden />}
            <SentenceMenuItem entry={entry} onAudio={onAudio} onGoToLesson={onGoToLesson} />
          </React.Fragment>
        ))}
      </div>
    </section>
  );
};
