import type { ReactNode } from 'react';
import './PageHeader.css';

interface PageHeaderProps {
  title: string;
  onBack?: () => void;
  action?: ReactNode;
  divider?: boolean;
  align?: 'center' | 'left';
}

function PageHeader({
  title,
  onBack,
  action,
  divider = true,
  align = 'center',
}: PageHeaderProps) {
  return (
    <header
      className={[
        'app-page-header',
        divider ? '' : 'app-page-header--no-divider',
        align === 'left' ? 'app-page-header--left' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {onBack ? (
        <button
          type="button"
          className="app-page-header__back"
          onClick={onBack}
          aria-label="Go back"
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      ) : align === 'center' ? (
        <span className="app-page-header__spacer" aria-hidden="true" />
      ) : null}

      <h1 className="app-page-header__title">{title}</h1>
      {action ? (
        <div className="app-page-header__action">{action}</div>
      ) : (
        <span className="app-page-header__spacer" aria-hidden="true" />
      )}
    </header>
  );
}

export default PageHeader;
