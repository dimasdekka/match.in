import { Icon } from '@iconify/react';
import { motion } from 'motion/react';
import type { DiscoverProfile } from '@/modules/discover/@types';
import { LoveReactionSurface } from '@/modules/app-shell/components/LoveReactionSurface';
import { useCurrentProfile } from '@/modules/app-shell/hooks/useCurrentProfile';

interface Props {
  profiles: DiscoverProfile[];
  onDiscover: () => void;
  onProfile: () => void;
  onOpenConversation: (profile: DiscoverProfile) => void;
}

export function MessagesPage({ profiles, onDiscover, onProfile, onOpenConversation }: Props) {
  const currentProfile = useCurrentProfile();

  return (
    <section className="app-page messages-page">
      <header className="messages-header fixed-page-header">
        <span />
        <h1>Messages</h1>
        <button type="button" className="profile-monogram" onClick={onProfile} aria-label="Profile">
          {currentProfile.mainPhoto ? (
            <img src={currentProfile.mainPhoto} alt={currentProfile.name} />
          ) : (
            currentProfile.initials
          )}
        </button>
      </header>
      {profiles.length === 0 ? (
        <LoveReactionSurface>
          <div className="empty-state messages-empty">
            <div className="message-heart-icon">
              <Icon icon="solar:chat-round-heart-bold" />
              <Icon icon="solar:stars-bold" className="message-spark" />
            </div>
            <h2>No conversations yet</h2>
            <p>
              Start a new chat by
              <br />
              finding your matches
            </p>
            <motion.button
              type="button"
              className="pink-action"
              onClick={onDiscover}
              whileTap={{ scale: 0.96 }}
            >
              <Icon icon="solar:magnifer-linear" /> Find Matches
            </motion.button>
          </div>
        </LoveReactionSurface>
      ) : (
        <div className="conversation-list">
          {profiles.map((profile, index) => (
            <motion.button
              type="button"
              key={profile.id}
              onClick={() => onOpenConversation(profile)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <span className="conversation-avatar">
                <img src={profile.image} alt="" />
                <i />
              </span>
              <span>
                <strong>{profile.name}</strong>
                <small>
                  {index === 0 ? 'You matched! Say hello 💕' : 'Start a new conversation'}
                </small>
              </span>
              <time>Now</time>
            </motion.button>
          ))}
        </div>
      )}
      <motion.button
        className="compose-button"
        type="button"
        onClick={onDiscover}
        whileTap={{ scale: 0.9 }}
      >
        <Icon icon="solar:pen-new-round-bold" />
      </motion.button>
    </section>
  );
}
