import { useState } from "react";
import "../css/LoginScreen.css";
import PageLayout from "../shared/PageLayout"; 
import madaLogo from "../assets/images/maya-bird.png";

interface LoginScreenProps {
  onLoginSuccess?: () => void;
  onBackToWelcome?: () => void;
}

function LoginScreen({ onLoginSuccess, onBackToWelcome }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onLoginSuccess) {
      onLoginSuccess();
    }
  };

  const handleGoogleLogin = () => {
    if (onLoginSuccess) {
      onLoginSuccess();
    }
  };

  return (
    <PageLayout hideNav={true}>
      <div className="login-content">

        {/* HEADER / BACK BUTTON */}
        <div className="login-header">
          {onBackToWelcome && (
            <button type="button" className="back-btn" onClick={onBackToWelcome}>
              ‹
            </button>
          )}
        </div>

        {/* MADA BRANDING */}
        <div className="login-brand">
          <img src={madaLogo} alt="MADA Logo" className="login-logo" />
          <h1>MADA</h1>
          <p>Smart tools for better farming.</p>
        </div>

        {/* LOGIN FORM */}
        <form className="login-form" onSubmit={handleSubmit}>
          <h2>Welcome Back</h2>
          <p className="form-subtitle">Sign in to manage your farm and crops</p>

          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="e.g. farmer@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <a href="#forgot" className="forgot-password">
            Forgot Password?
          </a>

          <button type="submit" className="login-btn">
            Login
          </button>
        </form>

        {/* DIVIDER */}
        <div className="divider">
          <span>OR</span>
        </div>

        {/* GOOGLE AUTH BUTTON */}
        <button type="button" className="google-btn" onClick={handleGoogleLogin}>
          <svg className="google-icon" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.27v3.15C3.25 21.3 7.31 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.27C.46 8.23 0 10.06 0 12c0 1.94.46 3.77 1.27 5.39l4.01-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.61l4.01 3.15c.95-2.85 3.6-4.96 6.72-4.96z"
            />
          </svg>
          Continue with Google
        </button>

        {/* FOOTER */}
        <div className="login-footer">
          <p>
            Don't have an account? <a href="#register">Register here</a>
          </p>
        </div>

      </div>
    </PageLayout>
  );
}

export default LoginScreen;