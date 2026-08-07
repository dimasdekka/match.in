import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Profile, SwipeAction, LocationFilterMode } from '../types';
import { api } from '../services/api';
import { SwipeCard } from '../components/SwipeCard';
import { MatchModal } from '../components/MatchModal';
import { RefreshCw, Layers } from 'lucide-react';

interface DiscoverProps {
  onOpenMatches: () => void;
  locationFilterMode: LocationFilterMode;
}

export const Discover: React.FC<DiscoverProps> = ({ onOpenMatches }) => {
  const { t } = useTranslation();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matchedProfile, setMatchedProfile] = useState<Profile | null>(null);

  const fetchProfiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getRecommendations(15);
      setProfiles(data.profiles || []);
      setCurrentIndex(0);
    } catch (err: any) {
      setError(err.message || 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleSwipe = async (action: SwipeAction) => {
    const currentProfile = profiles[currentIndex];
    if (!currentProfile) return;

    // Move to next card immediately for UI responsiveness
    setCurrentIndex((prev) => prev + 1);

    try {
      const res = await api.swipe(currentProfile.user_id, action);
      if (res.is_match) {
        setMatchedProfile(currentProfile);
      }
    } catch (err) {
      console.error('Failed to process swipe', err);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-pink-500/20 border-t-pink-500 animate-spin" />
        <p className="text-sm font-medium text-slate-400">Loading recommendations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <p className="text-sm text-rose-400">{error}</p>
        <button
          onClick={fetchProfiles}
          className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const activeProfile = profiles[currentIndex];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      {activeProfile ? (
        <div className="w-full flex justify-center">
          <SwipeCard profile={activeProfile} onSwipe={handleSwipe} />
        </div>
      ) : (
        <div className="w-full max-w-sm rounded-3xl bg-slate-900/80 border border-slate-800 p-8 flex flex-col items-center text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-pink-400">
            <Layers className="w-8 h-8" />
          </div>

          <h3 className="text-lg font-bold text-white">{t('noMoreProfiles')}</h3>
          <p className="text-xs text-slate-400 leading-relaxed">{t('tryChangingFilter')}</p>

          <button
            onClick={fetchProfiles}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-pink-500/20 hover:opacity-95 transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      )}

      {/* Match Popup Modal */}
      {matchedProfile && (
        <MatchModal
          matchedProfile={matchedProfile}
          onClose={() => setMatchedProfile(null)}
          onOpenMatches={onOpenMatches}
        />
      )}
    </div>
  );
};
