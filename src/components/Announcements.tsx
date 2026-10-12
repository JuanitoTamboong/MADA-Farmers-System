import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PageLayout from '../shared/PageLayout';
import PageHeader from '../shared/PageHeader';
import '../css/Announcements.css';

import { fetchPublishedAnnouncements } from '../ts/announcement';
import type {
  Announcement,
  AnnouncementCategory,
} from '../ts/announcement';

interface AnnouncementsProps {
  onNavigate?: (screen: string) => void;
}

// Farmer-facing filter — real DB categories plus "All"
type CategoryFilter = 'All' | AnnouncementCategory;

const categories: CategoryFilter[] = [
  'All',
  'Request',
  'Training',
  'Distribution Schedule',
  'Weather Advisory',
  'General',
];

// Map each DB category → its visual style
interface CategoryStyle {
  cardColor: string;
  iconBg: string;
  iconSvg: React.ReactNode;
}

function styleForCategory(category: AnnouncementCategory): CategoryStyle {
  switch (category) {
    case 'Request':
      return {
        cardColor: 'green-tint',
        iconBg: '#bbf7d0',
        iconSvg: (
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="#15803d"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22V12" />
            <path d="M12 12C12 7.5 15.5 4 20 4C20 8.5 16.5 12 12 12Z" />
            <path d="M12 16C12 13 9.5 10.5 6.5 10.5C6.5 13.5 9 16 12 16Z" />
          </svg>
        ),
      };

    case 'Training':
      return {
        cardColor: 'blue-tint',
        iconBg: '#bfdbfe',
        iconSvg: (
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="#1d4ed8"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            <path d="M6 6h10" />
            <path d="M6 10h10" />
          </svg>
        ),
      };

    case 'Distribution Schedule':
      return {
        cardColor: 'orange-tint',
        iconBg: '#fef08a',
        iconSvg: (
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="#a16207"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
            <path d="m3.3 7 8.7 5 8.7-5" />
            <path d="M12 22V12" />
          </svg>
        ),
      };

    case 'Weather Advisory':
      return {
        cardColor: 'amber-tint',
        iconBg: '#fde68a',
        iconSvg: (
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="#b45309"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2v2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="M20 12h2" />
            <path d="m19.07 4.93-1.41 1.41" />
            <path d="M15.947 12.65a4 4 0 0 0-5.925-4.128" />
            <path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z" />
          </svg>
        ),
      };

    case 'General':
    default:
      return {
        cardColor: 'purple-tint',
        iconBg: '#e9d5ff',
        iconSvg: (
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="#7e22ce"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 11v3a1 1 0 0 0 1 1h2l4 4V6L6 10H4a1 1 0 0 0-1 1Z" />
            <path d="M16 8a5 5 0 0 1 0 8" />
            <path d="M19 5a9 9 0 0 1 0 14" />
          </svg>
        ),
      };
  }
}

function formatDisplayDate(value: string): string {
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function Announcements({ onNavigate }: AnnouncementsProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('All');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);
  const [closingAnnouncement, setClosingAnnouncement] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const closeAnnouncement = useCallback(() => {
    if (!selectedAnnouncement || closingAnnouncement) return;
    setClosingAnnouncement(true);
    closeTimer.current = window.setTimeout(() => {
      setSelectedAnnouncement(null);
      setClosingAnnouncement(false);
      closeTimer.current = null;
    }, 200);
  }, [closingAnnouncement, selectedAnnouncement]);

  const openAnnouncement = (announcement: Announcement) => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setClosingAnnouncement(false);
    setSelectedAnnouncement(announcement);
  };

  useEffect(
    () => () => {
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    },
    [],
  );

  // Fetch published + non-expired announcements from Supabase
  useEffect(() => {
    let alive = true;

    fetchPublishedAnnouncements()
      .then((data) => {
        if (!alive) return;
        setAnnouncements(data);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err instanceof Error ? err.message : 'Failed to load.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedAnnouncement) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeAnnouncement();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [closeAnnouncement, selectedAnnouncement]);

  const filteredAnnouncements = useMemo(
    () =>
      activeCategory === 'All'
        ? announcements
        : announcements.filter((a) => a.category === activeCategory),
    [announcements, activeCategory],
  );

  return (
    <PageLayout
      activeTab="Home"
      onNavigate={onNavigate}
      hideNav
      loading={loading}
      loadingText="Loading announcements..."
    >
      <div className="announcements-container">
        <PageHeader
          title="Announcements"
          onBack={() => onNavigate?.('Home')}
        />

        {/* Category tabs */}
        <div className="category-scroll-wrapper">
          <div className="category-tabs">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`category-tab ${
                  activeCategory === cat ? 'active' : ''
                }`}
                onClick={() => setActiveCategory(cat)}
                type="button"
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Announcement cards */}
        <div className="announcement-list">
          {!loading && error && (
            <p className="announcement-empty announcement-empty--error">
              {error}
            </p>
          )}

          {!loading && !error && filteredAnnouncements.length === 0 && (
            <p className="announcement-empty">
              {announcements.length === 0
                ? 'No announcements yet.'
                : 'No announcements match this category.'}
            </p>
          )}

          {!loading &&
            !error &&
            filteredAnnouncements.map((item) => {
              const style = styleForCategory(item.category);
              return (
                <div
                  key={item.id}
                  className={`announcement-card ${style.cardColor}`}
                  onClick={() => openAnnouncement(item)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      openAnnouncement(item);
                    }
                  }}
                  aria-haspopup="dialog"
                  aria-label={`View announcement: ${item.title}`}
                  role="button"
                  tabIndex={0}
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="announcement-cover-image"
                      loading="lazy"
                    />
                  ) : (
                    <div
                      className="announcement-icon-circle"
                      style={{ backgroundColor: style.iconBg }}
                    >
                      {style.iconSvg}
                    </div>
                  )}

                  <div className="announcement-content">
                    <h3 className="announcement-card-title">{item.title}</h3>
                    <p className="announcement-subtitle">{item.summary}</p>
                    <p className="announcement-meta-date">
                      {formatDisplayDate(item.publishDate)}
                    </p>
                    <p className="announcement-meta-location">
                      {item.location}
                    </p>
                  </div>

                  <div className="announcement-arrow">
                    <svg
                      viewBox="0 0 24 24"
                      width="16"
                      height="16"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              );
            })}
        </div>

        {selectedAnnouncement && (
          <div
            className={`announcement-dialog-backdrop${closingAnnouncement ? ' is-closing' : ''}`}
            onClick={closeAnnouncement}
          >
            <section
              className={`announcement-dialog${closingAnnouncement ? ' is-closing' : ''}`}
              role="dialog"
              aria-modal="true"
              aria-labelledby="announcement-dialog-title"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className="announcement-dialog-close"
                onClick={closeAnnouncement}
                aria-label="Close announcement"
                autoFocus
              >
                &times;
              </button>
              {selectedAnnouncement.imageUrl && (
                <img
                  src={selectedAnnouncement.imageUrl}
                  alt=""
                  className="announcement-dialog-image"
                />
              )}
              <p className="announcement-dialog-category">
                {selectedAnnouncement.category}
              </p>
              <h2 id="announcement-dialog-title">
                {selectedAnnouncement.title}
              </h2>
              <p className="announcement-dialog-date">
                Published {formatDisplayDate(selectedAnnouncement.publishDate)}
                {selectedAnnouncement.expiryDate &&
                  ` · Expires ${formatDisplayDate(selectedAnnouncement.expiryDate)}`}
              </p>
              <p className="announcement-dialog-summary">
                {selectedAnnouncement.summary}
              </p>
              {selectedAnnouncement.instructions && (
                <div className="announcement-dialog-section">
                  <h3>Details</h3>
                  <p>{selectedAnnouncement.instructions}</p>
                </div>
              )}
              {selectedAnnouncement.location && (
                <div className="announcement-dialog-section">
                  <h3>Location</h3>
                  <p>{selectedAnnouncement.location}</p>
                </div>
              )}
              {selectedAnnouncement.audience && (
                <div className="announcement-dialog-section">
                  <h3>For</h3>
                  <p>{selectedAnnouncement.audience}</p>
                </div>
              )}
              {selectedAnnouncement.contact && (
                <div className="announcement-dialog-section">
                  <h3>Contact</h3>
                  <p>{selectedAnnouncement.contact}</p>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </PageLayout>
  );
}

export default Announcements;