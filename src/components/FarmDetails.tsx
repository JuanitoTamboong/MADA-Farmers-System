import "../css/FarmDetails.css";
import PageLayout from "../shared/PageLayout";
import farmThumbnail from "../assets/images/farm.jfif";

interface FarmDetailsProps {
  farmId?: string;
  onBack: () => void;
  onNavigate?: (tab: string) => void;   // ← renamed from onNavClick
}

function FarmDetails({ onBack, onNavigate }: FarmDetailsProps) {
  return (
    <PageLayout activeTab="Farm" onNavigate={onNavigate}>
      <div className="details-content">

        {/* TOP BAR / BANNER HEADER */}
        <div className="details-banner-container">
          <img src={farmThumbnail} alt="Farm Header" className="banner-image" />
          <div className="banner-top-bar">
            <button className="icon-btn back-btn" onClick={onBack} aria-label="Go Back">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <h1 className="banner-title">Farm Details</h1>
            <button className="icon-btn option-btn" aria-label="Options">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="details-body">
          {/* TITLE & EDIT */}
          <div className="farm-header-row">
            <div>
              <h2 className="farm-name">San Jose Farm</h2>
              <p className="farm-location">
                <svg className="pin-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                Odiongan, Romblon
              </p>
            </div>
            <button className="edit-btn">Edit</button>
          </div>

          {/* STATS ROW */}
          <div className="stats-row">
            <div className="stat-col">
              <span className="stat-value">2.5 ha</span>
              <span className="stat-label">Area</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-col">
              <span className="stat-value">Rice</span>
              <span className="stat-label">Crop</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-col">
              <span className="stat-value">NSIC Rc 222</span>
              <span className="stat-label">Variety</span>
            </div>
          </div>

          {/* PLANTING & HARVEST SECTION */}
          <div className="section-container">
            <h3 className="section-title">Planting & Harvest</h3>
            <div className="date-cards-grid">
              <div className="date-card">
                <div className="date-icon-box">🌱</div>
                <div>
                  <span className="date-label">Planting Date</span>
                  <p className="date-val">Aug 15, 2025</p>
                </div>
              </div>

              <div className="date-card">
                <div className="date-icon-box">🌾</div>
                <div>
                  <span className="date-label">Expected Harvest</span>
                  <p className="date-val">Nov 25, 2025</p>
                </div>
              </div>
            </div>
          </div>

          {/* FARMING ACTIVITIES SECTION */}
          <div className="section-container">
            <h3 className="section-title">Farming Activities</h3>
            <div className="activities-list">
              <div className="activity-card completed">
                <div className="status-icon green-check">✓</div>
                <div className="activity-info">
                  <h4>Land Preparation</h4>
                  <p className="status-text text-green">Completed</p>
                </div>
              </div>

              <div className="activity-card completed">
                <div className="status-icon green-check">✓</div>
                <div className="activity-info">
                  <h4>Planting</h4>
                  <p className="status-text text-green">Completed</p>
                </div>
              </div>

              <div className="activity-card in-progress">
                <div className="status-icon orange-sprout">🌱</div>
                <div className="activity-info">
                  <h4>Fertilizer Application</h4>
                  <p className="status-text text-orange">In Progress</p>
                </div>
                <div className="activity-arrow">→</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </PageLayout>
  );
}

export default FarmDetails;