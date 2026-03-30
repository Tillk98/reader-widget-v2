import React, { useCallback } from 'react';
import { Volume2, Copy, RefreshCw } from 'lucide-react';

export type LynxMessageActionsPayload = {
  meta?: string;
  body: string;
};

export interface LynxMessageActionsProps {
  /** Clipboard + host callbacks: meta line (e.g. “Generated …”) when shown above body. */
  payload: LynxMessageActionsPayload;
  onAudio?: (payload: LynxMessageActionsPayload) => void;
  onRefresh?: (payload: LynxMessageActionsPayload) => void;
}

/** Copies meta + blank line + body when meta is set; otherwise body only. */
function copyLynxClipboardText(payload: LynxMessageActionsPayload): string {
  const m = payload.meta?.trim();
  if (m) return `${m}\n\n${payload.body}`;
  return payload.body;
}

export const LynxMessageActions: React.FC<LynxMessageActionsProps> = ({
  payload,
  onAudio,
  onRefresh,
}) => {
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(copyLynxClipboardText(payload));
    } catch {
      // Clipboard may be unavailable in non-secure contexts.
    }
  }, [payload]);

  return (
    <div className="word-detail-sheet-lynx-card__actions">
      <button
        type="button"
        className="word-detail-sheet-icon-btn"
        aria-label="Play explanation audio"
        onClick={() => onAudio?.(payload)}
      >
        <Volume2 size={18} aria-hidden />
      </button>
      <button type="button" className="word-detail-sheet-icon-btn" aria-label="Copy explanation" onClick={handleCopy}>
        <Copy size={18} aria-hidden />
      </button>
      <button
        type="button"
        className="word-detail-sheet-icon-btn"
        aria-label="Regenerate explanation"
        onClick={() => onRefresh?.(payload)}
      >
        <RefreshCw size={18} aria-hidden />
      </button>
    </div>
  );
};
