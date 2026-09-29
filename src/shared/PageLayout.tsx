import React from "react";
import "./Layout.css"; // We will create this next

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string; // Optional: for page-specific styling
}

const PageLayout: React.FC<PageLayoutProps> = ({ children, className = "" }) => {
  return (
    <main className="app-viewport">
      <div className={`app-container ${className}`}>
        {children}
      </div>
    </main>
  );
};

export default PageLayout;