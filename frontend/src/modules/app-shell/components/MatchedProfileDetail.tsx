import { Icon } from '@iconify/react';
import { motion } from 'motion/react';
import type { DiscoverProfile } from '@/modules/discover/@types';

export function MatchedProfileDetail({ profile, onBack }: { profile: DiscoverProfile; onBack: () => void }) {
  return (
    <motion.section className="liked-profile-detail" initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 28 }}>
      <header className="liked-profile-header">
        <button type="button" onClick={onBack} aria-label="Back to conversation"><Icon icon="solar:alt-arrow-left-linear" /></button>
        <strong>{profile.name.toLowerCase().replace(/\s+/g, '')}</strong>
        <span />
      </header>
      <div className="liked-profile-scroll">
        <div className="liked-profile-overview">
          <div className="liked-profile-avatar"><img src={profile.image} alt={profile.name} /><i /></div>
          <div><strong>{profile.age}</strong><span>Age</span></div>
          <div><strong>{profile.distance}</strong><span>km away</span></div>
          <div><strong>{profile.interests.length}</strong><span>Interests</span></div>
        </div>
        <div className="liked-profile-copy">
          <h1>{profile.name} {profile.verified && <Icon icon="solar:verified-check-bold" />}</h1>
          <span><Icon icon="solar:map-point-bold" /> {profile.city}</span>
          <p>{profile.bio || 'Say hello and get to know each other.'}</p>
        </div>
        <div className="liked-profile-highlights">
          {profile.interests.map((interest) => <div key={interest.label}><span><Icon icon={interest.icon} /></span><small>{interest.label}</small></div>)}
        </div>
        <div className="liked-profile-tabs"><Icon icon="solar:gallery-wide-bold" /><Icon icon="solar:heart-angle-bold" /></div>
        <div className="liked-profile-grid">{[0, 1, 2, 3, 4, 5].map((item) => <img key={item} src={profile.image} alt="" />)}</div>
      </div>
    </motion.section>
  );
}
