import { Icon } from '@iconify/react';
import { motion, useMotionValue, useTransform } from 'motion/react';
import type { DiscoverProfile, SwipeDecision } from '../@types';

const cardVariants = {
  enter: { opacity: 1, scale: 1, y: 0 },
  exit: (direction: number) => ({
    x: direction * 520,
    rotate: direction * 22,
    opacity: 0,
    transition: { duration: 0.24, ease: 'easeOut' as const },
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
  const rotate = useTransform(x, [-260, 0, 260], [-18, 0, 18]);
  const scale = useTransform(x, [-260, 0, 260], [1.02, 1, 1.02]);

  // Stamp opacities and scales
  const likeOpacity = useTransform(x, [15, 90], [0, 1]);
  const likeScale = useTransform(x, [15, 90], [0.8, 1.08]);

  const passOpacity = useTransform(x, [-90, -15], [1, 0]);
  const passScale = useTransform(x, [-90, -15], [1.08, 0.8]);

  // Dynamic ambient glow
  const likeGlowOpacity = useTransform(x, [0, 140], [0, 0.35]);
  const passGlowOpacity = useTransform(x, [-140, 0], [0.35, 0]);

  return (
    <motion.article
      className="discover-profile-card"
      data-background={background || undefined}
      style={background ? undefined : { x, rotate, scale }}
      drag={background ? false : 'x'}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.65}
      dragMomentum={false}
      onDragEnd={(_, info) => {
        if (background) return;
        const offset = info.offset.x;
        const velocity = info.velocity.x;
        if (offset > 90 || velocity > 380) {
          onSwipe('like');
        } else if (offset < -90 || velocity < -380) {
          onSwipe('pass');
        }
      }}
      initial={background ? false : { opacity: 1, scale: 0.96 }}
      animate={background ? undefined : 'enter'}
      exit={background ? undefined : 'exit'}
      variants={cardVariants}
      transition={{ type: 'spring', stiffness: 420, damping: 32, mass: 0.7 }}
    >
      <div className="profile-card-clip">
        <img src={profile.image} alt={profile.name} draggable={false} decoding="async" />
        <div className="profile-shade" />

        {/* Ambient Color Glow Overlays */}
        {!background && (
          <>
            <motion.div
              className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-emerald-600/60 via-emerald-400/20 to-transparent z-[2]"
              style={{ opacity: likeGlowOpacity }}
            />
            <motion.div
              className="absolute inset-0 pointer-events-none bg-gradient-to-tl from-rose-600/60 via-rose-400/20 to-transparent z-[2]"
              style={{ opacity: passGlowOpacity }}
            />
          </>
        )}

        {/* Modern SUKA Badge (LIKE) */}
        {!background && (
          <motion.div
            className="swipe-stamp modern-like-stamp"
            style={{ opacity: likeOpacity, scale: likeScale }}
          >
            <Icon icon="solar:heart-bold" className="stamp-icon" />
            <span>SUKA</span>
          </motion.div>
        )}

        {/* Modern LEWATI Badge (PASS) */}
        {!background && (
          <motion.div
            className="swipe-stamp modern-pass-stamp"
            style={{ opacity: passOpacity, scale: passScale }}
          >
            <Icon icon="solar:close-circle-bold" className="stamp-icon" />
            <span>LEWATI</span>
          </motion.div>
        )}

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
      </div>
    </motion.article>
  );
}
