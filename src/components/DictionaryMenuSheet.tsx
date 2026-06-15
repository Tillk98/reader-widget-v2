import React, { useCallback, useRef, useState } from 'react';
import { GripVertical, Trash2, Plus, Languages, ChevronRight } from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import './DictionaryMenuSheet.css';

const ICON_STROKE = 2;

export interface DictionaryMenuItem {
  id: string;
  label: string;
}

export interface DictionaryMenuSheetProps {
  open: boolean;
  onClose: () => void;
  /** Enabled dictionaries (shown in the horizontal strip); order is editable here. */
  active: DictionaryMenuItem[];
  /** Dictionaries available to add. */
  more: DictionaryMenuItem[];
  /** Move an active dictionary from one index to another (reorder). */
  onReorder: (from: number, to: number) => void;
  /** Remove an active dictionary. */
  onRemove: (id: string) => void;
  /** Add an available dictionary. */
  onAdd: (id: string) => void;
  /** Current dictionary language (UI only — not yet functional). */
  language?: string;
  onChangeLanguage?: () => void;
}

export const DictionaryMenuSheet: React.FC<DictionaryMenuSheetProps> = ({
  open,
  onClose,
  active,
  more,
  onReorder,
  onRemove,
  onAdd,
  language = 'English',
  onChangeLanguage,
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  const dragFrom = useRef<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  /** Id of the active-dictionary item whose delete panel is currently revealed (swipe-left). */
  const [revealedDeleteId, setRevealedDeleteId] = useState<string | null>(null);
  const swipeStart = useRef<{ x: number; id: string } | null>(null);

  const handleGripDown = useCallback((e: React.PointerEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    dragFrom.current = index;
    setDraggingIndex(index);
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const handleGripMove = useCallback(
    (e: React.PointerEvent) => {
      if (dragFrom.current === null || !listRef.current) return;
      const rows = Array.from(
        listRef.current.querySelectorAll<HTMLElement>('[data-dict-row]')
      );
      const y = e.clientY;
      let target = rows.length - 1;
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i].getBoundingClientRect();
        if (y < r.top + r.height / 2) {
          target = i;
          break;
        }
      }
      if (target !== dragFrom.current) {
        onReorder(dragFrom.current, target);
        dragFrom.current = target;
        setDraggingIndex(target);
      }
    },
    [onReorder]
  );

  const handleGripUp = useCallback((e: React.PointerEvent) => {
    dragFrom.current = null;
    setDraggingIndex(null);
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
  }, []);

  const handleDictItemPointerDown = useCallback((e: React.PointerEvent, id: string) => {
    if ((e.target as HTMLElement).closest('.dictionary-menu__grip')) return;
    swipeStart.current = { x: e.clientX, id };
    if (revealedDeleteId !== null && revealedDeleteId !== id) {
      setRevealedDeleteId(null);
    }
  }, [revealedDeleteId]);

  const handleDictItemPointerUp = useCallback((e: React.PointerEvent, id: string) => {
    if (!swipeStart.current || swipeStart.current.id !== id) return;
    const dx = e.clientX - swipeStart.current.x;
    if (dx < -30) setRevealedDeleteId(id);
    else if (dx > 10) setRevealedDeleteId(null);
    swipeStart.current = null;
  }, []);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabel="Manage your dictionaries"
      className="dictionary-menu-sheet"
    >
      <div className="dictionary-menu">

        {/* YOUR DICTIONARIES */}
        <section className="dictionary-menu__section">
          <p className="dictionary-menu__section-header">Your Dictionaries</p>
          <div className="dictionary-menu__card" ref={listRef}>
            {active.map((d, i) => (
              <React.Fragment key={d.id}>
                {i > 0 && <div className="dictionary-menu__row-divider" aria-hidden />}
                <div
                  data-dict-row
                  className={[
                    'dictionary-menu__dict-item',
                    draggingIndex === i && 'dictionary-menu__dict-item--dragging',
                    revealedDeleteId === d.id && 'dictionary-menu__dict-item--revealed',
                  ].filter(Boolean).join(' ')}
                  onPointerDown={(e) => handleDictItemPointerDown(e, d.id)}
                  onPointerUp={(e) => handleDictItemPointerUp(e, d.id)}
                >
                  <div className="dictionary-menu__item-content">
                    <span className="dictionary-menu__item-text">{d.label}</span>
                    <span
                      className="dictionary-menu__grip"
                      role="button"
                      aria-label={`Reorder ${d.label}`}
                      tabIndex={-1}
                      onPointerDown={(e) => handleGripDown(e, i)}
                      onPointerMove={handleGripMove}
                      onPointerUp={handleGripUp}
                      onPointerCancel={handleGripUp}
                    >
                      <GripVertical size={14} strokeWidth={ICON_STROKE} aria-hidden />
                    </span>
                  </div>
                  <div className="dictionary-menu__delete-wrap">
                    <button
                      type="button"
                      className="dictionary-menu__delete"
                      aria-label={`Remove ${d.label}`}
                      onClick={() => { onRemove(d.id); setRevealedDeleteId(null); }}
                    >
                      <Trash2 size={12} strokeWidth={ICON_STROKE} aria-hidden />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </section>

        {/* MORE DICTIONARIES */}
        <section className="dictionary-menu__section">
          <p className="dictionary-menu__section-header">More Dictionaries</p>
          <div className="dictionary-menu__card">
            {more.map((d, i) => (
              <React.Fragment key={d.id}>
                {i > 0 && <div className="dictionary-menu__row-divider" aria-hidden />}
                <div className="dictionary-menu__dict-item">
                  <div className="dictionary-menu__item-content">
                    <span className="dictionary-menu__item-text">{d.label}</span>
                    <button
                      type="button"
                      className="dictionary-menu__action dictionary-menu__action--add"
                      aria-label={`Add ${d.label}`}
                      onClick={() => onAdd(d.id)}
                    >
                      <Plus size={14} strokeWidth={ICON_STROKE} aria-hidden />
                    </button>
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </section>

        {/* LANGUAGE */}
        <section className="dictionary-menu__section dictionary-menu__section--footer">
          <button
            type="button"
            className="dictionary-menu__item dictionary-menu__item--button"
            onClick={onChangeLanguage}
          >
            <span className="dictionary-menu__label">
              <Languages size={16} strokeWidth={ICON_STROKE} className="dictionary-menu__item-icon" aria-hidden />
              <span className="dictionary-menu__item-text">Language</span>
            </span>
            <span className="dictionary-menu__value">
              {language}
              <ChevronRight size={16} strokeWidth={ICON_STROKE} aria-hidden />
            </span>
          </button>
        </section>

      </div>
    </BottomSheet>
  );
};
