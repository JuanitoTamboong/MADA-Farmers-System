import { useEffect, useState } from "react";
import "../templates/VerifyEmail.css";
import { supabase } from "../supabase/supabase-client";
import madaLogo from "../assets/images/maya-bird.png";

type Status = "verifying" | "success" | "error";

interface VerifyEmailProps {
  onVerified?: () => void; // called after success (e.g. go to login/dashboard)
}

function VerifyEmail({ onVerified }: VerifyEmailProps) {
  const [status, setStatus] = useState<Status>("verifying");
  const [message, setMessage] = useState("Verifying your email, please wait…");

  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      // Supabase sends tokens in the URL hash after the user clicks the email link:
      // https://your-site.com/#access_token=...&refresh_token=...
      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash;
      const params = new URLSearchParams(hash);

      const errorDescription = params.get("error_description");
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");

      // Case 1 — Supabase reported an error in the URL
      if (errorDescription) {
        if (cancelled) return;
        setStatus("error");
        setMessage(decodeURIComponent(errorDescription));
        return;
      }

      // Case 2 — We have tokens: create the session explicitly
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (cancelled) return;

        if (error) {
          setStatus("error");
          setMessage(error.message);
          return;
        }

        setStatus("success");
        setMessage("Your email has been verified! You can now log in.");
        onVerified?.();
        return;
      }

      // Case 3 — No tokens in URL: maybe detectSessionInUrl already handled it
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;

      if (data.session?.user?.email_confirmed_at) {
        setStatus("success");
        setMessage("Your email has been verified! You can now log in.");
        onVerified?.();
      } else {
        setStatus("error");
        setMessage(
          "This verification link is invalid or has already been used. Try logging in — if that fails, register again."
        );
      }
    };

    verify();
    return () => {
      cancelled = true;
    };
  }, [onVerified]);

  const goToLogin = () => {
    // Try to close (works if the tab was script-opened)
    window.close();
    // Fallback: navigate back to login after a short delay
    setTimeout(() => {
      window.location.hash = "login";
    }, 200);
  };

  return (
    <div className="verify-content">
      <div className="verify-brand">
        <img src={madaLogo} alt="MADA Logo" className="verify-logo" />
        <h1>MADA</h1>
        <p>Smart tools for better farming.</p>
      </div>

      <div className={`verify-card verify-${status}`}>
        {status === "verifying" && (
          <>
            <div className="verify-spinner" />
            <h2>Verifying your email</h2>
            <p>{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="verify-icon verify-icon-success">✓</div>
            <h2>Email verified!</h2>
            <p>{message}</p>
            <p className="verify-hint">
              This tab will close automatically in a moment.
            </p>
            <button className="verify-btn" onClick={goToLogin}>
              Close this tab
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="verify-icon verify-icon-error">!</div>
            <h2>Verification failed</h2>
            <p>{message}</p>
            <button
              className="verify-btn"
              onClick={() => (window.location.hash = "login")}
            >
              Go to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default VerifyEmail;