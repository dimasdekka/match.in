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
import { OnboardingWizard } from '@/modules/onboarding';
import type { ProfileFormData } from '@/modules/onboarding/@types';
import { api } from '@/utils/api';
import { readJson } from '@/utils/storage';
import '@/modules/app-shell/styles.css';
import '@/modules/app-shell/pages.css';
import '../styles.css';

type OverlayPage = 'edit-profile' | 'settings' | 'date-night' | null;

export function DiscoverPage() {
  const [activeNav, setActiveNav] = useState<DiscoverNavId>('discover');
  const [overlay, setOverlay] = useState<OverlayPage>(null);
  const [conversation, setConversation] = useState<DiscoverProfile | null>(null);
  const deck = useDiscoverDeck();
  const storedProfile = readJson<ProfileFormData | null>('matchin:onboarding-profile', null);

  const saveEditedProfile = async (profile: ProfileFormData) => {
    try {
      await api.saveProfile(profile);
    } catch (error) {
      console.error('Failed to save edited profile to backend', error);
    }
    window.localStorage.setItem('matchin:onboarding-profile', JSON.stringify(profile));
    setOverlay(null);
    setActiveNav('profile');
  };

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
          {!conversation && overlay === 'edit-profile' && (
            <OnboardingWizard
              key="edit-profile"
              mode="edit"
              initialData={storedProfile ?? undefined}
              onCancel={() => setOverlay(null)}
              onComplete={saveEditedProfile}
            />
          )}
          {!conversation && overlay === 'settings' && (
            <SettingsPage key="settings" onBack={() => setOverlay(null)} />
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
              onMenu={() => setActiveNav('profile')}
              onDateNight={() => setOverlay('date-night')}
              onOpenConversation={setConversation}
            />
          )}
          {!conversation && !overlay && activeNav === 'chats' && (
            <MessagesPage
              key="chats"
              profiles={deck.likedProfiles}
              onProfile={() => setActiveNav('profile')}
              onDiscover={() => setActiveNav('discover')}
              onOpenConversation={setConversation}
            />
          )}
          {!conversation && !overlay && activeNav === 'profile' && (
            <ProfilePage
              key="profile"
              onBack={() => setActiveNav('discover')}
              onSettings={() => setOverlay('settings')}
              onEdit={() => setOverlay('edit-profile')}
            />
          )}
          {!conversation && !overlay && activeNav === 'discover' && (
            <div className="discover-view" key="discover">
              <DiscoverHeader onProfile={() => setActiveNav('profile')} />
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
