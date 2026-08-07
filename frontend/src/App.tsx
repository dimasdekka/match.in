import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Header } from './components/Header';
import { LocationFilterModal } from './components/LocationFilterModal';
import { Discover } from './pages/Discover';
import { Matches } from './pages/Matches';
import { ProfileEdit } from './pages/ProfileEdit';
import type { LocationFilterMode } from './types';
import { Flame, Heart, User } from 'lucide-react';
import './i18n';

type Tab = 'discover' | 'matches' | 'profile';

export const App: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('discover');
  const [currentLang, setCurrentLang] = useState<string>(i18n.language || 'id');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [locationMode, setLocationMode] = useState<LocationFilterMode>('same_city');

  useEffect(() => {
    // Initialize Telegram WebApp SDK viewport & theme
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp;
      tg.ready();
      tg.expand();
      if (tg.initDataUnsafe?.user?.language_code) {
        const userLang = tg.initDataUnsafe.user.language_code.startsWith('id') ? 'id' : 'en';
        i18n.changeLanguage(userLang);
        setCurrentLang(userLang);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-pink-500 selection:text-white">
      {/* Header with dynamic branding */}
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

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-md border-t border-slate-800/80 px-6 py-2.5 flex items-center justify-around">
        <button
          onClick={() => setActiveTab('discover')}
          className={`flex flex-col items-center gap-1 text-xs font-semibold transition ${
            activeTab === 'discover'
              ? 'text-pink-400 scale-105'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Flame className="w-5 h-5" />
          <span>{t('tabDiscover')}</span>
        </button>

        <button
          onClick={() => setActiveTab('matches')}
          className={`flex flex-col items-center gap-1 text-xs font-semibold transition ${
            activeTab === 'matches'
              ? 'text-pink-400 scale-105'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Heart className="w-5 h-5" />
          <span>{t('tabMatches')}</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 text-xs font-semibold transition ${
            activeTab === 'profile'
              ? 'text-pink-400 scale-105'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <User className="w-5 h-5" />
          <span>{t('tabProfile')}</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
