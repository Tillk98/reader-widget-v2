import React from 'react';
import './LessonHeader.css';

export interface LessonHeaderProps {
  title?: string;
  source?: string;
  /** Lesson position within course, e.g. "1/5". */
  pageLabel?: string;
  imageSrc?: string;
  /** Tapping the header opens the course info. */
  onClick?: () => void;
}

/**
 * Lesson header card (Figma LessonHeader 4042:15342 / 4042:17935) — grey rounded box
 * with the lesson thumbnail, title and course/page, sitting under the sheet drag bar.
 */
export const LessonHeader: React.FC<LessonHeaderProps> = ({
  title,
  source,
  pageLabel,
  imageSrc,
  onClick,
}) => (
  <div className="lesson-header">
    <button type="button" className="lesson-header__box" onClick={onClick} aria-label="Open course details">
      <span className="lesson-header__image">
        {imageSrc ? <img src={imageSrc} alt="" /> : null}
      </span>
      <span className="lesson-header__meta">
        {title ? <span className="lesson-header__title">{title}</span> : null}
        <span className="lesson-header__course">
          {source ? <span className="lesson-header__course-name">{source}</span> : null}
          {pageLabel ? <span className="lesson-header__page">({pageLabel})</span> : null}
        </span>
      </span>
    </button>
  </div>
);
