import React from 'react';
import './Menu.css';

export interface MenuProps {
  /** Optional caption above the rounded container, e.g. "PAGE MODE". */
  label?: string;
  children: React.ReactNode;
}

/**
 * Menu (Figma Menu 4042:13136) — optional caption + rounded white container
 * holding MenuItems with hairline dividers between them.
 */
export const Menu: React.FC<MenuProps> = ({ label, children }) => {
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <section className="ui-menu-section">
      {label != null && (
        <div className="ui-menu-section__header">
          <span className="ui-menu-section__label">{label}</span>
        </div>
      )}
      <div className="ui-menu">
        {items.map((child, i) => (
          <React.Fragment key={i}>
            {i > 0 && <div className="ui-menu__divider" aria-hidden />}
            {child}
          </React.Fragment>
        ))}
      </div>
    </section>
  );
};
