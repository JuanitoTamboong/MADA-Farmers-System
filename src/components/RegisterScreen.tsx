import { useEffect, useState } from "react";
import "../css/RegisterScreen.css";
import PageLayout from "../shared/PageLayout";
import madaLogo from "../assets/images/maya-bird.png";
import { supabase } from "../supabase/supabase-client";

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
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  // Auto-dismiss the modal and go to login
  useEffect(() => {
    if (!showSuccessModal) return;
    const t = setTimeout(() => {
      setShowSuccessModal(false);
      onBackToLogin?.();
    }, 4000);
    return () => clearTimeout(t);
  }, [showSuccessModal, onBackToLogin]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError("");
    setErrorMessage("");

    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: name.trim(),
          address: address.trim(),
        },
        emailRedirectTo: `${window.location.origin}/#verify-email`,
      },
    });

    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    if (data.user && data.user.identities?.length === 0) {
      setErrorMessage("An account with this email already exists.");
      return;
    }

    if (!data.session) {
      // Confirmation is ON → show popup
      setRegisteredEmail(email.trim());
      setShowSuccessModal(true);
      return;
    }

    // Fallback: confirmation OFF → straight to login
    onBackToLogin?.();
  };

  const handleDismissModal = () => {
    setShowSuccessModal(false);
    onBackToLogin?.();
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
              minLength={6}
            />
          </div>

          <div className="register-input-group">
            <label htmlFor="register-confirm-password">
              Confirm Password
            </label>
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

          {errorMessage && (
            <p className="register-error" role="alert">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            className="register-submit-btn"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create Account"}
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

        {/* ⭐ Popup modal */}
        {showSuccessModal && (
          <div
            className="register-modal-overlay"
            onClick={handleDismissModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="register-modal-title"
          >
            <div
              className="register-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="register-modal-icon">✉️</div>
              <h3 id="register-modal-title" className="register-modal-title">
                Check your email
              </h3>
              <p className="register-modal-text">
                We sent a verification link to
                <br />
                <strong>{registeredEmail}</strong>
              </p>
              <p className="register-modal-hint">
                Click the link in the email to activate your account. If you
                don't see it, check your spam folder.
              </p>
              <p className="register-modal-redirect">
                Returning to login…
              </p>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}

export default RegisterScreen;