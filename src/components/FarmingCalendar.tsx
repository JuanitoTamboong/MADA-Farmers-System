import { useState } from "react";
import PageLayout from "../shared/PageLayout";
import "../css/FarmingCalendar.css";

interface FarmingCalendarProps {
  onBack?: () => void;
  onNavigate?: (screen: string) => void;
}

export default function FarmingCalendar({ onBack, onNavigate }: FarmingCalendarProps) {
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

        {/* HEADER */}
        <header className="calendar-header">
          <button type="button" className="calendar-back-btn" onClick={onBack}>
            ‹
          </button>
          <h1>Farming Calendar</h1>
        </header>

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

            <div className="calendar-task-item">
              <div className="task-icon-circle green-bg">
                🌱
              </div>
              <div className="task-info">
                <h4>Irrigation</h4>
                <p>Check water level</p>
                <span className="task-time">8:00 AM</span>
              </div>
            </div>

            <div className="task-divider" />

            <div className="calendar-task-item">
              <div className="task-icon-circle yellow-bg">
                🐛
              </div>
              <div className="task-info">
                <h4>Pest Monitoring</h4>
                <p>Inspect for pests/diseases</p>
                <span className="task-time">10:00 AM</span>
              </div>
            </div>

            <div className="task-divider" />

            <div className="calendar-task-item">
              <div className="task-icon-circle red-bg">
                🚜
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
              🌿
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