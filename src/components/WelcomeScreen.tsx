import "../css/WelcomeScreen.css";
import farmImage from "../assets/images/farm.jfif";
import madaLogo from "../assets/images/maya-bird.png";

interface WelcomeScreenProps {
  onGetStarted?: () => void;
}

function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  return (
    <main className="welcome-page">
      <div className="welcome-card">
        {/* BACKGROUND IMAGE & BLEND OVERLAY */}
        <img
          src={farmImage}
          alt="Farm landscape"
          className="background-farm"
        />
        <div className="background-blend"></div>

        {/* TOP / MAIN CONTENT AREA */}
        <div className="welcome-content">
          {/* LOGO & BRAND */}
          <div className="brand">
            <img src={madaLogo} alt="MADA" className="mada-logo" />
            <div className="brand-info">
              <h1>MADA</h1>
              <p>Smart tools for better farming.</p>
            </div>
          </div>

          {/* HERO TEXT */}
          <div className="hero-content">
            <h2>
              Empowering<br />
              Farmers for a<br />
              Greener Tomorrow
            </h2>
            <p>
              Manage your farm, get real-time<br />
              updates, and grow with confidence.
            </p>
          </div>
        </div>

        {/* BOTTOM CONTROLS */}
        <div className="bottom-controls">
          <button className="get-started" onClick={onGetStarted}>
            Get Started
          </button>

          <div className="pagination">
            <span className="page-dot active"></span>
            <span className="page-dot"></span>
            <span className="page-dot"></span>
          </div>
        </div>
      </div>
    </main>
  );
}

export default WelcomeScreen;