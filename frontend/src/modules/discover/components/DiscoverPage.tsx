import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { DiscoverHeader } from './DiscoverHeader';
import { ProfileCard } from './ProfileCard';
import { SwipeActions } from './SwipeActions';
import { DiscoverNavigation, type DiscoverNavId } from './DiscoverNavigation';
import { MatchFeedback } from './MatchFeedback';
import { useDiscoverDeck } from '../hooks/useDiscoverDeck';
import { LikesPage } from '@/modules/likes';
import { ConversationPage, MessagesPage } from '@/modules/messages';
import type { DiscoverProfile } from '../@types';
import { ProfilePage, SettingsPage } from '@/modules/profile';
import { DateNightPage } from '@/modules/date-night';
import '@/modules/app-shell/styles.css';
import '@/modules/app-shell/pages.css';
import '../styles.css';

type OverlayPage = 'profile' | 'settings' | 'date-night' | null;

export function DiscoverPage() {
  const [activeNav, setActiveNav] = useState<DiscoverNavId>('discover');
  const [overlay, setOverlay] = useState<OverlayPage>(null);
  const [conversation, setConversation] = useState<DiscoverProfile | null>(null);
  const deck = useDiscoverDeck();

  return (
    <main className="discover-shell">
      <div className="discover-phone">
        <AnimatePresence mode="wait">
          {conversation && (
            <ConversationPage
              key={`conversation-${conversation.id}`}
              profile={conversation}
              onBack={() => setConversation(null)}
            />
          )}
          {!conversation && overlay === 'profile' && (
            <ProfilePage
              key="profile"
              onBack={() => setOverlay(null)}
              onSettings={() => setOverlay('settings')}
            />
          )}
          {!conversation && overlay === 'settings' && (
            <SettingsPage key="settings" onBack={() => setOverlay('profile')} />
          )}
          {!conversation && overlay === 'date-night' && (
            <DateNightPage
              key="date-night"
              onBack={() => setOverlay(null)}
              onStart={() => {
                setOverlay(null);
                setActiveNav('discover');
              }}
            />
          )}
          {!conversation && !overlay && activeNav === 'likes' && (
            <LikesPage
              key="likes"
              profiles={deck.likedProfiles}
              onMenu={() => setOverlay('profile')}
              onDateNight={() => setOverlay('date-night')}
              onOpenConversation={setConversation}
            />
          )}
          {!conversation && !overlay && activeNav === 'chats' && (
            <MessagesPage
              key="chats"
              profiles={deck.likedProfiles}
              onProfile={() => setOverlay('profile')}
              onDiscover={() => setActiveNav('discover')}
              onOpenConversation={setConversation}
            />
          )}
          {!conversation && !overlay && activeNav === 'discover' && (
            <div className="discover-view" key="discover">
              <DiscoverHeader onProfile={() => setOverlay('profile')} />
              <div className="profile-deck">
                <ProfileCard
                  key={`background-${deck.nextProfile.id}`}
                  profile={deck.nextProfile}
                  onSwipe={deck.decide}
                  background
                />
                <AnimatePresence custom={deck.direction} initial={false}>
                  <ProfileCard
                    key={`active-${deck.profile.id}`}
                    profile={deck.profile}
                    onSwipe={deck.decide}
                  />
                </AnimatePresence>
              </div>
              <SwipeActions onSwipe={deck.decide} />
            </div>
          )}
        </AnimatePresence>
        {!conversation && !overlay && <DiscoverNavigation active={activeNav} onChange={setActiveNav} />}
      </div>
      <MatchFeedback profile={deck.match} onClose={deck.closeMatch} />
    </main>
  );
}
