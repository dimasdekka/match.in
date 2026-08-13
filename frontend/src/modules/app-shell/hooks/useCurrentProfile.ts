import { useMemo } from 'react';
import { readJson } from '@/utils/storage';
import { getTelegramUser } from '@/utils/telegram';
import type { ProfileFormData } from '@/modules/onboarding/@types';

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
    const profile = readJson('matchin:onboarding-profile', FALLBACK_PROFILE);

    const telegramUsername = getTelegramUser()?.username;
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
