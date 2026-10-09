import "../LoadingSpinner/LoadingSpinner.css";

type SpinnerVariant = "leaf" | "circle";

interface LoadingSpinnerProps {
  variant?: SpinnerVariant;
  text?: string;
  logo?: string;
  title?: string;
  fullscreen?: boolean;
  size?: number;
}

function LoadingSpinner({
  text = "Loading...",
  logo,
  title,
  fullscreen = true,
  size = 72,
}: LoadingSpinnerProps) {
  const content = (
    <div
      className="loading-spinner-card"
      role="status"
      aria-label={text || title || "Loading"}
    >
      <div
        className="loading-spinner-mark"
        style={{ width: size, height: size }}
      >
        <span className="loading-spinner-ring" aria-hidden="true" />
        {logo && <img src={logo} alt="" className="loading-spinner-logo" />}
      </div>
      <span className="loading-spinner-sr-only">{text || title || "Loading"}</span>
    </div>
  );

  if (!fullscreen) return content;

  return <div className="loading-spinner-overlay">{content}</div>;
}

export default LoadingSpinner;
