import { useRef, useState } from 'react';
import { DISCOVER_PROFILES } from '../constants/profile';
import type { DiscoverProfile, SwipeDecision } from '../@types';

export function useDiscoverDeck() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [match, setMatch] = useState<DiscoverProfile | null>(null);
  const [likedProfiles, setLikedProfiles] = useState<DiscoverProfile[]>([]);
  const transitionLocked = useRef(false);
  const profile = DISCOVER_PROFILES[index % DISCOVER_PROFILES.length];
  const nextProfile = DISCOVER_PROFILES[(index + 1) % DISCOVER_PROFILES.length];

  const decide = (decision: SwipeDecision) => {
    if (transitionLocked.current) return;
    transitionLocked.current = true;
    const liked = decision !== 'pass';
    setDirection(liked ? 1 : -1);
    if (liked) {
      setLikedProfiles((current) =>
        current.some((item) => item.id === profile.id) ? current : [...current, profile],
      );
    }
    if (liked && profile.willMatch) setMatch(profile);
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
