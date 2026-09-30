import { useState } from "react";
import WelcomeScreen from "./components/WelcomeScreen";
import LoginScreen from "./components/LoginScreen";
import FarmerDashboard from "./components/FarmerDashboard";
import MyFarms from "./components/MyFarms";
import FarmDetails from "./components/FarmDetails";
import ProfileScreen from "./components/FarmerProfile";
import FarmingCalendar from "./components/FarmingCalendar";
import CropHealth from "./components/CropHealth";
import FarmFinances from "./components/FarmFinances";
import MarketPrices from "./components/MarketPrices";              // ← ADD
import { LoadingProvider } from "./context/LoadingContext";

type Screen =
  | "welcome"
  | "login"
  | "dashboard"
  | "farms"
  | "farm-details"
  | "profile"
  | "calendar"
  | "crop-health"
  | "finances"
  | "market";                                                       // ← ADD

function App() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);

  const handleNavigate = (tab: string) => {
    switch (tab) {
      case "Home":
      case "dashboard":
        setScreen("dashboard");
        break;
      case "Farm":
      case "farms":
        setScreen("farms");
        break;
      case "Profile":
      case "profile":
        setScreen("profile");
        break;
      case "Tasks":
      case "calendar":
        setScreen("calendar");
        break;
      case "CropHealth":
      case "crop-health":
        setScreen("crop-health");
        break;
      case "Expenses":
      case "expenses":
      case "finances":
        setScreen("finances");
        break;
      case "Market":                                                // ← ADD
      case "market":
      case "MarketPrices":
      case "market-prices":
        setScreen("market");
        break;
      default:
        console.warn(`Unknown navigation target: ${tab}`);
    }
  };

  return (
    <LoadingProvider>
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
            onNavigate={handleNavigate}
          />
        </div>
      )}

      {screen === "farms" && (
        <div key="farms" className="page-transition">
          <MyFarms
            onSelectFarm={(farmId) => {
              setSelectedFarmId(farmId);
              setScreen("farm-details");
            }}
            onNavigate={handleNavigate}
          />
        </div>
      )}

      {screen === "farm-details" && (
        <div key="farm-details" className="page-transition">
          <FarmDetails
            farmId={selectedFarmId || undefined}
            onBack={() => setScreen("farms")}
            onNavigate={handleNavigate}
          />
        </div>
      )}

      {screen === "profile" && (
        <div key="profile" className="page-transition">
          <ProfileScreen
            onLogout={() => setScreen("welcome")}
            onNavigate={handleNavigate}
          />
        </div>
      )}

      {screen === "calendar" && (
        <div key="calendar" className="page-transition">
          <FarmingCalendar
            onBack={() => setScreen("dashboard")}
            onNavigate={handleNavigate}
          />
        </div>
      )}

      {screen === "crop-health" && (
        <div key="crop-health" className="page-transition">
          <CropHealth onNavigate={handleNavigate} />
        </div>
      )}

      {screen === "finances" && (
        <div key="finances" className="page-transition">
          <FarmFinances
            onBack={() => setScreen("dashboard")}
            onNavigate={handleNavigate}
          />
        </div>
      )}

      {/* ↓ ADD — render Market Prices */}
      {screen === "market" && (
        <div key="market" className="page-transition">
          <MarketPrices onNavigate={handleNavigate} />
        </div>
      )}
    </LoadingProvider>
  );
}

export default App;