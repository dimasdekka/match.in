import { useMemo } from 'react';
import type { ProfileFormData } from '@/types';

const FALLBACK_PROFILE: ProfileFormData = {
  name: 'Alex',
  age: 25,
  gender: 'male',
  target_gender: 'female',
  bio: '',
  voice_bio_url: '',
  country: 'Indonesia',
  city: 'Jakarta',
  target_location_mode: 'same_city',
  min_age_pref: 22,
  max_age_pref: 30,
  photos: [],
  interests: [],
};

export function useCurrentProfile() {
  return useMemo(() => {
    let profile = FALLBACK_PROFILE;
    try {
      const stored = window.localStorage.getItem('matchin:onboarding-profile');
      if (stored) profile = { ...FALLBACK_PROFILE, ...JSON.parse(stored) };
    } catch {
      profile = FALLBACK_PROFILE;
    }

    const telegramUsername = window.Telegram?.WebApp?.initDataUnsafe?.user?.username;
    const username = telegramUsername || 'telegram_user';
    const initials =
      profile.name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toLowerCase() || 'mi';

    return {
      ...profile,
      username,
      initials,
      mainPhoto: profile.photos?.[0] || '',
      location: [profile.city, profile.country].filter(Boolean).join(', '),
    };
  }, []);
}
