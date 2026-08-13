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
      {DISCOVER_NAV.map((item) => (
        <motion.button
          type="button"
          aria-label={item.id}
          className={item.id === active ? 'active' : ''}
          onClick={() => onChange(item.id)}
          whileTap={{ scale: 0.92 }}
          key={item.id}
        >
          <Icon icon={item.icon} />
        </motion.button>
      ))}
    </nav>
  );
}
