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
import type { LocationFilterMode, ProfileFormData, Profile } from './types';
import { api } from './services/api';
import { Heart, RefreshCw } from 'lucide-react';
import './i18n';

export const App: React.FC = () => {
  const { i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<NavTab>('discover');
  const [currentLang, setCurrentLang] = useState<string>(i18n.language || 'id');
  const [locationMode] = useState<LocationFilterMode>('same_city');

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
        if (profRes.profile) {
          setUserProfile(profRes.profile);
          setShowWelcome(false);
          setShowOnboarding(false);
        } else {
          setShowWelcome(true);
        }

        const recRes = await api.getRecommendations(10);
        setProfiles(recRes.profiles || []);
      } catch (e) {
        console.error('Failed to load profile/recommendations', e);
      } finally {
        setLoading(false);
      }
    };

    loadAppData();
  }, []);

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
    } catch (e) {
      alert('Failed to save profile during registration');
    }
  };

  const currentCandidate = profiles[currentIndex];

  return (
    <div className="min-h-screen match-bg text-slate-900 flex flex-col font-sans selection:bg-pink-500 selection:text-white">
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

      {/* Screen 2 Top Header */}
      <Header
        currentLang={currentLang}
        onLanguageChange={(lang) => setCurrentLang(lang)}
      />

      {/* Main Content Area (NavTab based) */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Screen 2: Discover / Swipe Tab */}
        {activeTab === 'discover' && (
          loading ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-[#FF3366]" />
              <p className="text-xs font-semibold">Finding matches nearby...</p>
            </div>
          ) : currentCandidate ? (
            <DiscoverCard profile={currentCandidate} onSwipe={handleSwipe} />
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-8 bg-white rounded-[32px] border border-pink-100 shadow-xl max-w-sm my-auto space-y-4">
              <div className="w-16 h-16 rounded-full match-gradient flex items-center justify-center text-white match-shadow-btn">
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
          )
        )}

        {/* Screen 5: Likes Tab */}
        {activeTab === 'likes' && (
          <LikesPage onOpenMatchesCount={() => {}} />
        )}

        {/* Chats Tab: Displays Active Conversations or Launches Screen 4 Chat View */}
        {activeTab === 'chats' && (
          <div className="w-full max-w-md mx-auto space-y-4 pb-24 animate-fade-in">
            <h2 className="text-xl font-extrabold text-slate-900 pt-1 px-2">Chats</h2>
            <div
              onClick={() =>
                setActiveChatProfile({
                  id: 999,
                  user_id: 999,
                  name: 'Jane',
                  age: 26,
                  gender: 'female',
                  target_gender: 'all',
                  bio: 'Love traveling, coffee, and good conversations.',
                  voice_bio_url: '',
                  country: 'Indonesia',
                  city: 'Jakarta',
                  target_location_mode: locationMode,
                  min_age_pref: 18,
                  max_age_pref: 35,
                  photos: '["https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80"]',
                  interests: '["Travel","Coffee","Design"]',
                  is_verified: true,
                })
              }
              className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white border border-pink-100 shadow-xs hover:shadow-md transition cursor-pointer"
            >
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80"
                  alt="Jane"
                  className="w-14 h-14 rounded-full object-cover border-2 border-pink-100"
                />
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Jane</h3>
                  <span className="text-[10px] text-slate-400">10:34</span>
                </div>
                <p className="text-xs text-pink-600 font-medium truncate mt-0.5">
                  Cappadocia! It was absolutely stunning 😍
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Screen 6: Profile Tab */}
        {activeTab === 'profile' && <ProfilePage />}
      </main>

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

      {/* Floating Bottom Tab Bar (Screen 2/5/6 Bottom Nav) */}
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
      />
    </div>
  );
};

export default App;
