import { useState } from "react";
import WelcomeScreen from "./components/WelcomeScreen";
import LoginScreen from "./components/LoginScreen";
import FarmerDashboard from "./components/FarmerDashboard";
import MyFarms from "./components/MyFarms";
import FarmDetails from "./components/FarmDetails";
import AddFarmModal from "./components/AddFarmModal";

function App() {
  const [screen, setScreen] = useState<
    "welcome" | "login" | "dashboard" | "farms" | "farm-details"
  >("welcome");

  // State to hold selected farm ID and control Add Farm modal display
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  return (
    <div className="app-container">
      {/* WELCOME SCREEN */}
      {screen === "welcome" && (
        <div key="welcome" className="page-transition">
          <WelcomeScreen onGetStarted={() => setScreen("login")} />
        </div>
      )}

      {/* LOGIN SCREEN */}
      {screen === "login" && (
        <div key="login" className="page-transition">
          <LoginScreen
            onLoginSuccess={() => setScreen("dashboard")}
            onBackToWelcome={() => setScreen("welcome")}
          />
        </div>
      )}

      {/* FARMER DASHBOARD */}
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

      {/* MY FARMS LIST */}
      {screen === "farms" && (
        <div key="farms" className="page-transition">
          <MyFarms
            onAddFarm={() => setIsAddModalOpen(true)}
            onSelectFarm={(farmId) => {
              setSelectedFarmId(farmId);
              setScreen("farm-details");
            }}
            onNavClick={(tab) => {
              if (tab === "Home") setScreen("dashboard");
            }}
          />

          {/* ADD FARM MODAL OVERLAY */}
          {isAddModalOpen && (
            <AddFarmModal
              onClose={() => setIsAddModalOpen(false)}
              onSave={(newFarm) => {
                console.log("New farm created:", newFarm);
                setIsAddModalOpen(false);
              }}
            />
          )}
        </div>
      )}

      {/* FARM DETAILS SCREEN */}
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
  );
}

export default App;