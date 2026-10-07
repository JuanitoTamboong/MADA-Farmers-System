import { useState } from 'react';
import '../css/LoginScreen.css';
import PageLayout from '../shared/PageLayout';
import madaLogo from '../assets/images/maya-bird.png';

interface LoginScreenProps {
  onLoginSuccess?: () => void;
  onBackToWelcome?: () => void;
  onNavigateToRegister?: () => void;
}

function LoginScreen({
  onLoginSuccess,
  onBackToWelcome,
  onNavigateToRegister,
}: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onLoginSuccess) {
      onLoginSuccess();
    }
  };

  const handleRegisterClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (onNavigateToRegister) {
      onNavigateToRegister();
      return;
    }
    // Fallback: hash-based route, matching the rest of the app
    window.location.hash = 'register';
  };

  return (
    <PageLayout hideNav={true}>
      <div className="login-content">
        {/* HEADER / BACK BUTTON */}
        <div className="login-header">
          {onBackToWelcome && (
            <button
              type="button"
              className="back-btn"
              onClick={onBackToWelcome}
              aria-label="Back to welcome screen"
            >
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

        {/* FOOTER */}
        <div className="login-footer">
          <p>
            Don&apos;t have an account?{' '}
            <a href="#register" onClick={handleRegisterClick}>
              Register here
            </a>
          </p>
        </div>
      </div>
    </PageLayout>
  );
}

export default LoginScreen;