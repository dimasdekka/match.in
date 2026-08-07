import type { Profile, ProfileFormData, SwipeAction, SwipeResponse, MatchDetail, User } from '../types';

const API_BASE_URL = 'http://localhost:8080/api';

// Retrieve Telegram InitData from WebApp SDK or query param fallback
const getTelegramInitData = (): string => {
  if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.initData) {
    return (window as any).Telegram.WebApp.initData;
  }
  return 'user=%7B%22id%22%3A100000001%2C%22first_name%22%3A%22Alex%22%2C%22last_name%22%3A%22Dev%22%2C%22username%22%3A%22alex_dev%22%2C%22language_code%22%3A%22id%22%7D';
};

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'X-Telegram-Init-Data': getTelegramInitData(),
});

export const api = {
  async getMe(): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE_URL}/me`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch user session');
    return res.json();
  },

  async updateLanguage(languageCode: string): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE_URL}/me/language`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ language_code: languageCode }),
    });
    if (!res.ok) throw new Error('Failed to update language');
    return res.json();
  },

  async getMyProfile(): Promise<{ profile: Profile | null }> {
    const res = await fetch(`${API_BASE_URL}/profile/me`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch my profile');
    return res.json();
  },

  async saveProfile(data: ProfileFormData): Promise<{ profile: Profile }> {
    const res = await fetch(`${API_BASE_URL}/profile/me`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to save profile');
    return res.json();
  },

  async getRecommendations(limit = 10): Promise<{ profiles: Profile[] }> {
    const res = await fetch(`${API_BASE_URL}/recommendations?limit=${limit}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch profile recommendations');
    return res.json();
  },

  async swipe(targetId: number, action: SwipeAction): Promise<SwipeResponse> {
    const res = await fetch(`${API_BASE_URL}/swipe`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ target_id: targetId, action }),
    });
    if (!res.ok) throw new Error('Failed to record swipe');
    return res.json();
  },

  async getMatches(): Promise<{ matches: MatchDetail[] }> {
    const res = await fetch(`${API_BASE_URL}/matches`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch matches');
    return res.json();
  },
};
