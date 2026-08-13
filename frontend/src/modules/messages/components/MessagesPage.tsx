import { useState } from 'react';
import { Icon } from '@iconify/react';
import { AnimatePresence, motion } from 'motion/react';
import type { DiscoverProfile } from '@/modules/discover/constants/profile';
import { LoveReactionSurface } from '@/modules/app-shell/components/LoveReactionSurface';
import { useCurrentProfile } from '@/modules/app-shell/hooks/useCurrentProfile';

interface Props {
  profiles: DiscoverProfile[];
  onDiscover: () => void;
  onProfile: () => void;
}

export function MessagesPage({ profiles, onDiscover, onProfile }: Props) {
  const currentProfile = useCurrentProfile();
  const [activeChat, setActiveChat] = useState<DiscoverProfile | null>(null);
  const [draft, setDraft] = useState('');
  const [sentMessages, setSentMessages] = useState<Record<number, string[]>>({});
  const send = () => {
    if (!draft.trim()) return;
    if (!activeChat) return;
    setSentMessages((current) => ({
      ...current,
      [activeChat.id]: [...(current[activeChat.id] ?? []), draft.trim()],
    }));
    setDraft('');
  };

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
              onClick={() => setActiveChat(profile)}
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
      <AnimatePresence>
        {activeChat && (
          <motion.div
            className="chat-screen"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          >
            <header className="chat-header">
              <button type="button" onClick={() => setActiveChat(null)}>
                <Icon icon="solar:alt-arrow-left-linear" />
              </button>
              <img src={activeChat.image} alt="" />
              <div>
                <strong>{activeChat.name}</strong>
                <small>Online now</small>
              </div>
              <button type="button">
                <Icon icon="solar:menu-dots-bold" />
              </button>
            </header>
            <div className="chat-messages">
              <p className="chat-date">You matched today</p>
              <div className="bubble incoming">Hi! Nice to meet you here 👋</div>
              <div className="bubble incoming">What&apos;s your ideal weekend?</div>
              {(sentMessages[activeChat.id] ?? []).map((message, index) => (
                <motion.div
                  className="bubble outgoing"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={`${message}-${index}`}
                >
                  {message}
                </motion.div>
              ))}
            </div>
            <form
              className="chat-composer"
              onSubmit={(event) => {
                event.preventDefault();
                send();
              }}
            >
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Send a message..."
              />
              <button type="submit" disabled={!draft.trim()}>
                <Icon icon="solar:plain-2-bold" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
