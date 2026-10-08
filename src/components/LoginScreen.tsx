import { useState } from 'react';
import '../css/LoginScreen.css';
import PageLayout from '../shared/PageLayout';
import madaLogo from '../assets/images/maya-bird.png';
import { supabase } from '../supabase/supabase-client';

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
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // New states for verification
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setResendMessage('');
    setNeedsVerification(false);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      const msg = error.message.toLowerCase();

      if (msg.includes('email not confirmed')) {
        setNeedsVerification(true);
        setErrorMessage(
          "Your email isn't confirmed yet. Click the link in your inbox, or resend it below."
        );
      } else if (msg.includes('invalid login credentials')) {
        setErrorMessage('Incorrect email or password.');
      } else {
        setErrorMessage(error.message);
      }
      return;
    }

    onLoginSuccess?.();
  };

  const handleResendVerification = async () => {
    if (!email.trim()) {
      setResendMessage('Enter your email above first, then click resend.');
      return;
    }
    setResending(true);
    setResendMessage('');

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/#verify-email`,
      },
    });

    setResending(false);

    if (error) {
      setResendMessage(`Couldn't resend: ${error.message}`);
      return;
    }
    setResendMessage('Verification email sent. Check your inbox (and spam).');
  };

  const handleRegisterClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (onNavigateToRegister) {
      onNavigateToRegister();
      return;
    }
    window.location.hash = 'register';
  };

  return (
    <PageLayout hideNav={true}>
      <div className="login-content">
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

        <div className="login-brand">
          <img src={madaLogo} alt="MADA Logo" className="login-logo" />
          <h1>MADA</h1>
          <p>Smart tools for better farming.</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <h2>Welcome Back</h2>
          <p className="form-subtitle">Sign in to manage your farm and crops</p>

          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
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
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <a href="#forgot" className="forgot-password">
            Forgot Password?
          </a>

          {errorMessage && (
            <p className="login-error" role="alert">
              {errorMessage}
            </p>
          )}

          {needsVerification && (
            <button
              type="button"
              className="resend-btn"
              onClick={handleResendVerification}
              disabled={resending}
            >
              {resending ? 'Sending…' : 'Resend verification email'}
            </button>
          )}

          {resendMessage && (
            <p className="login-info" role="status">
              {resendMessage}
            </p>
          )}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

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