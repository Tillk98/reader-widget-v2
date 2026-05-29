import React, { useEffect, useRef, useState } from 'react';
import lynxIcon from '../assets/lynx-default.png';

export interface NoteFieldProps {
  /** Existing saved note; when non-empty the field opens in the "saved" state. */
  initialNote?: string;
  /** Human-readable timestamp for the saved note (e.g. "Mar 20, 9:35 AM EST"). */
  initialUpdatedAt?: string;
  /** Text inserted when the user taps "Generate with Lynx AI" (empty state). */
  generatedNote?: string;
  onSave?: (text: string) => void;
  onClear?: () => void;
}

const DEFAULT_GENERATED_NOTE =
  'Frisur describes the overall style/arrangement of the hair, not the hair itself — so eine schlechte Frisur means a bad haircut or styling.';

function formatTimestamp(d: Date): string {
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const tz = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' })
    .formatToParts(d)
    .find((p) => p.type === 'timeZoneName')?.value;
  return tz ? `${date}, ${time} ${tz}` : `${date}, ${time}`;
}

export const NoteField: React.FC<NoteFieldProps> = ({
  initialNote = '',
  initialUpdatedAt,
  generatedNote = DEFAULT_GENERATED_NOTE,
  onSave,
  onClear,
}) => {
  const [savedText, setSavedText] = useState(initialNote.trim());
  const [updatedAt, setUpdatedAt] = useState(initialUpdatedAt ?? '');
  const [draft, setDraft] = useState(initialNote);
  const [editing, setEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const mode: 'empty' | 'focus' | 'saved' = editing
    ? 'focus'
    : savedText !== ''
      ? 'saved'
      : 'empty';

  useEffect(() => {
    if (editing) {
      const el = textareaRef.current;
      if (el) {
        el.focus();
        const end = el.value.length;
        el.setSelectionRange(end, end);
      }
    }
  }, [editing]);

  const beginEditing = () => {
    setDraft(savedText);
    setEditing(true);
  };

  const handleSave = () => {
    const next = draft.trim();
    setSavedText(next);
    if (next !== '') {
      setUpdatedAt(formatTimestamp(new Date()));
      onSave?.(next);
    } else {
      setUpdatedAt('');
      onClear?.();
    }
    setEditing(false);
  };

  const handleClear = () => {
    setDraft('');
    setSavedText('');
    setUpdatedAt('');
    setEditing(false);
    onClear?.();
  };

  const handleGenerate = () => {
    setDraft(generatedNote);
    setEditing(true);
  };

  if (mode === 'focus') {
    return (
      <div className="note-field note-field--focus">
        <div className="note-field__box note-field__box--focus">
          <textarea
            ref={textareaRef}
            className="note-field__textarea"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add your note here ..."
            aria-label="Note"
            rows={1}
          />
        </div>
        <div className="note-field__buttons">
          <button type="button" className="note-field__btn note-field__btn--secondary" onClick={handleClear}>
            Clear
          </button>
          <button type="button" className="note-field__btn note-field__btn--primary" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'saved') {
    return (
      <div className="note-field note-field--saved">
        <button
          type="button"
          className="note-field__box note-field__box--saved"
          onClick={beginEditing}
          aria-label="Edit note"
        >
          <span className="note-field__saved-header">
            <span className="note-field__saved-header-label">Last Updated</span>
            <span className="note-field__saved-header-time">{updatedAt}</span>
          </span>
          <span className="note-field__saved-body">{savedText}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="note-field note-field--empty">
      <button
        type="button"
        className="note-field__box note-field__box--empty"
        onClick={beginEditing}
        aria-label="Add a note"
      >
        <span className="note-field__placeholder">Add your note here ...</span>
      </button>
      <button type="button" className="note-field__generate" onClick={handleGenerate}>
        <img src={lynxIcon} alt="" className="note-field__generate-icon" aria-hidden />
        <span>Generate with Lynx AI</span>
      </button>
    </div>
  );
};
