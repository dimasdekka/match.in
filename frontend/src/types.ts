export type Gender = 'male' | 'female' | 'all';
export type LocationFilterMode = 'same_city' | 'same_country' | 'global';
export type SwipeAction = 'like' | 'pass' | 'superlike';

export interface User {
  id: number;
  telegram_id: number;
  username: string;
  first_name: string;
  last_name: string;
  language_code: string;
  is_active: boolean;
}

export interface Profile {
  id: number;
  user_id: number;
  match_id?: number;
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
  photos: string; // JSON string or Array
  interests: string; // JSON string or Array
  is_verified: boolean;
  is_boosted?: boolean;
  is_premium?: boolean;
  user?: User;
}

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

export interface MatchDetail {
  match_id: number;
  matched_user: User;
  matched_profile: Profile;
  telegram_username: string;
  direct_telegram_link: string;
  matched_at: string;
}

export interface SwipeResponse {
  is_match: boolean;
  match?: any;
  profile?: Profile;
}

export interface ChatMessage {
  id: number;
  match_id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  image_url?: string;
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  match_id: number;
  matched_user: User;
  matched_profile: Profile;
  last_message?: ChatMessage;
  unread_count: number;
  matched_at: string;
}
