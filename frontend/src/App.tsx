import { useState, useEffect } from 'react';
import './i18n';
import { Header } from './components/Header';
import { Navbar, type TabType } from './components/Navbar';
import { DiscoverPage } from './pages/DiscoverPage';
import { MatchesPage } from './pages/MatchesPage';
import { ProfilePage } from './pages/ProfilePage';
import { FilterModal } from './components/FilterModal';
import { MatchModal } from './components/MatchModal';
import { api } from './services/api';
import type { User, SwipeResponse } from './types';
import type { FilterSchemaType } from './schemas';

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>('discover');
  const [currentLang, setCurrentLang] = useState<string>('id');
  const [user, setUser] = useState<User | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<Partial<FilterSchemaType>>({
    target_location_mode: 'same_city',
    target_gender: 'all',
    min_age_pref: 18,
    max_age_pref: 50,
  });
  const [matchData, setMatchData] = useState<SwipeResponse | null>(null);
  const [matchesCount, setMatchesCount] = useState<number>(0);

  useEffect(() => {
    // Expand Telegram Mini App viewport if inside Telegram
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready?.();
      window.Telegram.WebApp.expand?.();
    }

    // Fetch user session on load
    api.getMe()
      .then((res) => {
        if (res?.user) {
          setUser(res.user);
          if (res.user.language_code) {
            setCurrentLang(res.user.language_code);
          }
        }
      })
      .catch((err) => {
        console.warn('Backend user session not available or offline:', err);
      });
  }, []);

  const handleApplyFilter = (newFilters: FilterSchemaType) => {
    setFilters(newFilters);
  };

  const handleMatch = (response: SwipeResponse) => {
    setMatchData(response);
    setMatchesCount((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-pink-500 selection:text-white pb-16">
      {/* Header */}
      <Header
        currentLang={currentLang}
        onLanguageChange={setCurrentLang}
        onOpenFilter={() => setIsFilterOpen(true)}
        user={user}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-md mx-auto flex flex-col justify-start">
        {activeTab === 'discover' && (
          <DiscoverPage
            onMatch={handleMatch}
            onOpenFilter={() => setIsFilterOpen(true)}
          />
        )}
        {activeTab === 'matches' && (
          <MatchesPage onMatchesCountChange={setMatchesCount} />
        )}
        {activeTab === 'profile' && <ProfilePage />}
      </main>

      {/* Bottom Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        matchesCount={matchesCount}
      />

      {/* Preferences Filter Modal */}
      <FilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApplyFilter={handleApplyFilter}
        currentFilters={filters}
      />

      {/* Mutual Match Modal */}
      <MatchModal
        matchData={matchData}
        onClose={() => setMatchData(null)}
      />
    </div>
  );
}

export default App;
