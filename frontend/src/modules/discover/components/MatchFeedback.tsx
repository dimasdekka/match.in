import { Icon } from '@iconify/react';
import { AnimatePresence, motion } from 'motion/react';
import type { DiscoverProfile } from '../constants/profile';

export function MatchFeedback({
  profile,
  onClose,
}: {
  profile: DiscoverProfile | null;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {profile && (
        <motion.div
          className="match-feedback"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="match-feedback-card"
            initial={{ scale: 0.78, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.85, y: 20 }}
            transition={{ type: 'spring', stiffness: 330, damping: 25 }}
            onClick={(event) => event.stopPropagation()}
          >
            <Icon className="match-spark" icon="solar:stars-bold" />
            <img src={profile.image} alt={profile.name} />
            <h2>It's a match!</h2>
            <p>You and {profile.name} liked each other.</p>
            <button type="button" onClick={onClose}>
              Keep discovering
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
