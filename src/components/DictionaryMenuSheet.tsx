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

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabel="Manage your dictionaries"
      className="dictionary-menu-sheet"
    >
      <div className="dictionary-menu">
        <section className="dictionary-menu__section">
          <p className="dictionary-menu__section-header">Your Dictionaries</p>
          <div className="dictionary-menu__list" ref={listRef}>
            {active.map((d, i) => (
              <div
                key={d.id}
                data-dict-row
                className={`dictionary-menu__item${
                  draggingIndex === i ? ' dictionary-menu__item--dragging' : ''
                }`}
              >
                <span className="dictionary-menu__label">
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
                    <GripVertical size={16} strokeWidth={ICON_STROKE} aria-hidden />
                  </span>
                  <span className="dictionary-menu__item-text">{d.label}</span>
                </span>
                <button
                  type="button"
                  className="dictionary-menu__action dictionary-menu__action--remove"
                  aria-label={`Remove ${d.label}`}
                  onClick={() => onRemove(d.id)}
                >
                  <Trash2 size={15} strokeWidth={ICON_STROKE} aria-hidden />
                </button>
              </div>
            ))}
          </div>
        </section>

        <div className="dictionary-menu__divider" aria-hidden />

        <section className="dictionary-menu__section">
          <p className="dictionary-menu__section-header">More Dictionaries</p>
          {more.map((d) => (
            <div key={d.id} className="dictionary-menu__item">
              <span className="dictionary-menu__label">
                <span className="dictionary-menu__item-text">{d.label}</span>
              </span>
              <button
                type="button"
                className="dictionary-menu__action dictionary-menu__action--add"
                aria-label={`Add ${d.label}`}
                onClick={() => onAdd(d.id)}
              >
                <Plus size={15} strokeWidth={ICON_STROKE} aria-hidden />
              </button>
            </div>
          ))}
        </section>

        <div className="dictionary-menu__divider" aria-hidden />

        <section className="dictionary-menu__section">
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
