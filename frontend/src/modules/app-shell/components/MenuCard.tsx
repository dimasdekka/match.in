import { Icon } from '@iconify/react';
import { motion } from 'motion/react';

export interface MenuItem {
  icon: string;
  label: string;
  tone?: 'default' | 'danger';
  onClick?: () => void;
}

export function MenuCard({ items }: { items: MenuItem[] }) {
  return (
    <div className="app-menu-card">
      {items.map((item) => (
        <motion.button
          type="button"
          key={item.label}
          className={item.tone === 'danger' ? 'danger' : ''}
          onClick={item.onClick}
          whileTap={{ scale: 0.98 }}
        >
          <Icon icon={item.icon} className="menu-leading" />
          <span>{item.label}</span>
          <Icon icon="solar:alt-arrow-right-linear" className="menu-arrow" />
        </motion.button>
      ))}
    </div>
  );
}
