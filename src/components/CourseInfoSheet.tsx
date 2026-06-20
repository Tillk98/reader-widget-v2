import React, { useState } from 'react';
import {
  Heart,
  Check,
  Headphones,
  Flag,
  BookOpen,
  Play,
  ChevronUp,
  ChevronDown,
  Plus,
  EllipsisVertical,
  TextSearch,
} from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import './CourseInfoSheet.css';

const ICON_STROKE = 1.75;

const DEFAULT_DESCRIPTION =
  "L'observation seule ne prouve pas qu'une substance est dangereuse — les fumeurs partagent d'autres habitudes qui brouillent les données. La certitude scientifique exige des tests en laboratoire confirmant un lien de causalité. Face aux titres alarmistes, remontez à la source avant de vous inquiéter.";

interface LessonTile {
  id: string;
  course: string;
  title: string;
  completed?: boolean;
  progress?: number;
}

export interface CourseInfoSheetProps {
  open: boolean;
  onClose: () => void;
  courseTitle?: string;
  heroImageSrc?: string;
  lessonImageSrc?: string;
  description?: string;
  author?: string;
  lessonCourse?: string;
  lessonTitle?: string;
}

const LingQBadges: React.FC<{ green: string; blue: string }> = ({ green, blue }) => (
  <span className="course-info__lingq">
    <span className="course-info__lingq-bar course-info__lingq-bar--green" aria-hidden />
    <span className="course-info__tag-text">{green}</span>
    <span className="course-info__lingq-bar course-info__lingq-bar--blue" aria-hidden />
    <span className="course-info__tag-text">{blue}</span>
  </span>
);

export const CourseInfoSheet: React.FC<CourseInfoSheetProps> = ({
  open,
  onClose,
  courseTitle = 'La statistique expliquée à mon chat',
  heroImageSrc,
  lessonImageSrc,
  description = DEFAULT_DESCRIPTION,
  author = 'Till Kaeslin',
  lessonCourse = 'La statistique expliquée à mon chat',
  lessonTitle = 'Des Chats Meurent Pour La Science',
}) => {
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  const tiles: LessonTile[] = [
    { id: 'l1', course: lessonCourse, title: lessonTitle, completed: true },
    { id: 'l2', course: lessonCourse, title: lessonTitle, progress: 0.4 },
    { id: 'l3', course: lessonCourse, title: lessonTitle },
  ];

  return (
    <BottomSheet open={open} onClose={onClose} variant="full" showDragBar={false} ariaLabel="Course details" className="course-info-sheet">
      <div className="course-info">
        <div className="course-info__hero">
          {heroImageSrc ? <img className="course-info__hero-img" src={heroImageSrc} alt="" /> : null}
          <div className="course-info__hero-gradient" aria-hidden />
          <button
            type="button"
            className="course-info__handle"
            onClick={onClose}
            aria-label="Tap to close course details"
          />
          <div className="course-info__hero-content">
            <p className="course-info__hero-title">{courseTitle}</p>
            <div className="course-info__hero-actions">
              <button type="button" className="course-info__hero-btn" aria-label="Likes">
                <Heart size={16} strokeWidth={1.5} />
                <span>300</span>
              </button>
              <button
                type="button"
                className="course-info__hero-btn course-info__hero-btn--check"
                aria-label="Completed"
              >
                <Check size={16} strokeWidth={2.25} />
              </button>
            </div>
          </div>
        </div>

        <div className="course-info__scroll">
          <div className="course-info__meta">
            <span className="course-info__tag">
              <LingQBadges green="100" blue="500" />
            </span>
            <span className="course-info__tag">
              <Headphones size={16} strokeWidth={ICON_STROKE} className="course-info__tag-icon" aria-hidden />
              <span className="course-info__tag-text">2:10:05</span>
            </span>
            <span className="course-info__tag">
              <Flag size={16} strokeWidth={ICON_STROKE} className="course-info__tag-icon" aria-hidden />
              <span className="course-info__tag-text">Intermediate 2</span>
            </span>
            <span className="course-info__tag">
              <BookOpen size={16} strokeWidth={ICON_STROKE} className="course-info__tag-icon" aria-hidden />
              <span className="course-info__tag-text">32 Lessons</span>
            </span>
          </div>

          <div className="course-info__divider" role="separator" aria-hidden="true" />

          <button
            type="button"
            className="course-info__details"
            onClick={() => setDetailsExpanded(prev => !prev)}
            aria-expanded={detailsExpanded}
          >
            <div className="course-info__details-header">
              <span className="course-info__details-title">Course Details</span>
              <span className="course-info__attribution">
                <span className="course-info__avatar" aria-hidden>
                  {author
                    .split(' ')
                    .map(w => w[0])
                    .slice(0, 2)
                    .join('')}
                </span>
                <span className="course-info__attribution-name">{author}</span>
              </span>
              {detailsExpanded ? (
                <ChevronUp size={20} strokeWidth={ICON_STROKE} className="course-info__details-chevron" aria-hidden />
              ) : (
                <ChevronDown size={20} strokeWidth={ICON_STROKE} className="course-info__details-chevron" aria-hidden />
              )}
            </div>
            <p
              className={`course-info__description ${detailsExpanded ? 'course-info__description--expanded' : ''}`}
            >
              {description}
            </p>
          </button>

          <div className="course-info__cta">
            <button type="button" className="course-info__play">
              <Play size={24} strokeWidth={ICON_STROKE} />
              <span>Play Course Audio</span>
            </button>
          </div>

          <div className="course-info__divider course-info__divider--thin" role="separator" aria-hidden="true" />

          <div className="course-info__lessons">
            {tiles.map((tile, i) => (
              <React.Fragment key={tile.id}>
                {i > 0 && <div className="course-info__lesson-sep" aria-hidden />}
                <div
                  className={`course-info__lesson ${tile.completed ? 'course-info__lesson--active' : ''}`}
                >
                  <div className="course-info__lesson-head">
                    <div className="course-info__lesson-image">
                      {lessonImageSrc ? <img src={lessonImageSrc} alt="" /> : null}
                    </div>
                    <div className="course-info__lesson-meta">
                      <div className="course-info__lesson-row">
                        <div className="course-info__lesson-info">
                          <p className="course-info__lesson-course">{tile.course}</p>
                          <p className="course-info__lesson-title">{tile.title}</p>
                        </div>
                        <div className="course-info__lesson-actions">
                          <button
                            type="button"
                            className={`course-info__round-btn ${tile.completed ? 'course-info__round-btn--done' : ''}`}
                            aria-label={tile.completed ? 'Completed' : 'Add lesson'}
                          >
                            {tile.completed ? (
                              <Check size={16} strokeWidth={2.25} />
                            ) : (
                              <Plus size={16} strokeWidth={ICON_STROKE} />
                            )}
                          </button>
                          <button type="button" className="course-info__round-btn course-info__round-btn--ghost" aria-label="More options">
                            <EllipsisVertical size={16} strokeWidth={ICON_STROKE} />
                          </button>
                        </div>
                      </div>
                      <div className="course-info__lesson-progress">
                        <span
                          className="course-info__lesson-progress-fill"
                          style={{ width: `${Math.round((tile.progress ?? 0) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="course-info__lesson-tags">
                    <span className="course-info__tag">
                      <TextSearch size={16} strokeWidth={ICON_STROKE} className="course-info__tag-icon" aria-hidden />
                      <span className="course-info__tag-text">55% New Words</span>
                    </span>
                    <span className="course-info__tag">
                      <LingQBadges green="25" blue="100" />
                    </span>
                    <span className="course-info__tag">
                      <Headphones size={16} strokeWidth={ICON_STROKE} className="course-info__tag-icon" aria-hidden />
                      <span className="course-info__tag-text">2:10:05</span>
                    </span>
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </BottomSheet>
  );
};
