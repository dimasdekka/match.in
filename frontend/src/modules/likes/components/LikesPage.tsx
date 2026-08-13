import { Icon } from '@iconify/react';
import { motion } from 'motion/react';
import type { DiscoverProfile } from '@/modules/discover/constants/profile';
import { LoveReactionSurface } from '@/modules/app-shell/components/LoveReactionSurface';

export function LikesPage({
  profiles,
  onDateNight,
  onMenu,
}: {
  profiles: DiscoverProfile[];
  onDateNight: () => void;
  onMenu: () => void;
}) {
  return (
    <section className="app-page likes-page">
      <div className="likes-toolbar">
        <button type="button" className="app-circle-button" onClick={onMenu} aria-label="Menu">
          <Icon icon="solar:widget-4-bold" />
        </button>
        <button
          type="button"
          className="app-circle-button"
          onClick={onDateNight}
          aria-label="Date Night"
        >
          <Icon icon="solar:heart-bold" />
        </button>
      </div>
      {profiles.length > 0 ? (
        <div className="liked-grid">
          {profiles.map((profile) => (
            <motion.article
              key={profile.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <img src={profile.image} alt={profile.name} />
              <div>
                <strong>
                  {profile.name}, {profile.age}
                </strong>
                <span>
                  {profile.city} · {profile.distance} km
                </span>
              </div>
            </motion.article>
          ))}
        </div>
      ) : (
        <LoveReactionSurface>
          <div className="empty-state likes-empty">
            <div className="stacked-cards">
              <span />
              <span>
                <Icon icon="solar:heart-bold" />
              </span>
            </div>
            <h2>Find your match</h2>
            <p>
              Profiles you like
              <br />
              will appear here
            </p>
          </div>
        </LoveReactionSurface>
      )}
    </section>
  );
}
