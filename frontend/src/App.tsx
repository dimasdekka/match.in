import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { DiscoverPage } from '@/modules/discover';
import { OnboardingWizard, WelcomeScreen } from '@/modules/onboarding';
import type { ProfileFormData } from '@/modules/onboarding/@types';
import { api, getTelegramInitData } from '@/utils/api';
import './i18n';

type EntryScreen = 'loading' | 'welcome' | 'onboarding' | 'app';

export default function App() {
  const [screen, setScreen] = useState<EntryScreen>('loading');
  const [initialTelegramName, setInitialTelegramName] = useState('');

  useEffect(() => {
    const telegram = (window as any).Telegram?.WebApp;
    telegram?.ready();
    telegram?.expand();
    setInitialTelegramName(telegram?.initDataUnsafe?.user?.first_name ?? '');

    if (window.localStorage.getItem('matchin:onboarding-profile')) {
      setScreen('app');
      return;
    }

    const loadProfile = async () => {
      for (let attempt = 0; attempt < 10; attempt += 1) {
        const initData = getTelegramInitData();
        if (initData && !initData.includes('100000001')) break;
        await new Promise((resolve) => window.setTimeout(resolve, 50));
      }

      try {
        const { profile } = await api.getMyProfile();
        setScreen(profile?.id && profile.name.trim() ? 'app' : 'welcome');
      } catch (error) {
        console.error('Failed to load profile', error);
        setScreen('welcome');
      }
    };

    void loadProfile();
  }, []);

  const completeOnboarding = (profile: ProfileFormData) => {
    window.localStorage.setItem('matchin:onboarding-profile', JSON.stringify(profile));
    setScreen('app');
  };

  if (screen === 'loading') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-[var(--color-background)] text-[var(--color-text)]">
        <div className="match-gradient match-shadow-btn flex h-16 w-16 animate-pulse items-center justify-center rounded-full text-white">
          <Heart className="h-8 w-8 fill-white" />
        </div>
        <span className="text-xl font-black tracking-tight">
          match<span className="text-[var(--color-brand)]">.in</span>
        </span>
      </div>
    );
  }

  if (screen === 'welcome') return <WelcomeScreen onContinue={() => setScreen('onboarding')} />;
  if (screen === 'onboarding') {
    return <OnboardingWizard initialName={initialTelegramName} onComplete={completeOnboarding} />;
  }
  return <DiscoverPage />;
}
