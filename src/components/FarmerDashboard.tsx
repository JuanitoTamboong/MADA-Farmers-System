import "../css/FarmerDashboard.css";
import PageLayout from "../shared/PageLayout";
import farmImage from "../assets/images/farm.jfif";
import farmerAvatar from "../assets/images/mada-dashboard.png";

interface FarmerDashboardProps {
  onLogout?: () => void;
  onNavigate?: (screen: string) => void;
}

function FarmerDashboard({ onLogout, onNavigate }: FarmerDashboardProps) {
  return (
    <PageLayout>
      <div className="dashboard-content">

        {/* HEADER SECTION */}
        <header className="dashboard-header">
          <div className="user-greeting">
            <span className="greeting-sub">Good morning,</span>
            <h1 className="user-name">
              Juanito <span className="wave-emoji">👋</span>
            </h1>
            <p className="location-tag">
              <svg className="location-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              Odiongan, Romblon
            </p>
          </div>

          <div className="header-illustration" onClick={onLogout} title="Click to Logout">
            <img src={farmerAvatar} alt="Farmer Header" className="illustration-img" />
          </div>
        </header>

        {/* WEATHER CARD */}
        <section className="weather-card">
          <div className="weather-main">
            <div className="weather-status-icon">
              <svg viewBox="0 0 24 24" fill="none" width="32" height="32">
                <circle cx="12" cy="10" r="4" fill="#F59E0B" />
                <path d="M6 16.5C6 14.57 7.57 13 9.5 13C10.23 13 10.91 13.23 11.47 13.62C12.27 12.63 13.51 12 14.9 12C17.33 12 19.3 13.97 19.3 16.4C19.3 16.6 19.28 16.8 19.25 17H6.25C6.09 16.85 6 16.68 6 16.5Z" fill="#E2E8F0" />
              </svg>
            </div>
            <div className="weather-info">
              <h2 className="weather-temp">28°C</h2>
              <span className="weather-desc">Partly Cloudy</span>
            </div>
          </div>
          <div className="weather-highlow">
            <div>H: 30°</div>
            <div>L: 24°</div>
          </div>
        </section>

        {/* MY FARMS BANNER */}
        <section 
          className="my-farms-banner" 
          onClick={() => onNavigate && onNavigate("farms")} 
          style={{ cursor: "pointer" }}
        >
          <img src={farmImage} alt="Farm" className="farms-bg" />
          <div className="farms-overlay"></div>
          <div className="farms-info">
            <h3>My Farms</h3>
            <p>2 Farms • 4.5 ha total</p>
          </div>
          <button className="farms-arrow" aria-label="View Farms">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </section>

        {/* ACTION GRID */}
        <section className="action-grid">
          {/* Crop Health */}
          <button className="grid-item">
            <div className="grid-icon-box">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#1B4D2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22V12" />
                <path d="M12 12C12 7.5 15.5 4 20 4C20 8.5 16.5 12 12 12Z" />
                <path d="M12 16C12 13 9.5 10.5 6.5 10.5C6.5 13.5 9 16 12 16Z" />
              </svg>
            </div>
            <span>Crop Health</span>
          </button>

          {/* Expenses */}
          <button className="grid-item">
            <div className="grid-icon-box">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#1B4D2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L18 2L20 7L4 7L6 2Z" />
                <path d="M4 7C4 7 3 14 3 17C3 19.2 4.8 21 7 21H17C19.2 21 21 19.2 21 17C21 14 20 7 20 7" />
                <circle cx="12" cy="14" r="2" />
              </svg>
            </div>
            <span>Expenses</span>
          </button>

          {/* Market Prices */}
          <button className="grid-item">
            <div className="grid-icon-box">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#1B4D2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6V20C3 20.5 3.5 21 4 21H20C20.5 21 21 20.5 21 20V6L18 2H6Z" />
                <path d="M3 6H21" />
                <path d="M16 10C16 12.2 14.2 14 12 14C9.8 14 8 12.2 8 10" />
              </svg>
            </div>
            <span>Market Prices</span>
          </button>

          {/* Calendar */}
          <button className="grid-item">
            <div className="grid-icon-box">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#1B4D2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="3" />
                <path d="M16 2V6" />
                <path d="M8 2V6" />
                <path d="M3 10H21" />
                <rect x="7" y="14" width="3" height="3" fill="#1B4D2E" />
              </svg>
            </div>
            <span>Calendar</span>
          </button>

          {/* Announcements */}
          <button className="grid-item">
            <div className="grid-icon-box">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#1B4D2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15V6C21 4.9 20.1 4 19 4H5C3.9 4 3 4.9 3 6V15C3 16.1 3.9 17 5 17H7V21L11 17H19C20.1 17 21 16.1 21 15Z" />
                <path d="M12 8V11" />
                <path d="M12 13H12.01" />
              </svg>
            </div>
            <span>Announcements</span>
          </button>

          {/* Assistance */}
          <button className="grid-item">
            <div className="grid-icon-box">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#1B4D2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" />
                <circle cx="12" cy="9" r="2.5" fill="#1B4D2E" />
              </svg>
            </div>
            <span>Assistance</span>
          </button>
        </section>

        {/* UPCOMING TASKS */}
        <section className="upcoming-section">
          <div className="section-header">
            <h3>Upcoming Tasks</h3>
            <a href="#view-all" className="view-all-link">View All</a>
          </div>

          <div className="task-card">
            <div className="task-icon-wrapper">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#1B4D2E" strokeWidth="2">
                <path d="M12 22V12" />
                <path d="M12 12C12 7.5 15.5 4 20 4C20 8.5 16.5 12 12 12Z" />
                <path d="M12 16C12 13 9.5 10.5 6.5 10.5C6.5 13.5 9 16 12 16Z" />
              </svg>
            </div>
            <div className="task-details">
              <h4>Fertilizer Application</h4>
              <p>Tomorrow • 7:00 AM</p>
            </div>
          </div>
        </section>

        {/* BOTTOM NAVIGATION BAR */}
        <nav className="bottom-nav">
          <button className="nav-item active" onClick={() => onNavigate && onNavigate("dashboard")}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
            <span>Home</span>
          </button>

          <button className="nav-item" onClick={() => onNavigate && onNavigate("farms")}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22V12" />
              <path d="M12 12C12 7.5 15.5 4 20 4C20 8.5 16.5 12 12 12Z" />
              <path d="M12 16C12 13 9.5 10.5 6.5 10.5C6.5 13.5 9 16 12 16Z" />
            </svg>
            <span>Farm</span>
          </button>

          <button className="nav-item">
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            <span>Tasks</span>
          </button>

          <button className="nav-item">
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>Profile</span>
          </button>
        </nav>

      </div>
    </PageLayout>
  );
}

export default FarmerDashboard;