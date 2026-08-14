import { useEffect, useRef, useState, useCallback } from 'react';
import { api } from '@/utils/api';
import { DISCOVER_PROFILES } from '../constants/profile';
import type { DiscoverProfile, SwipeDecision } from '../@types';

export type FeedMode = 'for_you' | 'nearby' | 'popular' | 'new' | 'serious';

export const FEED_OPTIONS: Array<{ id: FeedMode; label: string; icon: string; desc: string }> = [
  {
    id: 'for_you',
    label: 'Untuk Anda',
    icon: 'solar:magic-stick-3-bold',
    desc: 'Rekomendasi terbaik yang disesuaikan untuk Anda',
  },
  {
    id: 'nearby',
    label: 'Terdekat',
    icon: 'solar:map-point-bold',
    desc: 'Temukan profil di sekitar kota atau area Anda',
  },
  {
    id: 'popular',
    label: 'Populer',
    icon: 'solar:fire-bold',
    desc: 'Profil yang paling banyak disukai dan aktif',
  },
  {
    id: 'new',
    label: 'Baru Bergabung',
    icon: 'solar:user-plus-bold',
    desc: 'Member baru yang baru saja membuat akun',
  },
  {
    id: 'serious',
    label: 'Hubungan Serius',
    icon: 'solar:hearts-bold',
    desc: 'Mencari komitmen & hubungan jangka panjang',
  },
];

export function useDiscoverDeck() {
  const [feedMode, setFeedMode] = useState<FeedMode>('for_you');
  const [deckProfiles, setDeckProfiles] = useState<DiscoverProfile[]>([]);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [match, setMatch] = useState<DiscoverProfile | null>(null);
  const [likedProfiles, setLikedProfiles] = useState<DiscoverProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const transitionLocked = useRef(false);

  const loadRealRecommendations = useCallback(async (currentFeed: FeedMode = feedMode) => {
    try {
      setLoading(true);
      const res = await api.getRecommendations(20, currentFeed);
      if (res.profiles && res.profiles.length > 0) {
        const mapped: DiscoverProfile[] = res.profiles.map((p) => {
          let photos: string[] = [];
          try {
            photos = typeof p.photos === 'string' ? JSON.parse(p.photos) : p.photos || [];
          } catch {
            photos = [];
          }
          const img = photos[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80';

          let interestsArr: Array<{ label: string; icon: string }> = [];
          try {
            const rawInts = typeof p.interests === 'string' ? JSON.parse(p.interests) : p.interests || [];
            interestsArr = rawInts.map((tag: string) => ({ label: tag, icon: 'ph:heart' }));
          } catch {
            interestsArr = [{ label: 'Travel', icon: 'ph:airplane' }];
          }

          return {
            id: p.user_id || p.id,
            name: p.name,
            age: p.age,
            city: p.city || 'Jakarta',
            distance: 3,
            bio: p.bio || '',
            image: img,
            verified: p.is_verified ?? true,
            interests: interestsArr.length > 0 ? interestsArr : [{ label: 'Travel', icon: 'ph:airplane' }],
          };
        });
        setDeckProfiles(mapped);
        setIndex(0);
      } else {
        // Fallback to sample profiles if empty
        setDeckProfiles(DISCOVER_PROFILES);
        setIndex(0);
      }
    } catch (err) {
      console.error('Failed to load backend recommendations, using fallback deck', err);
      setDeckProfiles(DISCOVER_PROFILES);
      setIndex(0);
    } finally {
      setLoading(false);
    }
  }, [feedMode]);

  useEffect(() => {
    void loadRealRecommendations(feedMode);
  }, [feedMode, loadRealRecommendations]);

  const activeProfiles = deckProfiles.length > 0 ? deckProfiles : DISCOVER_PROFILES;
  const profile = activeProfiles[index % activeProfiles.length];
  const nextProfile = activeProfiles[(index + 1) % activeProfiles.length];

  const decide = async (decision: SwipeDecision) => {
    if (transitionLocked.current) return;
    transitionLocked.current = true;
    const liked = decision !== 'pass';
    setDirection(liked ? 1 : -1);

    if (liked) {
      setLikedProfiles((current) =>
        current.some((item) => item.id === profile.id) ? current : [...current, profile],
      );
    }

    // Call backend swipe API
    try {
      const swipeRes = await api.swipe(profile.id, decision);
      if (swipeRes.is_match) {
        setMatch(profile);
      } else if (liked && profile.willMatch) {
        setMatch(profile);
      }
    } catch {
      if (liked && profile.willMatch) setMatch(profile);
    }

    const nextIndex = index + 1;
    if (nextIndex >= activeProfiles.length) {
      void loadRealRecommendations(feedMode);
      setIndex(0);
    } else {
      setIndex(nextIndex);
    }

    window.setTimeout(() => {
      transitionLocked.current = false;
    }, 210);
  };

  return {
    profile,
    nextProfile,
    direction,
    match,
    likedProfiles,
    loading,
    feedMode,
    setFeedMode,
    decide,
    reload: () => loadRealRecommendations(feedMode),
    closeMatch: () => setMatch(null),
  };
}
