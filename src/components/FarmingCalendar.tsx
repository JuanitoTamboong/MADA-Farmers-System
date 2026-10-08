import { useState } from "react";
import PageLayout from "../shared/PageLayout";
import PageHeader from "../shared/PageHeader";
import "../css/FarmingCalendar.css";

interface FarmingCalendarProps {
  onNavigate?: (screen: string) => void;
}

export default function FarmingCalendar({ onNavigate }: FarmingCalendarProps) {
  const [selectedDay, setSelectedDay] = useState(8);

  const days = [
    { dayName: "Sun", dayNum: 5 },
    { dayName: "Mon", dayNum: 6 },
    { dayName: "Tue", dayNum: 7 },
    { dayName: "Wed", dayNum: 8 },
    { dayName: "Thu", dayNum: 9 },
    { dayName: "Fri", dayNum: 10 },
    { dayName: "Sat", dayNum: 11 },
  ];

  return (
    <PageLayout activeTab="Tasks" onNavigate={onNavigate}>
      <div className="calendar-screen">

        <PageHeader title="Farming Calendar" align="left" />

        {/* MONTH SELECTOR */}
        <div className="month-selector">
          <button className="month-nav-btn">‹</button>
          <h2>October 2025</h2>
          <button className="month-nav-btn">›</button>
        </div>

        {/* WEEK VIEW */}
        <div className="week-grid">
          {days.map((d) => (
            <div
              key={d.dayNum}
              className={`week-day ${selectedDay === d.dayNum ? "active" : ""}`}
              onClick={() => setSelectedDay(d.dayNum)}
            >
              <span className="day-name">{d.dayName}</span>
              <span className="day-number">{d.dayNum}</span>
            </div>
          ))}
        </div>

        {/* TODAY'S TASKS */}
        <section className="tasks-section">
          <h3>Today's Tasks</h3>
          <div className="task-list-card">

            {/* Irrigation Item */}
            <div className="calendar-task-item">
              <div className="task-icon-circle green-bg">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="#1B4D2E">
                  <path d="M12 2C11.5 2 11 2.5 11 3V12C9 10 7 10 5 12C3 14 3 17 5.5 19.5C8 22 12 22 12 22C12 22 16 22 18.5 19.5C21 17 21 14 19 12C17 10 15 10 13 12V3C13 2.5 12.5 2 12 2Z" opacity="0.2" />
                  <path d="M12 3V21M12 21C12 21 7 19 7 14C7 11.5 9.5 9.5 12 12C14.5 9.5 17 11.5 17 14C17 19 12 21 12 21Z" stroke="#1B4D2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  <circle cx="12" cy="7" r="2.5" fill="#1B4D2E" />
                </svg>
              </div>
              <div className="task-info">
                <h4>Irrigation</h4>
                <p>Check water level</p>
                <span className="task-time">8:00 AM</span>
              </div>
            </div>

            <div className="task-divider" />

            {/* Pest Monitoring Item */}
            <div className="calendar-task-item">
              <div className="task-icon-circle yellow-bg">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 8V4M8 6l8 0" />
                  <rect x="7" y="8" width="10" height="12" rx="5" fill="#D97706" fillOpacity="0.2" />
                  <path d="M5 12h2M17 12h2M5 16h2M17 16h2" />
                </svg>
              </div>
              <div className="task-info">
                <h4>Pest Monitoring</h4>
                <p>Inspect for pests/diseases</p>
                <span className="task-time">10:00 AM</span>
              </div>
            </div>

            <div className="task-divider" />

            {/* Equipment Maintenance Item */}
            <div className="calendar-task-item">
              <div className="task-icon-circle red-bg">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" fill="#DC2626" fillOpacity="0.2" />
                </svg>
              </div>
              <div className="task-info">
                <h4>Equipment Maintenance</h4>
                <p>Check tractor/tools</p>
                <span className="task-time">3:00 PM</span>
              </div>
            </div>

          </div>
        </section>

        {/* UPCOMING */}
        <section className="upcoming-section">
          <h3>Upcoming</h3>
          <div className="upcoming-card">
            <div className="task-icon-circle mint-bg">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22V12" />
                <path d="M12 12C12 7.5 15.5 4 20 4C20 8.5 16.5 12 12 12Z" fill="#059669" fillOpacity="0.3" />
                <path d="M12 16C12 13 9.5 10.5 6.5 10.5C6.5 13.5 9 16 12 16Z" fill="#059669" fillOpacity="0.3" />
              </svg>
            </div>
            <div className="task-info">
              <h4>Fertilizer Application</h4>
              <p>Oct 10, 2025</p>
            </div>
          </div>
        </section>

      </div>
    </PageLayout>
  );
}