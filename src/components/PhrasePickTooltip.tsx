import React from 'react';
import './PhrasePickTooltip.css';

export interface PhrasePickTooltipProps {
  /** Override the default bottom offset (matches the status snackbar position). */
  bottomOffsetPx?: number;
}

/** Snackbar-style hint shown while "Select a Phrase" is active. */
export const PhrasePickTooltip: React.FC<PhrasePickTooltipProps> = ({ bottomOffsetPx }) => (
  <div
    className="phrase-pick-tooltip"
    role="status"
    aria-live="polite"
    style={
      bottomOffsetPx != null
        ? { bottom: `calc(${bottomOffsetPx}px + env(safe-area-inset-bottom, 0px))` }
        : undefined
    }
  >
    Tap a word to examine a phrase
  </div>
);
