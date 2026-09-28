import "../LoadingSpinner/LoadingSpinner.css";

type SpinnerVariant = "leaf" | "circle";

interface LoadingSpinnerProps {
  /** "leaf" (default) or "circle" */
  variant?: SpinnerVariant;
  /** Main text under the spinner */
  text?: string;
  /** Optional logo/image shown above the spinner */
  logo?: string;
  /** Optional title under the logo (e.g. "MADA") */
  title?: string;
  /** Full-screen overlay (default true). If false, renders inline. */
  fullscreen?: boolean;
  /** Size in px (spinner container) — default 72 */
  size?: number;
}

function LoadingSpinner({
  variant = "leaf",
  text = "Loading...",
  logo,
  title,
  fullscreen = true,
  size = 72,
}: LoadingSpinnerProps) {
  const content = (
    <div className="loading-spinner-card">
      {logo && <img src={logo} alt={title || "logo"} className="loading-spinner-logo" />}
      {title && <h1 className="loading-spinner-title">{title}</h1>}

      {variant === "leaf" ? (
        <div
          className="leaf-spinner"
          style={{ width: size, height: size }}
        >
          <svg viewBox="0 0 64 64" width="100%" height="100%">
            <path
              className="leaf-shape"
              d="M32 4
                 C 44 12, 56 24, 56 38
                 C 56 50, 46 58, 32 60
                 C 18 58, 8 50, 8 38
                 C 8 24, 20 12, 32 4 Z"
              fill="url(#leafGradient)"
            />
            <path
              className="leaf-vein"
              d="M32 10 L32 56"
              stroke="#fcf9f0"
              strokeWidth="1.6"
              strokeLinecap="round"
              fill="none"
            />
            <path
              className="leaf-veins"
              d="M32 22 L22 30 M32 22 L42 30
                 M32 32 L20 42 M32 32 L44 42
                 M32 44 L24 50 M32 44 L40 50"
              stroke="#fcf9f0"
              strokeWidth="1.2"
              strokeLinecap="round"
              fill="none"
              opacity="0.75"
            />
            <defs>
              <linearGradient id="leafGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#7fb069" />
                <stop offset="100%" stopColor="#1b4d2e" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      ) : (
        <div
          className="circle-spinner"
          style={{ width: size * 0.6, height: size * 0.6 }}
        ></div>
      )}

      {text && <p className="loading-spinner-text">{text}</p>}
    </div>
  );

  if (!fullscreen) return content;

  return <div className="loading-spinner-overlay">{content}</div>;
}

export default LoadingSpinner;