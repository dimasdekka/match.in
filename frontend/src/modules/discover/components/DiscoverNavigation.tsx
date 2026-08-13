import { Icon } from '@iconify/react';
import { motion } from 'motion/react';
import { DISCOVER_NAV } from '../constants/profile';

export type DiscoverNavId = (typeof DISCOVER_NAV)[number]['id'];

interface DiscoverNavigationProps {
  active: DiscoverNavId;
  onChange: (item: DiscoverNavId) => void;
}

export function DiscoverNavigation({ active, onChange }: DiscoverNavigationProps) {
  const activeIndex = DISCOVER_NAV.findIndex((item) => item.id === active);

  return (
    <nav className="discover-nav" aria-label="Main navigation">
      <motion.span
        className="discover-nav-indicator"
        aria-hidden="true"
        initial={false}
        animate={{ x: activeIndex * 66 }}
        transition={{ type: 'tween', duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      />
      {DISCOVER_NAV.map((item) => (
        <motion.button
          type="button"
          aria-label={item.id}
          className={item.id === active ? 'active' : ''}
          onClick={() => onChange(item.id)}
          whileTap={{ scale: 0.96 }}
          key={item.id}
        >
          <Icon className="discover-nav-icon" icon={item.icon} />
        </motion.button>
      ))}
    </nav>
  );
}
