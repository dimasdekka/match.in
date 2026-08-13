import { Icon } from '@iconify/react';
import { motion, useMotionValue, useTransform } from 'motion/react';
import type { DiscoverProfile } from '../constants/profile';
import type { SwipeDecision } from '../hooks/useDiscoverDeck';

const cardVariants = {
  enter: { opacity: 1, scale: 1, y: 0 },
  exit: (direction: number) => ({
    x: direction * 620,
    rotate: direction * 14,
    opacity: 0,
  }),
};

export function ProfileCard({
  profile,
  onSwipe,
  background = false,
}: {
  profile: DiscoverProfile;
  onSwipe: (decision: SwipeDecision) => void;
  background?: boolean;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 0, 220], [-10, 0, 10]);
  const likeOpacity = useTransform(x, [25, 130], [0, 1]);
  const passOpacity = useTransform(x, [-130, -25], [1, 0]);

  return (
    <motion.article
      className="discover-profile-card"
      data-background={background || undefined}
      style={background ? undefined : { x, rotate }}
      drag={background ? false : 'x'}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.85}
      whileDrag={background ? undefined : { scale: 1.012 }}
      onDragEnd={(_, info) => {
        if (background) return;
        const projected = info.offset.x + info.velocity.x * 0.14;
        if (projected > 115) onSwipe('like');
        else if (projected < -115) onSwipe('pass');
      }}
      initial={background ? false : { opacity: 1, scale: 0.975 }}
      animate={background ? undefined : 'enter'}
      exit={background ? undefined : 'exit'}
      variants={cardVariants}
      transition={{ type: 'spring', stiffness: 440, damping: 34, mass: 0.72 }}
    >
      <img src={profile.image} alt={profile.name} draggable={false} />
      <div className="profile-shade" />
      <motion.div className="swipe-stamp like-stamp" style={{ opacity: likeOpacity }}>
        LIKE
      </motion.div>
      <motion.div className="swipe-stamp pass-stamp" style={{ opacity: passOpacity }}>
        PASS
      </motion.div>
      <div className="profile-copy">
        <h1>
          {profile.name}, {profile.age}
          {profile.verified && (
            <span>
              <Icon icon="solar:verified-check-bold" />
            </span>
          )}
        </h1>
        <h2>
          {profile.city} · {profile.distance} km away
        </h2>
        <p>{profile.bio}</p>
        <div className="profile-interests">
          {profile.interests.map((item) => (
            <span key={item.label}>
              <Icon icon={item.icon} />
              {item.label}
            </span>
          ))}
        </div>
      </div>
      <button className="profile-info" aria-label="Profile details">
        <Icon icon="solar:info-circle-bold" />
      </button>
    </motion.article>
  );
}
