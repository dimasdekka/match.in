import type { Gender, LocationFilterMode } from '@/@types';

export interface ProfileFormData {
  name: string;
  age: number;
  gender: Gender;
  target_gender: Gender;
  bio: string;
  voice_bio_url: string;
  country: string;
  city: string;
  target_location_mode: LocationFilterMode;
  min_age_pref: number;
  max_age_pref: number;
  photos: string[];
  interests: string[];
  birth_date?: string;
  latitude?: number;
  longitude?: number;
  relationship_goal?: 'long_term' | 'casual' | 'friendship';
  dating_intention?: 'serious' | 'explore' | 'friends';
  max_distance_km?: number;
}

export type OnboardingDraft = ProfileFormData & {
  birth_date: string;
  relationship_goal: 'long_term' | 'casual' | 'friendship';
  dating_intention: 'serious' | 'explore' | 'friends';
  max_distance_km: number;
};
