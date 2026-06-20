import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, Check, Trash2, Undo2, GripVertical } from 'lucide-react';
import './SavedMeaningRow.css';

/** Movement under this many px counts as a tap (→ edit), not a swipe. */
const TAP_MOVE_TOLERANCE = 8;
/** Left-swipe past this fraction of the row width commits the delete on release. */
const DELETE_COMMIT_RATIO = 0.5;
/** Slide-out duration before the row is removed, kept in sync with the CSS transition. */
const DELETE_ANIM_MS = 200;

export interface SavedMeaningRowProps {
  meaning: string;
  onSave: (text: string) => void;
  onDelete: () => void;
  /** When false, tapping the row does nothing (no inline edit) — e.g. dictionary rows. */
  editable?: boolean;
}

/**
 * Saved-meaning menu row (Figma MeaningMenuItem 4031:70509) with two interactions:
 * - swipe left → reveals the red Delete panel (Figma 4032:72154)
 * - tap        → inline edit: single row with [input] [X cancel] [+ save]
 * The trailing grip handle is the reorder affordance shown in the design.
 */
export const SavedMeaningRow: React.FC<SavedMeaningRowProps> = ({
  meaning,
  onSave,
  onDelete,
  editable = true,
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(meaning);
  /** Px the content is dragged left; the red delete layer is revealed behind it. */
  const [offset, setOffset] = useState(0);
  /** True while dragging (transition off, content tracks the finger 1:1). */
  const [active, setActive] = useState(false);
  /** True once past the commit point — release will delete (solid-red cue). */
  const [armed, setArmed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  /** Edit-row container — used to detect taps outside the field. */
  const editContainerRef = useRef<HTMLDivElement>(null);
  /** Live mirror of `draft` so the outside-tap handler reads the latest text. */
  const draftRef = useRef(draft);

  const startX = useRef(0);
  const startY = useRef(0);
  const startOffset = useRef(0);
  const dragging = useRef(false);
  const engaged = useRef(false);
  const moved = useRef(false);
  /** Row width measured at gesture start — defines the commit midpoint and max travel. */
  const rowWidth = useRef(0);
  /** Live mirror of `offset` so the pointer-up handler reads the final value, not a stale closure. */
  const offsetRef = useRef(0);
  /** Guards against a double delete (gesture + a stray click during the slide-out). */
  const deleting = useRef(false);

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

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  /* Tapping outside commits the edit; if the text was erased, the meaning is removed. */
  useEffect(() => {
    if (!editing) return;
    const onDown = (e: PointerEvent) => {
      if (editContainerRef.current && !editContainerRef.current.contains(e.target as Node)) {
        const v = draftRef.current.trim();
        if (v) {
          onSave(v);
          setEditing(false);
        } else {
          onDelete(); // erased to empty → drop the menu item
        }
      }
    };
    const id = window.setTimeout(() => document.addEventListener('pointerdown', onDown, true), 0);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener('pointerdown', onDown, true);
    };
  }, [editing, onSave, onDelete]);

  const setOffsetValue = useCallback((next: number) => {
    offsetRef.current = next;
    setOffset(next);
  }, []);

  /** Snap the content back to rest (no deletion). */
  const resetOffset = useCallback(() => {
    setArmed(false);
    setOffsetValue(0);
  }, [setOffsetValue]);

  /** Slide the row fully out, then remove it. */
  const commitDelete = useCallback(() => {
    if (deleting.current) return;
    deleting.current = true;
    setActive(false);
    setOffsetValue(rowWidth.current);
    window.setTimeout(onDelete, DELETE_ANIM_MS);
  }, [onDelete, setOffsetValue]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (editing) return;
    rowWidth.current = rowRef.current?.offsetWidth ?? 0;
    startX.current = e.clientX;
    startY.current = e.clientY;
    startOffset.current = offsetRef.current;
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
    const max = rowWidth.current;
    const next = Math.max(0, Math.min(max, startOffset.current - dx));
    setOffsetValue(next);
    setArmed(max > 0 && next >= max * DELETE_COMMIT_RATIO);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    dragging.current = false;
    setActive(false);
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    if (!moved.current) {
      if (editable) setEditing(true);
      return;
    }
    const max = rowWidth.current;
    if (max > 0 && offsetRef.current >= max * DELETE_COMMIT_RATIO) {
      commitDelete();
    } else {
      resetOffset();
    }
  };

  const handlePointerCancel = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    dragging.current = false;
    setActive(false);
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    resetOffset();
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
      <div className="saved-meaning saved-meaning--edit" ref={editContainerRef}>
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
        {draft.trim() !== '' && (
          <button
            type="button"
            className="saved-meaning__edit-btn saved-meaning__edit-btn--cancel"
            aria-label="Erase text"
            onClick={() => setDraft('')}
          >
            <Undo2 size={16} aria-hidden />
          </button>
        )}
        <button
          type="button"
          className="saved-meaning__edit-btn saved-meaning__edit-btn--save"
          aria-label="Save meaning"
          onClick={handleSave}
        >
          <Check size={16} aria-hidden />
        </button>
      </div>
    );
  }

  /* ── Default / swipe-to-delete state ────────────────────────── */
  return (
    <div className="saved-meaning" ref={rowRef}>
      {/* Red layer behind the content, revealed from the right as the content slides left. */}
      <button
        type="button"
        className={`saved-meaning__delete${armed ? ' saved-meaning__delete--armed' : ''}`}
        aria-label={`Delete ${meaning}`}
        tabIndex={-1}
        onClick={commitDelete}
      >
        <Trash2 size={12} aria-hidden />
        <span className="saved-meaning__delete-label">Delete</span>
      </button>
      <div
        className="saved-meaning__content"
        style={{
          transform: `translateX(${-offset}px)`,
          transition: active ? 'none' : `transform ${DELETE_ANIM_MS}ms ease`,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        <span className="saved-meaning__text">{meaning}</span>
        <span className="meaning-item-handle saved-meaning__handle" aria-hidden>
          <GripVertical size={14} />
        </span>
      </div>
    </div>
  );
};

/* ── Add a new meaning row ───────────────────────────────────────── */

export interface AddMeaningRowProps {
  onAdd: (text: string) => void;
}

/**
 * Persistent "Add a new meaning" menu row at the bottom of the saved-meanings list
 * (Figma MeaningMenuItem 4031:70513 — leading "+" pill + label).
 * Tapping enters inline edit mode (same single-row style as SavedMeaningRow edit state).
 */
export const AddMeaningRow: React.FC<AddMeaningRowProps> = ({ onAdd }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const editContainerRef = useRef<HTMLDivElement>(null);
  const draftRef = useRef(draft);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
    }
  }, [editing]);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  /* Tapping outside commits the new meaning (if any) and closes the row. */
  useEffect(() => {
    if (!editing) return;
    const onDown = (e: PointerEvent) => {
      if (editContainerRef.current && !editContainerRef.current.contains(e.target as Node)) {
        const v = draftRef.current.trim();
        if (v) onAdd(v);
        setDraft('');
        setEditing(false);
      }
    };
    const id = window.setTimeout(() => document.addEventListener('pointerdown', onDown, true), 0);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener('pointerdown', onDown, true);
    };
  }, [editing, onAdd]);

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
      <div className="saved-meaning saved-meaning--edit" ref={editContainerRef}>
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
        {draft.trim() !== '' && (
          <button
            type="button"
            className="saved-meaning__edit-btn saved-meaning__edit-btn--cancel"
            aria-label="Erase text"
            onClick={() => setDraft('')}
          >
            <Undo2 size={16} aria-hidden />
          </button>
        )}
        <button
          type="button"
          className="saved-meaning__edit-btn saved-meaning__edit-btn--save"
          aria-label="Save new meaning"
          onClick={handleSave}
        >
          <Check size={16} aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <button type="button" className="saved-meaning__add-new" onClick={() => setEditing(true)}>
      <span className="reader-btn reader-btn--accent" aria-hidden>
        <Plus size={16} />
      </span>
      <span className="saved-meaning__add-new-label">Add a new meaning</span>
    </button>
  );
};
