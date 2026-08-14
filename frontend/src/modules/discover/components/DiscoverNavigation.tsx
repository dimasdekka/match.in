import { Icon } from '@iconify/react';
import { motion } from 'motion/react';
import { DISCOVER_NAV } from '../constants/profile';

export type DiscoverNavId = (typeof DISCOVER_NAV)[number]['id'];

interface DiscoverNavigationProps {
  active: DiscoverNavId;
  onChange: (item: DiscoverNavId) => void;
}

export function DiscoverNavigation({ active, onChange }: DiscoverNavigationProps) {
  return (
    <nav className="discover-nav" aria-label="Main navigation">
      {DISCOVER_NAV.map((item) => {
        const isActive = item.id === active;
        return (
          <button
            type="button"
            aria-label={item.id}
            className={`discover-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => onChange(item.id)}
            key={item.id}
          >
            {isActive && (
              <motion.span
                layoutId="activeDockIndicator"
                className="discover-nav-indicator"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            <Icon className="discover-nav-icon" icon={item.icon} />
          </button>
        );
      })}
    </nav>
  );
}
