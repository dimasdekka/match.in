import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Header } from './components/Header';
import { Navbar, type NavTab } from './components/Navbar';
import { DiscoverCard } from './components/DiscoverCard';
import { MatchModal } from './components/MatchModal';
import { ChatModal } from './components/ChatModal';
import { WelcomeScreen } from './components/WelcomeScreen';
import { LikesPage } from './pages/MatchesPage';
import { ProfilePage } from './pages/ProfilePage';
import { OnboardingWizard } from './components/OnboardingWizard';
import type { ProfileFormData, Profile } from './types';
import { api } from './services/api';
import { Heart, RefreshCw } from 'lucide-react';
import './i18n';

export const App: React.FC = () => {
  const { i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<NavTab>('discover');
  const [currentLang, setCurrentLang] = useState<string>(i18n.language || 'id');


  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const [matchedProfile, setMatchedProfile] = useState<Profile | null>(null);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [activeChatProfile, setActiveChatProfile] = useState<Profile | null>(null);

  const [, setUserProfile] = useState<Profile | null>(null);
  const [showWelcome, setShowWelcome] = useState<boolean>(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [initialTelegramName, setInitialTelegramName] = useState<string>('');
  const [conversations, setConversations] = useState<any[]>([]);
  const [chatsLoading, setChatsLoading] = useState<boolean>(false);

  useEffect(() => {
    let tgName = '';
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp;
      tg.ready();
      tg.expand();
      if (tg.initDataUnsafe?.user) {
        tgName = tg.initDataUnsafe.user.first_name || '';
        setInitialTelegramName(tgName);
        if (tg.initDataUnsafe.user.language_code) {
          const userLang = tg.initDataUnsafe.user.language_code.startsWith('id') ? 'id' : 'en';
          i18n.changeLanguage(userLang);
          setCurrentLang(userLang);
        }
      }
    }

    const loadAppData = async () => {
      setLoading(true);
      try {
        const profRes = await api.getMyProfile();
        if (profRes.profile && profRes.profile.id > 0 && profRes.profile.name.trim() !== '') {
          setUserProfile(profRes.profile);
          setShowWelcome(false);
          setShowOnboarding(false);
        } else {
          setShowWelcome(true);
          setShowOnboarding(false);
        }
      } catch (e) {
        console.error('Failed to load profile', e);
        setShowWelcome(true);
        setShowOnboarding(false);
      }

      try {
        const recRes = await api.getRecommendations(10);
        setProfiles(recRes.profiles || []);
      } catch (e) {
        console.error('Failed to load recommendations', e);
      } finally {
        setLoading(false);
      }
    };

    loadAppData();
  }, []);

  useEffect(() => {
    if (activeTab === 'chats') {
      setChatsLoading(true);
      api.getConversations()
        .then((res) => setConversations(res.conversations || []))
        .catch((err) => console.error('Failed to load conversations', err))
        .finally(() => setChatsLoading(false));
    }
  }, [activeTab]);

  const handleSwipe = async (action: 'like' | 'pass' | 'superlike') => {
    if (currentIndex >= profiles.length) return;
    const current = profiles[currentIndex];
    setCurrentIndex((prev) => prev + 1);

    try {
      const res = await api.swipe(current.id, action);
      if (res.is_match) {
        setMatchedProfile(current);
        setShowMatchModal(true);
      }
    } catch (err) {
      console.error('Failed to process swipe', err);
    }
  };

  const handleCompleteOnboarding = async (formData: ProfileFormData) => {
    try {
      const res = await api.saveProfile(formData);
      setUserProfile(res.profile);
      setShowOnboarding(false);
    } catch (e: any) {
      console.error('Failed to save profile during registration', e);
      alert(`Gagal menyimpan profil: ${e?.message || 'Terjadi kesalahan'}`);
    }
  };

  const currentCandidate = profiles[currentIndex];

  const isFullscreenOverlay = showWelcome || showOnboarding;

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white gap-3">
        <div className="w-16 h-16 rounded-full match-gradient flex items-center justify-center text-white match-shadow-btn animate-pulse">
          <Heart className="w-8 h-8 fill-white" />
        </div>
        <span className="text-xl font-black text-slate-900 tracking-tight">
          match<span className="text-[#FF3366]">.in</span>
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-pink-500 selection:text-white">
      {/* Screen 1: Welcome / Landing Screen */}
      {showWelcome && (
        <WelcomeScreen
          onContinue={() => {
            setShowWelcome(false);
            setShowOnboarding(true);
          }}
        />
      )}

      {/* Onboarding Registration Wizard (after Welcome) */}
      {showOnboarding && (
        <OnboardingWizard
          initialName={initialTelegramName}
          onComplete={handleCompleteOnboarding}
        />
      )}

      {/* Header — hidden during welcome/onboarding */}
      {!isFullscreenOverlay && (
        <Header
          currentLang={currentLang}
          onLanguageChange={(lang) => setCurrentLang(lang)}
        />
      )}

      {/* Main Content Area */}
      {!isFullscreenOverlay && (
      <main className="flex-1 flex flex-col relative overflow-y-auto pb-20">
        {/* Screen 2: Discover / Swipe Tab */}
        {activeTab === 'discover' && (
          loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-[#FF3366]" />
              <p className="text-xs font-semibold">Finding matches nearby...</p>
            </div>
          ) : currentCandidate ? (
            <div className="flex-1 flex flex-col items-center justify-center p-4">
              <DiscoverCard profile={currentCandidate} onSwipe={handleSwipe} />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6">
              <div className="text-center space-y-4 max-w-xs">
                <div className="w-16 h-16 rounded-full match-gradient flex items-center justify-center text-white match-shadow-btn mx-auto">
                  <Heart className="w-8 h-8 fill-white" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Belum Ada Profil Baru</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Kamu telah melihat semua rekomendasi di sekitarmu. Coba ubah filter lokasi atau refresh kembali nanti!
                  </p>
                </div>
                <button
                  onClick={async () => {
                    setLoading(true);
                    setCurrentIndex(0);
                    const res = await api.getRecommendations(10);
                    setProfiles(res.profiles || []);
                    setLoading(false);
                  }}
                  className="px-6 py-3 rounded-full match-gradient text-white font-bold text-xs match-shadow-btn active:scale-95 transition"
                >
                  Refresh Rekomendasi
                </button>
              </div>
            </div>
          )
        )}

        {/* Screen 5: Likes Tab */}
        {activeTab === 'likes' && (
          <LikesPage onOpenMatchesCount={() => {}} />
        )}

        {/* Chats Tab: Displays Active Conversations */}
        {activeTab === 'chats' && (
          <div className="w-full max-w-md mx-auto space-y-3 px-4 pb-24 animate-fade-in">
            <h2 className="text-xl font-extrabold text-slate-900 pt-2">Chats</h2>

            {chatsLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-[#FF3366]" />
                <p className="text-xs">Memuat daftar chat...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-pink-50 flex items-center justify-center text-pink-400 font-bold text-xl">
                  💬
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Belum Ada Chat</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Dapatkan match terlebih dahulu untuk mulai mengobrol!
                  </p>
                </div>
              </div>
            ) : (
              conversations.map((conv) => {
                const prof = conv.matched_profile || {
                  name: conv.matched_user?.first_name || 'User',
                  photos: '[]',
                };
                let photos: string[] = [];
                try {
                  photos = typeof prof.photos === 'string' ? JSON.parse(prof.photos) : prof.photos || [];
                } catch {
                  photos = [];
                }
                const avatar = photos[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80';
                const lastMsg = conv.last_message?.content || 'Match baru! Mulai obrolan sekarang 💕';
                const timeStr = conv.last_message?.created_at
                  ? new Date(conv.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '';

                return (
                  <div
                    key={conv.match_id}
                    onClick={() =>
                      setActiveChatProfile({
                        ...prof,
                        match_id: conv.match_id,
                        user_id: conv.matched_user?.id || 0,
                      })
                    }
                    className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white border border-pink-100 shadow-xs hover:shadow-md transition cursor-pointer active:scale-98"
                  >
                    <div className="relative">
                      <img
                        src={avatar}
                        alt={prof.name}
                        className="w-13 h-13 rounded-full object-cover border-2 border-pink-100"
                      />
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-900">{prof.name}</h3>
                        {timeStr && <span className="text-[10px] text-slate-400">{timeStr}</span>}
                      </div>
                      <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                        {lastMsg}
                      </p>
                    </div>
                    {conv.unread_count > 0 && (
                      <span className="w-5 h-5 rounded-full bg-[#FF3366] text-white text-[10px] font-extrabold flex items-center justify-center">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Screen 6: Profile Tab */}
        {activeTab === 'profile' && <ProfilePage />}
      </main>
      )}

      {/* Screen 3: It's a match! Celebration Modal */}
      {showMatchModal && matchedProfile && (
        <MatchModal
          matchedProfile={matchedProfile}
          onClose={() => setShowMatchModal(false)}
          onOpenMatches={() => {
            setShowMatchModal(false);
            setActiveChatProfile(matchedProfile);
          }}
        />
      )}

      {/* Screen 4: Chat Conversation View Modal */}
      {activeChatProfile && (
        <ChatModal
          matchedProfile={activeChatProfile}
          onClose={() => setActiveChatProfile(null)}
        />
      )}

      {/* Bottom Nav — hidden during welcome/onboarding */}
      {!isFullscreenOverlay && (
        <Navbar
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
        />
      )}
    </div>
  );
};

export default App;
