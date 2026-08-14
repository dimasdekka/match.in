import { useState, useEffect, useCallback } from 'react';
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
import { IncomingLikeNotification } from '@/modules/app-shell/components/IncomingLikeNotification';
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
  const [incomingLikes, setIncomingLikes] = useState<DiscoverProfile[]>([]);
  const deck = useDiscoverDeck();
  const storedProfile = readJson<ProfileFormData | null>('matchin:onboarding-profile', null);

  const fetchIncomingLikes = useCallback(async () => {
    try {
      const res = await api.getLikesReceived();
      if (res?.profiles) {
        const mapped: DiscoverProfile[] = res.profiles.map((p) => {
          let photos: string[] = [];
          try {
            photos = typeof p.photos === 'string' ? JSON.parse(p.photos) : p.photos || [];
          } catch {
            photos = [];
          }
          return {
            id: p.user_id || p.id,
            name: p.name,
            age: p.age,
            city: p.city || 'Jakarta',
            distance: 3,
            bio: p.bio || '',
            image: photos[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
            verified: p.is_verified ?? true,
            interests: [],
          };
        });
        setIncomingLikes(mapped);
      }
    } catch {}
  }, []);

  useEffect(() => {
    void fetchIncomingLikes();
    const interval = setInterval(fetchIncomingLikes, 5000);
    return () => clearInterval(interval);
  }, [fetchIncomingLikes]);

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
                <div className="brand-empty-state">
                  <div className="brand-empty-icon" aria-hidden="true">
                    <Icon icon="solar:radar-2-bold-duotone" />
                  </div>
                  <div className="brand-empty-copy">
                    <h3>Semua profil sudah dilihat</h3>
                    <p>
                      Coba muat ulang atau perluas preferensi untuk menemukan lebih banyak orang.
                    </p>
                  </div>
                  <div className="brand-empty-actions">
                    <button
                      type="button"
                      onClick={() => deck.reload()}
                      className="brand-empty-button primary"
                    >
                      <Icon icon="solar:restart-bold" /> Muat ulang
                    </button>
                    <button
                      type="button"
                      onClick={() => setOverlay('settings')}
                      className="brand-empty-button secondary"
                    >
                      <Icon icon="solar:tuning-2-bold" /> Ubah filter
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </AnimatePresence>
        {!conversation && !overlay && <DiscoverNavigation active={activeNav} onChange={setActiveNav} />}
      </div>
      <IncomingLikeNotification
        incomingLikes={incomingLikes}
        onOpenConversation={setConversation}
        onDismissLike={(id) => setIncomingLikes((prev) => prev.filter((p) => p.id !== id))}
      />
      <MatchFeedback profile={deck.match} onClose={deck.closeMatch} />
    </main>
  );
}
