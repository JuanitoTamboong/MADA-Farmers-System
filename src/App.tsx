import { useState } from "react";
import WelcomeScreen from "./components/WelcomeScreen";
import LoginScreen from "./components/LoginScreen";
import FarmerDashboard from "./components/FarmerDashboard";
import MyFarms from "./components/MyFarms";

function App() {
  const [screen, setScreen] = useState<"welcome" | "login" | "dashboard" | "farms">("welcome");
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);

  return (
    <div className="app-container">
      {screen === "welcome" && (
        <div key="welcome" className="page-transition">
          <WelcomeScreen onGetStarted={() => setScreen("login")} />
        </div>
      )}

      {screen === "login" && (
        <div key="login" className="page-transition">
          <LoginScreen
            onLoginSuccess={() => setScreen("dashboard")}
            onBackToWelcome={() => setScreen("welcome")}
          />
        </div>
      )}

      {screen === "dashboard" && (
        <div key="dashboard" className="page-transition">
          <FarmerDashboard 
            onLogout={() => setScreen("welcome")} 
            onNavigate={(tab) => {
              if (tab === "farms" || tab === "Farm") setScreen("farms");
            }}
          />
        </div>
      )}

      {screen === "farms" && (
        <div key="farms" className="page-transition">
          <MyFarms 
            onSelectFarm={(farmId) => {
              setSelectedFarmId(farmId);
              // Handle farm detail screen here if needed
            }}
            onNavClick={(tab) => {
              if (tab === "Home") setScreen("dashboard");
            }}
          />
        </div>
      )}
    </div>
  );
}

export default App;