import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Header } from './components/Header';
import { LocationFilterModal } from './components/LocationFilterModal';
import { OnboardingWizard } from './components/OnboardingWizard';
import { Discover } from './pages/Discover';
import { Matches } from './pages/Matches';
import { ProfileEdit } from './pages/ProfileEdit';
import type { LocationFilterMode, ProfileFormData, Profile } from './types';
import { api } from './services/api';
import { Flame, Heart, User } from 'lucide-react';
import './i18n';

type Tab = 'discover' | 'matches' | 'profile';

export const App: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('discover');
  const [currentLang, setCurrentLang] = useState<string>(i18n.language || 'id');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [locationMode, setLocationMode] = useState<LocationFilterMode>('same_city');
  
  const [, setUserProfile] = useState<Profile | null>(null);
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

    const checkUserProfile = async () => {
      try {
        const res = await api.getMyProfile();
        if (res.profile) {
          setUserProfile(res.profile);
          setShowOnboarding(false);
        } else {
          setShowOnboarding(true);
        }
      } catch (e) {
        setShowOnboarding(true);
      }
    };

    checkUserProfile();
  }, []);

  const handleCompleteOnboarding = async (formData: ProfileFormData) => {
    try {
      const res = await api.saveProfile(formData);
      setUserProfile(res.profile);
      setShowOnboarding(false);
    } catch (e) {
      alert('Failed to save profile during registration');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-pink-500 selection:text-white">
      {/* Onboarding Wizard for New Users */}
      {showOnboarding && (
        <OnboardingWizard
          initialName={initialTelegramName}
          onComplete={handleCompleteOnboarding}
        />
      )}

      {/* iOS Floating Header */}
      <Header
        onOpenFilter={() => setShowFilterModal(true)}
        currentLang={currentLang}
        onLanguageChange={(lang) => setCurrentLang(lang)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {activeTab === 'discover' && (
          <Discover
            onOpenMatches={() => setActiveTab('matches')}
            locationFilterMode={locationMode}
          />
        )}
        {activeTab === 'matches' && <Matches />}
        {activeTab === 'profile' && <ProfileEdit />}
      </main>

      {/* Location Filter Modal */}
      {showFilterModal && (
        <LocationFilterModal
          currentMode={locationMode}
          onSelectMode={(mode) => setLocationMode(mode)}
          onClose={() => setShowFilterModal(false)}
        />
      )}

      {/* iOS Floating Bottom Glass Tab Bar */}
      <div className="fixed bottom-4 left-4 right-4 z-40 max-w-md mx-auto">
        <nav className="ios-glass rounded-full px-6 py-3 flex items-center justify-around shadow-2xl border border-white/15">
          <button
            onClick={() => setActiveTab('discover')}
            className={`flex flex-col items-center gap-1 text-xs font-bold transition-all duration-200 ${
              activeTab === 'discover'
                ? 'text-pink-400 scale-110'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className={`w-5 h-5 ${activeTab === 'discover' ? 'text-pink-400 fill-pink-400/20' : ''}`} />
            <span>{t('tabDiscover')}</span>
          </button>

          <button
            onClick={() => setActiveTab('matches')}
            className={`flex flex-col items-center gap-1 text-xs font-bold transition-all duration-200 ${
              activeTab === 'matches'
                ? 'text-pink-400 scale-110'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Heart className={`w-5 h-5 ${activeTab === 'matches' ? 'text-pink-400 fill-pink-400/20' : ''}`} />
            <span>{t('tabMatches')}</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center gap-1 text-xs font-bold transition-all duration-200 ${
              activeTab === 'profile'
                ? 'text-pink-400 scale-110'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className={`w-5 h-5 ${activeTab === 'profile' ? 'text-pink-400 fill-pink-400/20' : ''}`} />
            <span>{t('tabProfile')}</span>
          </button>
        </nav>
      </div>
    </div>
  );
};

export default App;
