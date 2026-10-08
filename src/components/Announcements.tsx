import React, { useState } from "react";
import PageLayout from "../shared/PageLayout";
import PageHeader from "../shared/PageHeader";
import "../css/Announcements.css";

interface AnnouncementsProps {
  onNavigate?: (screen: string) => void;
}

type CategoryFilter = "All" | "Assistance" | "Training" | "Others";

interface AnnouncementItem {
  id: string;
  title: string;
  subtitle?: string;
  date: string;
  location: string;
  category: CategoryFilter;
  cardColor: string; // Background tint class
  iconBg: string;
  iconSvg: React.ReactNode;
}

const announcementData: AnnouncementItem[] = [
  {
    id: "1",
    title: "Free Seeds Distribution",
    date: "October 15, 2025",
    location: "Municipal Agriculture Office",
    category: "Assistance",
    cardColor: "green-tint",
    iconBg: "#bbf7d0",
    iconSvg: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22V12" />
        <path d="M12 12C12 7.5 15.5 4 20 4C20 8.5 16.5 12 12 12Z" />
        <path d="M12 16C12 13 9.5 10.5 6.5 10.5C6.5 13.5 9 16 12 16Z" />
      </svg>
    ),
  },
  {
    id: "2",
    title: "Fertilizer Distribution",
    date: "October 20, 2025",
    location: "Brgy. Hall",
    category: "Assistance",
    cardColor: "orange-tint",
    iconBg: "#fef08a",
    iconSvg: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#a16207" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="m3.3 7 8.7 5 8.7-5" />
        <path d="M12 22V12" />
      </svg>
    ),
  },
  {
    id: "3",
    title: "Agricultural Training",
    subtitle: "Sustainable Farming Practices",
    date: "October 25, 2025",
    location: "Municipal Agriculture Office",
    category: "Training",
    cardColor: "blue-tint",
    iconBg: "#bfdbfe",
    iconSvg: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
        <path d="M6 6h10" />
        <path d="M6 10h10" />
      </svg>
    ),
  },
  {
    id: "4",
    title: "Farmer Registration",
    date: "October 30, 2025",
    location: "Municipal Agriculture Office",
    category: "Others",
    cardColor: "purple-tint",
    iconBg: "#e9d5ff",
    iconSvg: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#7e22ce" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M19 8v6" />
        <path d="M22 11h-6" />
      </svg>
    ),
  },
];

const categories: CategoryFilter[] = ["All", "Assistance", "Training", "Others"];

function Announcements({ onNavigate }: AnnouncementsProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("All");

  const filteredAnnouncements =
    activeCategory === "All"
      ? announcementData
      : announcementData.filter((item) => item.category === activeCategory);

  return (
    <PageLayout activeTab="Home" onNavigate={onNavigate} hideNav>
      <div className="announcements-container">

        <PageHeader
          title="Announcements"
          onBack={() => onNavigate?.("Home")}
        />

        {/* Categories Horizontal Scroll */}
        <div className="category-scroll-wrapper">
          <div className="category-tabs">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`category-tab ${activeCategory === cat ? "active" : ""}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Announcement Cards List */}
        <div className="announcement-list">
          {filteredAnnouncements.map((item) => (
            <div key={item.id} className={`announcement-card ${item.cardColor}`}>
              <div
                className="announcement-icon-circle"
                style={{ backgroundColor: item.iconBg }}
              >
                {item.iconSvg}
              </div>

              <div className="announcement-content">
                <h3 className="announcement-card-title">{item.title}</h3>
                {item.subtitle && (
                  <p className="announcement-subtitle">{item.subtitle}</p>
                )}
                <p className="announcement-meta-date">{item.date}</p>
                <p className="announcement-meta-location">{item.location}</p>
              </div>

              <div className="announcement-arrow">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>

      </div>
    </PageLayout>
  );
}

export default Announcements;