import React from "react";
import BottomNav from "../navigation/BottomNav";
import "./Layout.css";

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
  activeTab?: string;
  onNavigate?: (tab: string) => void;   // ← renamed from onNavClick
  hideNav?: boolean;
}

const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  className = "",
  activeTab = "Home",
  onNavigate,                            // ← renamed
  hideNav = false,
}) => {
  return (
    <main className="app-viewport">
      <div className={`app-container ${className}`}>
        <div
          className="scrollable-content"
          style={{ paddingBottom: hideNav ? "0px" : "64px" }}
        >
          {children}
        </div>

        {!hideNav && <BottomNav activeTab={activeTab} onNavigate={onNavigate} />}
      </div>
    </main>
  );
};

export default PageLayout;