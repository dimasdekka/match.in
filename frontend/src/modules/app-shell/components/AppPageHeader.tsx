import { Icon } from '@iconify/react';
import { motion } from 'motion/react';
import { AppHeader } from './AppHeader';

interface AppPageHeaderProps {
  title: string;
  onBack?: () => void;
  action?: React.ReactNode;
}

export function AppPageHeader({ title, onBack, action }: AppPageHeaderProps) {
  return (
    <AppHeader
      left={
        onBack ? (
          <motion.button
            type="button"
            className="app-circle-button"
            onClick={onBack}
            whileTap={{ scale: 0.9 }}
            aria-label="Back"
          >
            <Icon icon="solar:alt-arrow-left-linear" />
          </motion.button>
        ) : undefined
      }
      center={<h1 className="text-lg font-black tracking-tight text-white m-0">{title}</h1>}
      right={action}
    />
  );
}
