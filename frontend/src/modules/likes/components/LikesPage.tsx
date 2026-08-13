import { Icon } from '@iconify/react';
import { motion } from 'motion/react';
import { useState } from 'react';
import type { DiscoverProfile } from '@/modules/discover/@types';
import { LoveReactionSurface } from '@/modules/app-shell/components/LoveReactionSurface';

export function LikesPage({
  profiles,
  onDateNight,
  onMenu,
  onOpenConversation,
}: {
  profiles: DiscoverProfile[];
  onDateNight: () => void;
  onMenu: () => void;
  onOpenConversation: (profile: DiscoverProfile) => void;
}) {
  const [selectedProfile, setSelectedProfile] = useState<DiscoverProfile | null>(null);
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
              role="button"
              tabIndex={0}
              onClick={() => setSelectedProfile(profile)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') setSelectedProfile(profile);
              }}
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
      {selectedProfile && (
        <motion.section className="liked-profile-detail" initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }}>
          <header className="liked-profile-header">
            <button type="button" onClick={() => setSelectedProfile(null)} aria-label="Back"><Icon icon="solar:alt-arrow-left-linear" /></button>
            <strong>{selectedProfile.name.toLowerCase().replace(/\s+/g, '')}</strong>
            <button type="button" aria-label="More options"><Icon icon="solar:menu-dots-bold" /></button>
          </header>
          <div className="liked-profile-scroll">
            <div className="liked-profile-overview">
              <div className="liked-profile-avatar"><img src={selectedProfile.image} alt={selectedProfile.name} /><i /></div>
              <div><strong>{selectedProfile.age}</strong><span>Age</span></div>
              <div><strong>{selectedProfile.distance}</strong><span>km away</span></div>
              <div><strong>{selectedProfile.interests.length}</strong><span>Interests</span></div>
            </div>
            <div className="liked-profile-copy">
              <h1>{selectedProfile.name} {selectedProfile.verified && <Icon icon="solar:verified-check-bold" />}</h1>
              <span><Icon icon="solar:map-point-bold" /> {selectedProfile.city}</span>
              <p>{selectedProfile.bio || 'Say hello and get to know each other.'}</p>
            </div>
            <div className="liked-profile-actions">
              <button type="button" onClick={() => onOpenConversation(selectedProfile)}>Message</button>
              <button type="button" aria-label="Like"><Icon icon="solar:heart-bold" /></button>
            </div>
            <div className="liked-profile-highlights">
              {selectedProfile.interests.map((interest) => <div key={interest.label}><span><Icon icon={interest.icon} /></span><small>{interest.label}</small></div>)}
            </div>
            <div className="liked-profile-tabs"><Icon icon="solar:gallery-wide-bold" /><Icon icon="solar:heart-angle-bold" /></div>
            <div className="liked-profile-grid">
              {[0, 1, 2, 3, 4, 5].map((item) => <img key={item} src={selectedProfile.image} alt="" />)}
            </div>
          </div>
        </motion.section>
      )}
    </section>
  );
}
