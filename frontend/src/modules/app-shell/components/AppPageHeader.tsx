import { Icon } from '@iconify/react';
import { motion } from 'motion/react';

interface AppPageHeaderProps {
  title: string;
  onBack?: () => void;
  action?: React.ReactNode;
}

export function AppPageHeader({ title, onBack, action }: AppPageHeaderProps) {
  return (
    <header className="app-page-header">
      <div>
        {onBack && (
          <motion.button
            type="button"
            className="app-circle-button"
            onClick={onBack}
            whileTap={{ scale: 0.9 }}
            aria-label="Back"
          >
            <Icon icon="solar:close-circle-linear" />
          </motion.button>
        )}
      </div>
      <h1>{title}</h1>
      <div>{action}</div>
    </header>
  );
}
