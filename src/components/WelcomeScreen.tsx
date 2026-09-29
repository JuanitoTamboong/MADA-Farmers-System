import { useEffect, useState } from "react";
import PageLayout from "../shared/PageLayout";
import "../css/WelcomeScreen.css";
import "../animations/particles.css";
import farmImage1 from "../assets/images/farm.jfif";
import farmImage2 from "../assets/images/farm2.jpg";
import farmImage3 from "../assets/images/farm3.jpg";
import farmImage4 from "../assets/images/farm4.jpg";
import madaLogo from "../assets/images/maya-bird.png";

const backgrounds = [farmImage1, farmImage2, farmImage3, farmImage4];

function WelcomeScreen({ onGetStarted }: { onGetStarted?: () => void }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % backgrounds.length);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <PageLayout>
      
      {/* BACKGROUND STACK */}
      <div className="background-stack">
        {backgrounds.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`Farm landscape ${i + 1}`}
            className={`background-farm ${i === index ? "active" : ""}`}
          />
        ))}
      </div>

      <div className="background-blend"></div>

      {/* PARTICLES */}
      <div className="particles-layer" aria-hidden="true">
        {Array.from({ length: 18 }).map((_, i) => (
          <span key={i} className={`particle particle-${i + 1}`}></span>
        ))}
      </div>

      {/* CONTENT */}
      <div className="welcome-content">
        <div className="brand">
          <img src={madaLogo} alt="MADA" className="mada-logo" />
          <div className="brand-info">
            <h1>MADA</h1>
            <p>Smart tools for better farming.</p>
          </div>
        </div>

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

      {/* BOTTOM */}
      <div className="bottom-controls">
        <button className="get-started" onClick={onGetStarted}>
          Get Started
        </button>

        <div className="pagination">
          {backgrounds.map((_, i) => (
            <span
              key={i}
              className={`page-dot ${i === index ? "active" : ""}`}
            ></span>
          ))}
        </div>
      </div>

    </PageLayout>
  );
}

export default WelcomeScreen;