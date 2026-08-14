import { useEffect, useState } from 'react';
import { readJson, writeJson } from '@/utils/storage';
import { getTelegramUser } from '@/utils/telegram';
import { api } from '@/utils/api';
import type { ProfileFormData } from '@/modules/onboarding/@types';

const FALLBACK_PROFILE: ProfileFormData = {
  name: 'User',
  age: 20,
  gender: 'male',
  target_gender: 'female',
  bio: '',
  voice_bio_url: '',
  country: 'Indonesia',
  city: 'Jakarta',
  target_location_mode: 'same_city',
  min_age_pref: 18,
  max_age_pref: 40,
  photos: [],
  interests: [],
};

export function useCurrentProfile() {
  const [profile, setProfile] = useState<ProfileFormData>(() =>
    readJson('matchin:onboarding-profile', FALLBACK_PROFILE),
  );

  useEffect(() => {
    let mounted = true;
    api.getMyProfile()
      .then(({ profile: realProfile }) => {
        if (!mounted || !realProfile) return;
        let photos: string[] = [];
        try {
          photos = typeof realProfile.photos === 'string' ? JSON.parse(realProfile.photos) : realProfile.photos || [];
        } catch {
          photos = [];
        }

        let interests: string[] = [];
        try {
          interests = typeof realProfile.interests === 'string' ? JSON.parse(realProfile.interests) : realProfile.interests || [];
        } catch {
          interests = [];
        }

        const mapped: ProfileFormData = {
          name: realProfile.name,
          age: realProfile.age,
          gender: realProfile.gender,
          target_gender: realProfile.target_gender,
          bio: realProfile.bio || '',
          voice_bio_url: realProfile.voice_bio_url || '',
          country: realProfile.country || 'Indonesia',
          city: realProfile.city || 'Jakarta',
          target_location_mode: realProfile.target_location_mode || 'same_city',
          min_age_pref: realProfile.min_age_pref || 18,
          max_age_pref: realProfile.max_age_pref || 50,
          photos,
          interests,
          birth_date: realProfile.birth_date,
          relationship_goal: realProfile.relationship_goal as any,
          max_distance_km: realProfile.max_distance_km,
        };

        setProfile(mapped);
        writeJson('matchin:onboarding-profile', mapped);
      })
      .catch(() => {});

    return () => { mounted = false; };
  }, []);

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
}
