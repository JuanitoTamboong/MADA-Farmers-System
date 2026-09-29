import React, { useState } from "react";
import PageLayout from "../shared/PageLayout";
import cropBanner from "../assets/images/farm2.jpg";
import "../css/CropHealth.css";

interface CropHealthProps {
  onNavigate?: (screen: string) => void;
}

export default function CropHealth({ onNavigate }: CropHealthProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(cropBanner);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(URL.createObjectURL(file));
    }
  };

  return (
    <PageLayout activeTab="Home" onNavigate={onNavigate} hideNav>
      <div className="crop-health-container">
        
        {/* TOP NAVIGATION BAR */}
        <header className="crop-health-header">
          <button 
            className="back-btn" 
            onClick={() => onNavigate?.("Home")}
            aria-label="Go Back"
          >
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h2>Pest & Disease Report</h2>
        </header>

        {/* IMAGE PREVIEW HERO */}
        <div className="crop-banner-wrapper">
          <img 
            src={selectedImage || "https://via.placeholder.com/400x160"} 
            alt="Crop sample" 
            className="crop-banner-img" 
          />
        </div>

        {/* PHOTO ACTION BUTTONS */}
        <div className="upload-actions">
          <label className="take-photo-btn">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            Take Photo
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              onChange={handleImageUpload} 
              style={{ display: "none" }} 
            />
          </label>
          
          <label className="upload-gallery-link">
            or Upload from Gallery
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageUpload} 
              style={{ display: "none" }} 
            />
          </label>
        </div>

        {/* AI DETECTION RESULT CARD */}
        <div className="ai-detection-section">
          <div className="section-title">
            <span>AI Detection</span>
            <span className="optional-tag">(Optional)</span>
          </div>

          <div className="detection-card">
            {/* CARD TOP INFO */}
            <div className="disease-header">
              <div className="disease-thumb-wrapper">
                <img src={selectedImage || ""} alt="Disease sample" className="disease-thumb" />
              </div>
              <div className="disease-title-area">
                <span className="disease-sub">Possible Disease</span>
                <h3 className="disease-name">Rice Blast</h3>
              </div>
              <div className="confidence-badge">82%</div>
            </div>

            {/* SYMPTOMS & ACTION */}
            <div className="disease-body">
              <div className="detail-row">
                <div className="detail-icon">
                  <svg width="28" height="12" viewBox="0 0 28 12" fill="none">
                    <circle cx="3" cy="6" r="2.5" fill="#C5CEB8" />
                    <line x1="5.5" y1="6" x2="21" y2="6" stroke="#C5CEB8" strokeWidth="1.5" />
                    <path d="M18 3L23 6L18 9" stroke="#C5CEB8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="detail-content">
                  <span className="detail-label">Symptoms</span>
                  <p>Brown lesions on leaves, yellowing of edges.</p>
                </div>
              </div>

              <div className="detail-row">
                <div className="detail-icon">
                  <svg width="28" height="12" viewBox="0 0 28 12" fill="none">
                    <circle cx="3" cy="6" r="2.5" fill="#C5CEB8" />
                    <line x1="5.5" y1="6" x2="21" y2="6" stroke="#C5CEB8" strokeWidth="1.5" />
                    <path d="M18 3L23 6L18 9" stroke="#C5CEB8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="detail-content">
                  <span className="detail-label">Recommended Action</span>
                  <p>Remove heavily affected plants and avoid water stress.</p>
                </div>
              </div>
            </div>

            {/* CARD FOOTER METRICS */}
            <div className="disease-footer">
              <div className="metric-box">
                <span className="metric-label">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: "4px", verticalAlign: "middle" }}>
                    <circle cx="12" cy="12" r="9" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  Severity
                </span>
                <span className="metric-value severity-high">
                  <svg width="10" height="14" viewBox="0 0 10 14" fill="#DC2626" style={{ marginRight: "4px" }}>
                    <path d="M5 0C2.24 0 0 2.24 0 5C0 8.75 5 14 5 14C5 14 10 8.75 10 5C10 2.24 7.76 0 5 0Z" />
                  </svg>
                  High
                </span>
              </div>

              <div className="metric-box">
                <span className="metric-label">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: "4px", verticalAlign: "middle" }}>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 2a10 10 0 0 0 0 20a10 10 0 0 0 0-20z" />
                    <path d="M2 12h20" />
                  </svg>
                  Location
                </span>
                <span className="metric-value">San Jose Farm</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </PageLayout>
  );
}