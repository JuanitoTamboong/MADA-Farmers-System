import React from "react";
import BottomNav from "../navigation/BottomNav";
import LoadingSpinner from "../LoadingSpinner/LoadingSpinner";
import madaLogo from "../assets/images/maya-bird.png";
import "./Layout.css";

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
  activeTab?: string;
  onNavigate?: (tab: string) => void;
  hideNav?: boolean;
  loading?: boolean;
  loadingText?: string;
}

const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  className = "",
  activeTab = "Home",
  onNavigate,
  hideNav = false,
  loading = false,
  loadingText = "Loading...",
}) => {
  return (
    <main className="app-viewport">
      <div className={`app-container ${className}`}>
        <div
          className="scrollable-content"
          style={{
            paddingBottom: hideNav
              ? "0px"
              : "calc(64px + env(safe-area-inset-bottom, 0px))",
          }}
        >
          {children}
        </div>

        {!hideNav && <BottomNav activeTab={activeTab} onNavigate={onNavigate} />}

        {loading && (
          <LoadingSpinner
            variant="leaf"
            logo={madaLogo}
            title="MADA"
            text={loadingText}
          />
        )}
      </div>
    </main>
  );
};

export default PageLayout;