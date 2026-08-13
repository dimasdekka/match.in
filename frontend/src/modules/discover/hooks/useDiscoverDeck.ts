import { useEffect, useRef, useState } from 'react';
import { api } from '@/utils/api';
import { DISCOVER_PROFILES } from '../constants/profile';
import type { DiscoverProfile, SwipeDecision } from '../@types';

export function useDiscoverDeck() {
  const [deckProfiles, setDeckProfiles] = useState<DiscoverProfile[]>(DISCOVER_PROFILES);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [match, setMatch] = useState<DiscoverProfile | null>(null);
  const [likedProfiles, setLikedProfiles] = useState<DiscoverProfile[]>([]);
  const transitionLocked = useRef(false);

  useEffect(() => {
    const loadRealRecommendations = async () => {
      try {
        const res = await api.getRecommendations(15);
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
              bio: p.bio || 'Product Designer & Travel Enthusiast',
              image: img,
              verified: p.is_verified || true,
              interests: interestsArr.length > 0 ? interestsArr : [{ label: 'Coffee', icon: 'ph:coffee' }],
            };
          });
          setDeckProfiles(mapped);
        }
      } catch (err) {
        console.error('Failed to load backend recommendations, using fallback deck', err);
      }
    };

    loadRealRecommendations();
  }, []);

  const profile = deckProfiles[index % deckProfiles.length];
  const nextProfile = deckProfiles[(index + 1) % deckProfiles.length];

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
    } catch (e) {
      if (liked && profile.willMatch) setMatch(profile);
    }

    setIndex((current) => current + 1);
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
    decide,
    closeMatch: () => setMatch(null),
  };
}
