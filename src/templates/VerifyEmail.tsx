import { useEffect, useState } from "react";
import "../templates/VerifyEmail.css";
import { supabase } from "../supabase/supabase-client";
import madaLogo from "../assets/images/maya-bird.png";

type Status = "verifying" | "success" | "error";

interface VerifyEmailProps {
  onVerified?: () => void;
}

function VerifyEmail({ onVerified }: VerifyEmailProps) {
  const [status, setStatus] = useState<Status>("verifying");
  const [message, setMessage] = useState("Verifying your email, please wait…");
  const [closeAttempted, setCloseAttempted] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      const hash = window.location.hash.replace(/^#/, "");
      const params = new URLSearchParams(hash);

      const errorDescription = params.get("error_description");
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");

      if (errorDescription) {
        if (cancelled) return;
        setStatus("error");
        setMessage(decodeURIComponent(errorDescription));
        return;
      }

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
        setMessage("Your email has been verified!");
        onVerified?.();
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (cancelled) return;

      if (data.session?.user?.email_confirmed_at) {
        setStatus("success");
        setMessage("Your email has been verified!");
        onVerified?.();
      } else {
        setStatus("error");
        setMessage("This verification link is invalid or has already been used.");
      }
    };

    verify();
    return () => {
      cancelled = true;
    };
  }, [onVerified]);

  useEffect(() => {
    if (status !== "success") return;
    const t = setTimeout(() => {
      window.close();
      setCloseAttempted(true);
    }, 1500);
    return () => clearTimeout(t);
  }, [status]);

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

            {closeAttempted ? (
              <>
                <p className="verify-hint">
                  You can now close this tab and return to the app.
                </p>
                <button
                  className="verify-btn"
                  onClick={() => window.close()}
                >
                  Close this tab
                </button>
              </>
            ) : (
              <p className="verify-hint">Closing this tab…</p>
            )}
          </>
        )}

        {status === "error" && (
          <>
            <div className="verify-icon verify-icon-error">!</div>
            <h2>Verification failed</h2>
            <p>{message}</p>
          </>
        )}
      </div>
    </div>
  );
}

export default VerifyEmail;