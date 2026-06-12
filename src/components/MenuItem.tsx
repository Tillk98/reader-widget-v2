import React from 'react';
import { Info, ChevronsUpDown } from 'lucide-react';
import './MenuItem.css';

export interface MenuItemProps {
  /** Leading icon (16px). */
  icon?: React.ReactNode;
  label: string;
  /** Renders an info icon directly after the label (Figma showInfoIcon). */
  info?: boolean;
  /** Persistent selected highlight (Figma Focus state — #f1f7fe). */
  selected?: boolean;
  /** Trailing value picker text (renders value + chevrons-up-down). Pair with `onClick` to cycle. */
  value?: string;
  /** Decorative trailing content (link text, "+" pill, tag). Ignored when `toggle`/`value` is set. */
  trailing?: React.ReactNode;
  /** Action row — the whole row is a button. */
  onClick?: () => void;
  /** When defined, the row becomes a switch with a trailing toggle track. */
  toggle?: boolean;
  onToggle?: (next: boolean) => void;
}

/** Menu row (Figma MenuItem 4042:12086) — icon + label + optional trailing control. */
export const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  label,
  info = false,
  selected = false,
  value,
  trailing,
  onClick,
  toggle,
  onToggle,
}) => {
  const isToggle = toggle !== undefined;
  const className = `ui-menu-item${selected ? ' ui-menu-item--selected' : ''}`;

  const inner = (
    <span className="ui-menu-item__content">
      <span className="ui-menu-item__label">
        {icon != null && <span className="ui-menu-item__icon">{icon}</span>}
        <span className="ui-menu-item__text">{label}</span>
        {info && (
          <span className="ui-menu-item__info" aria-hidden>
            <Info size={16} />
          </span>
        )}
      </span>
      {isToggle ? (
        <span className={`ui-menu-toggle${toggle ? ' ui-menu-toggle--on' : ''}`} aria-hidden>
          <span className="ui-menu-toggle__knob" />
        </span>
      ) : value != null ? (
        <span className="ui-menu-item__value">
          {value}
          <ChevronsUpDown size={16} aria-hidden />
        </span>
      ) : (
        trailing != null && <span className="ui-menu-item__trailing">{trailing}</span>
      )}
    </span>
  );

  if (isToggle) {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={toggle}
        aria-label={label}
        className={`${className} ui-menu-item--button`}
        onClick={() => onToggle?.(!toggle)}
      >
        {inner}
      </button>
    );
  }

  if (onClick) {
    return (
      <button type="button" className={`${className} ui-menu-item--button`} onClick={onClick}>
        {inner}
      </button>
    );
  }

  return <div className={className}>{inner}</div>;
};
