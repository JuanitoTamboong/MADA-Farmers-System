import { useState } from "react";
import WelcomeScreen from "./components/WelcomeScreen";
import LoginScreen from "./components/LoginScreen";

function App() {
  const [screen, setScreen] = useState<"welcome" | "login" | "dashboard">("welcome");

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
        <div key="dashboard" className="page-transition" style={{ padding: 20, textAlign: "center", background: "#fcf9f0", minHeight: "100vh" }}>
          <h2>MADA Farmer Dashboard</h2>
          <p>Welcome back, Farmer!</p>
          <button onClick={() => setScreen("welcome")}>Log Out</button>
        </div>
      )}
    </div>
  );
}

export default App;