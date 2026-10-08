import { useState } from "react";
import "../css/RegisterScreen.css";
import PageLayout from "../shared/PageLayout";
import madaLogo from "../assets/images/maya-bird.png";

interface RegisterScreenProps {
  onRegisterSuccess?: () => void;
  onBackToLogin?: () => void;
}

function RegisterScreen({
  onRegisterSuccess,
  onBackToLogin,
}: RegisterScreenProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setPasswordError("");

    // TODO: send { name, email, address, password } to your API here
    onRegisterSuccess?.();
  };

  return (
    <PageLayout hideNav={true}>
      <div className="register-content">
        <div className="register-header">
          <button
            type="button"
            className="register-back-btn"
            onClick={onBackToLogin}
            aria-label="Back to login"
          >
            ‹
          </button>
        </div>

        <div className="register-brand">
          <img src={madaLogo} alt="MADA Logo" className="register-logo" />
          <h1>MADA</h1>
          <p>Smart tools for better farming.</p>
        </div>

        <form className="register-form" onSubmit={handleSubmit}>
          <h2>Create Account</h2>
          <p className="register-subtitle">
            Register to manage your farm and crops
          </p>

          <div className="register-input-group">
            <label htmlFor="register-name">Full Name</label>
            <input
              id="register-name"
              type="text"
              autoComplete="name"
              placeholder="Enter your full name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>

          <div className="register-input-group">
            <label htmlFor="register-email">Email Address</label>
            <input
              id="register-email"
              type="email"
              autoComplete="email"
              placeholder="e.g. farmer@gmail.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          {/* New Barangay / Address field */}
          <div className="register-input-group">
            <label htmlFor="register-address">Barangay / Address</label>
            <input
              id="register-address"
              type="text"
              autoComplete="street-address"
              placeholder="e.g. Barangay San Isidro, Nueva Ecija"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              required
            />
          </div>

          <div className="register-input-group">
            <label htmlFor="register-password">Password</label>
            <input
              id="register-password"
              type="password"
              autoComplete="new-password"
              placeholder="Create a password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          <div className="register-input-group">
            <label htmlFor="register-confirm-password">Confirm Password</label>
            <input
              id="register-confirm-password"
              type="password"
              autoComplete="new-password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              aria-describedby={
                passwordError ? "register-password-error" : undefined
              }
            />
          </div>

          {passwordError && (
            <p
              id="register-password-error"
              className="register-error"
              role="alert"
            >
              {passwordError}
            </p>
          )}

          <button type="submit" className="register-submit-btn">
            Create Account
          </button>
        </form>

        <div className="register-footer">
          <p>
            Already have an account?{" "}
            <button type="button" onClick={onBackToLogin}>
              Login
            </button>
          </p>
        </div>
      </div>
    </PageLayout>
  );
}

export default RegisterScreen;