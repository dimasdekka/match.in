import type { ReactNode } from 'react';

interface AppHeaderProps {
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
  className?: string;
}

export function AppHeader({ left, center, right, className = '' }: AppHeaderProps) {
  return (
    <header className={`app-header-shell ${className}`}>
      <div className="app-header-left">{left}</div>
      <div className="app-header-center">{center}</div>
      <div className="app-header-right">{right}</div>
    </header>
  );
}
