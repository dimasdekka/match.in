import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Icon } from '@iconify/react';
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
              <DiscoverHeader
                onProfile={() => setActiveNav('profile')}
                feedMode={deck.feedMode}
                onFeedModeChange={deck.setFeedMode}
                onFilterClick={() => setOverlay('settings')}
              />

              {deck.loading ? (
                <div className="flex flex-col items-center justify-center flex-1 text-neutral-400 gap-3">
                  <Icon icon="svg-spinners:ring-resize" className="w-10 h-10 text-pink-500 animate-spin" />
                  <p className="text-sm font-semibold">Mencari rekomendasi profil...</p>
                </div>
              ) : deck.profile ? (
                <>
                  <div className="profile-deck">
                    {deck.nextProfile && (
                      <ProfileCard
                        key={`background-${deck.nextProfile.id}`}
                        profile={deck.nextProfile}
                        onSwipe={deck.decide}
                        background
                      />
                    )}
                    <AnimatePresence custom={deck.direction} initial={false}>
                      <ProfileCard
                        key={`active-${deck.profile.id}`}
                        profile={deck.profile}
                        onSwipe={deck.decide}
                      />
                    </AnimatePresence>
                  </div>
                  <SwipeActions onSwipe={deck.decide} />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 text-center p-6 text-neutral-300 gap-4 my-auto">
                  <div className="w-20 h-20 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center text-3xl text-pink-500 shadow-xl">
                    <Icon icon="solar:radar-2-bold" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">Tidak Ada Profil Tersedia</h3>
                    <p className="text-xs text-neutral-400 max-w-[260px] mx-auto mt-1">
                      Anda telah melihat semua rekomendasi di mode ini. Coba ubah mode feed atau perluas preferensi pencarian.
                    </p>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => deck.reload()}
                      className="px-4 py-2 rounded-full bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-pink-600/30"
                    >
                      <Icon icon="solar:restart-bold" /> Muat Ulang
                    </button>
                    <button
                      type="button"
                      onClick={() => setOverlay('settings')}
                      className="px-4 py-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold transition border border-white/10"
                    >
                      Ubah Filter
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </AnimatePresence>
        {!conversation && !overlay && <DiscoverNavigation active={activeNav} onChange={setActiveNav} />}
      </div>
      <MatchFeedback profile={deck.match} onClose={deck.closeMatch} />
    </main>
  );
}
