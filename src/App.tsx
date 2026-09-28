import { useState } from "react";
import WelcomeScreen from "./components/WelcomeScreen";
import LoginScreen from "./components/LoginScreen";
import FarmerDashboard from "./components/FarmerDashboard";
import MyFarms from "./components/MyFarms";
import FarmDetails from "./components/FarmDetails";
import { LoadingProvider } from "./context/LoadingContext";

type Screen = "welcome" | "login" | "dashboard" | "farms" | "farm-details";

function App() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);

  return (
    <LoadingProvider>
      <div className="app-container">
        {/* WELCOME */}
        {screen === "welcome" && (
          <div key="welcome" className="page-transition">
            <WelcomeScreen onGetStarted={() => setScreen("login")} />
          </div>
        )}

        {/* LOGIN */}
        {screen === "login" && (
          <div key="login" className="page-transition">
            <LoginScreen
              onLoginSuccess={() => setScreen("dashboard")}
              onBackToWelcome={() => setScreen("welcome")}
            />
          </div>
        )}

        {/* DASHBOARD */}
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

        {/* MY FARMS */}
        {screen === "farms" && (
          <div key="farms" className="page-transition">
            <MyFarms
              onSelectFarm={(farmId) => {
                setSelectedFarmId(farmId);
                setScreen("farm-details");
              }}
              onNavClick={(tab) => {
                if (tab === "Home") setScreen("dashboard");
              }}
            />
          </div>
        )}

        {/* FARM DETAILS */}
        {screen === "farm-details" && (
          <div key="farm-details" className="page-transition">
            <FarmDetails
              farmId={selectedFarmId || undefined}
              onBack={() => setScreen("farms")}
              onNavClick={(tab) => {
                if (tab === "Home") setScreen("dashboard");
                if (tab === "Farm") setScreen("farms");
              }}
            />
          </div>
        )}
      </div>
    </LoadingProvider>
  );
}

export default App;