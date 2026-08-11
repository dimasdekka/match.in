import type { Profile, ProfileFormData, SwipeAction, SwipeResponse, MatchDetail, User } from '../types';
import {
  getMeResponseSchema,
  getMyProfileResponseSchema,
  getRecommendationsResponseSchema,
  getMatchesResponseSchema,
  swipeResponseSchema,
  profileSchema,
  profileFormSchema,
  swipeRequestSchema,
} from '../schemas';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
            photo_url?: string;
          };
        };
        expand?: () => void;
        close?: () => void;
        ready?: () => void;
      };
    };
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const getTelegramInitData = (): string => {
  if (typeof window !== 'undefined') {
    // 1. Direct Telegram WebApp SDK object
    if (window.Telegram?.WebApp?.initData) {
      return window.Telegram.WebApp.initData;
    }

    // 2. URL hash parameter (tgWebAppInitData)
    if (window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const initDataFromHash = hashParams.get('tgWebAppInitData');
      if (initDataFromHash) return initDataFromHash;
    }

    // 3. URL search parameter
    if (window.location.search) {
      const searchParams = new URLSearchParams(window.location.search);
      const initDataFromQuery = searchParams.get('tgWebAppInitData') || searchParams.get('initData');
      if (initDataFromQuery) return initDataFromQuery;
    }
  }

  // 4. Dev fallback ONLY when testing in standalone browser
  const now = Math.floor(Date.now() / 1000);
  return `user=%7B%22id%22%3A100000001%2C%22first_name%22%3A%22User%22%2C%22username%22%3A%22user_demo%22%2C%22language_code%22%3A%22id%22%7D&hash=mock_dev_hash&auth_date=${now}`;
};

const getHeaders = (): Record<string, string> => ({
  'Content-Type': 'application/json',
  'X-Telegram-Init-Data': getTelegramInitData(),
});

export const api = {
  async getMe(): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE_URL}/me`, { headers: getHeaders() });
    if (!res.ok) throw new Error(`Failed to fetch user session: ${res.statusText}`);
    const data = await res.json();
    const parsed = getMeResponseSchema.parse(data);
    return { user: parsed.user as User };
  },

  async updateLanguage(languageCode: string): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE_URL}/me/language`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ language_code: languageCode }),
    });
    if (!res.ok) throw new Error(`Failed to update language: ${res.statusText}`);
    const data = await res.json();
    const parsed = getMeResponseSchema.parse(data);
    return { user: parsed.user as User };
  },

  async getMyProfile(): Promise<{ profile: Profile | null }> {
    const res = await fetch(`${API_BASE_URL}/profile/me`, { headers: getHeaders() });
    if (!res.ok) throw new Error(`Failed to fetch profile: ${res.statusText}`);
    const data = await res.json();
    if (!data || !data.profile) return { profile: null };
    const parsed = getMyProfileResponseSchema.parse(data);
    if (!parsed.profile || !parsed.profile.id || parsed.profile.id === 0 || !parsed.profile.name) {
      return { profile: null };
    }
    return { profile: parsed.profile as Profile };
  },

  async saveProfile(formData: ProfileFormData): Promise<{ profile: Profile }> {
    const validatedForm = profileFormSchema.parse(formData);
    const res = await fetch(`${API_BASE_URL}/profile/me`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(validatedForm),
    });
    if (!res.ok) throw new Error(`Failed to save profile: ${res.statusText}`);
    const data = await res.json();
    const parsedProfile = profileSchema.parse(data.profile);
    return { profile: parsedProfile as Profile };
  },

  async getRecommendations(limit = 10): Promise<{ profiles: Profile[] }> {
    const res = await fetch(`${API_BASE_URL}/recommendations?limit=${limit}`, { headers: getHeaders() });
    if (!res.ok) throw new Error(`Failed to fetch profile recommendations: ${res.statusText}`);
    const data = await res.json();
    const parsed = getRecommendationsResponseSchema.parse(data);
    return { profiles: parsed.profiles as Profile[] };
  },

  async swipe(targetId: number, action: SwipeAction): Promise<SwipeResponse> {
    const validatedRequest = swipeRequestSchema.parse({ target_id: targetId, action });
    const res = await fetch(`${API_BASE_URL}/swipe`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(validatedRequest),
    });
    if (!res.ok) throw new Error(`Failed to record swipe: ${res.statusText}`);
    const data = await res.json();
    const parsed = swipeResponseSchema.parse(data);
    return parsed as SwipeResponse;
  },

  async getMatches(): Promise<{ matches: MatchDetail[] }> {
    const res = await fetch(`${API_BASE_URL}/matches`, { headers: getHeaders() });
    if (!res.ok) throw new Error(`Failed to fetch matches: ${res.statusText}`);
    const data = await res.json();
    const parsed = getMatchesResponseSchema.parse(data);
    return { matches: parsed.matches as MatchDetail[] };
  },

  async getConversations(): Promise<{ conversations: any[] }> {
    const res = await fetch(`${API_BASE_URL}/chats`, { headers: getHeaders() });
    if (!res.ok) throw new Error(`Failed to fetch conversations: ${res.statusText}`);
    const data = await res.json();
    return { conversations: data.conversations || [] };
  },

  async getChatMessages(matchId: number): Promise<{ messages: any[] }> {
    const res = await fetch(`${API_BASE_URL}/chats/${matchId}/messages`, { headers: getHeaders() });
    if (!res.ok) throw new Error(`Failed to fetch messages: ${res.statusText}`);
    const data = await res.json();
    return { messages: data.messages || [] };
  },

  async sendChatMessage(matchId: number, content: string, imageUrl?: string): Promise<{ message: any }> {
    const res = await fetch(`${API_BASE_URL}/chats/${matchId}/messages`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ content, image_url: imageUrl }),
    });
    if (!res.ok) throw new Error(`Failed to send message: ${res.statusText}`);
    const data = await res.json();
    return { message: data.message };
  },
};
