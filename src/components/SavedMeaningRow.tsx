import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import './SavedMeaningRow.css';

const DELETE_WIDTH = 63;
/** Past this many px of left-swipe, release snaps the row open. */
const SWIPE_OPEN_THRESHOLD = 28;
/** Movement under this many px counts as a tap (→ edit), not a swipe. */
const TAP_MOVE_TOLERANCE = 8;

export interface SavedMeaningRowProps {
  meaning: string;
  onSave: (text: string) => void;
  onDelete: () => void;
}

/**
 * Saved-meaning row with two interactions:
 * - swipe left  → reveals delete action (Figma 3776:7544)
 * - tap          → inline edit: single row with [input] [X cancel] [+ save] (Figma 3789:7189)
 */
export const SavedMeaningRow: React.FC<SavedMeaningRowProps> = ({
  meaning,
  onSave,
  onDelete,
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(meaning);
  const [offset, setOffset] = useState(0);
  const [active, setActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const startX = useRef(0);
  const startY = useRef(0);
  const startOffset = useRef(0);
  const dragging = useRef(false);
  const engaged = useRef(false);
  const moved = useRef(false);

  useEffect(() => {
    if (!editing) setDraft(meaning);
  }, [meaning, editing]);

  useEffect(() => {
    if (editing) {
      const el = inputRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }
    }
  }, [editing]);

  const open = offset > 0;

  const snap = useCallback(
    () => setOffset(offset >= SWIPE_OPEN_THRESHOLD ? DELETE_WIDTH : 0),
    [offset],
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    if (editing) return;
    startX.current = e.clientX;
    startY.current = e.clientY;
    startOffset.current = offset;
    dragging.current = true;
    engaged.current = false;
    moved.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;
    if (!engaged.current) {
      if (Math.abs(dx) > TAP_MOVE_TOLERANCE && Math.abs(dx) >= Math.abs(dy)) {
        engaged.current = true;
        moved.current = true;
        setActive(true);
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      } else if (Math.abs(dy) > TAP_MOVE_TOLERANCE) {
        dragging.current = false;
        return;
      } else {
        return;
      }
    }
    setOffset(Math.max(0, Math.min(DELETE_WIDTH, startOffset.current - dx)));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    dragging.current = false;
    setActive(false);
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    if (!moved.current) {
      if (open) setOffset(0);
      else setEditing(true);
      return;
    }
    snap();
  };

  const handlePointerCancel = () => {
    if (!dragging.current) return;
    dragging.current = false;
    setActive(false);
    snap();
  };

  const handleCancel = () => {
    setDraft(meaning);
    setEditing(false);
  };

  const handleSave = () => {
    const v = draft.trim();
    onSave(v || meaning);
    setEditing(false);
  };

  /* ── Edit state ──────────────────────────────────────────────── */
  if (editing) {
    return (
      <div className="saved-meaning saved-meaning--edit">
        <input
          ref={inputRef}
          type="text"
          className="saved-meaning__input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            else if (e.key === 'Escape') handleCancel();
          }}
          aria-label="Edit meaning"
          autoComplete="off"
          spellCheck
        />
        <button
          type="button"
          className="saved-meaning__edit-btn saved-meaning__edit-btn--cancel"
          aria-label="Cancel edit"
          onClick={handleCancel}
        >
          <X size={16} aria-hidden />
        </button>
        <button
          type="button"
          className="saved-meaning__edit-btn saved-meaning__edit-btn--save"
          aria-label="Save meaning"
          onClick={handleSave}
        >
          <Plus size={16} aria-hidden />
        </button>
      </div>
    );
  }

  /* ── Default / delete-revealed state ────────────────────────── */
  return (
    <div className={`saved-meaning${open ? ' saved-meaning--open' : ''}`}>
      <div
        className="saved-meaning__content"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        <span className="saved-meaning__text">{meaning}</span>
      </div>
      <button
        type="button"
        className="saved-meaning__delete"
        aria-label={`Delete ${meaning}`}
        tabIndex={open ? 0 : -1}
        style={{
          transform: `translateX(${DELETE_WIDTH - offset}px)`,
          transition: active ? 'none' : 'transform 0.18s ease',
        }}
        onClick={onDelete}
      >
        <Trash2 size={16} aria-hidden />
      </button>
    </div>
  );
};

/* ── Add a new meaning row ───────────────────────────────────────── */

export interface AddMeaningRowProps {
  onAdd: (text: string) => void;
}

/**
 * Persistent "Add a new meaning" row that lives at the bottom of the saved-meanings list.
 * Tapping enters inline edit mode (same single-row style as SavedMeaningRow edit state).
 * After saving the new meaning the row reverts to its AddNew appearance.
 */
export const AddMeaningRow: React.FC<AddMeaningRowProps> = ({ onAdd }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
    }
  }, [editing]);

  const handleSave = () => {
    const v = draft.trim();
    if (v) {
      onAdd(v);
      setDraft('');
      setEditing(false);
    }
  };

  const handleCancel = () => {
    setDraft('');
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="saved-meaning saved-meaning--edit">
        <input
          ref={inputRef}
          type="text"
          className="saved-meaning__input"
          placeholder="New meaning…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            else if (e.key === 'Escape') handleCancel();
          }}
          aria-label="New meaning"
          autoComplete="off"
          spellCheck
        />
        <button
          type="button"
          className="saved-meaning__edit-btn saved-meaning__edit-btn--cancel"
          aria-label="Cancel"
          onClick={handleCancel}
        >
          <X size={16} aria-hidden />
        </button>
        <button
          type="button"
          className="saved-meaning__edit-btn saved-meaning__edit-btn--save"
          aria-label="Save new meaning"
          onClick={handleSave}
        >
          <Plus size={16} aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="saved-meaning__add-new"
      onClick={() => setEditing(true)}
    >
      + Add a new meaning
    </button>
  );
};
