export type Gender = 'male' | 'female' | 'all';
export type LocationFilterMode = 'same_city' | 'same_country' | 'global';

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
  birth_date?: string;
  gender: Gender;
  target_gender: Gender;
  bio: string;
  voice_bio_url: string;
  country: string;
  city: string;
  latitude?: number;
  longitude?: number;
  target_location_mode: LocationFilterMode;
  min_age_pref: number;
  max_age_pref: number;
  max_distance_km?: number;
  relationship_goal?: string;
  dating_intention?: string;
  photos: string | string[];
  interests: string | string[];
  is_verified: boolean;
  is_boosted?: boolean;
  is_premium?: boolean;
  user?: User;
}

export interface MatchDetail {
  match_id: number;
  matched_user: User;
  matched_profile: Profile;
  telegram_username: string;
  direct_telegram_link: string;
  matched_at: string;
}

export interface ChatMessage {
  id: number;
  match_id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  image_url?: string;
  message_type?: string;
  reaction?: string;
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
