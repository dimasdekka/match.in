import { Icon } from '@iconify/react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
export function IconButton({
  icon,
  label,
  className,
  onClick,
}: {
  icon: string;
  label: string;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      className={cn('discover-icon-button', className)}
      onClick={onClick}
      whileTap={{ scale: 0.92 }}
    >
      <Icon icon={icon} />
    </motion.button>
  );
}
