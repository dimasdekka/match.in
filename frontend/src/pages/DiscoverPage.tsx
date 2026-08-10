import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, Sparkles, Sliders } from 'lucide-react';
import { api } from '../services/api';
import { DiscoverCard } from '../components/DiscoverCard';
import type { Profile, SwipeResponse, SwipeAction } from '../types';

interface DiscoverPageProps {
  onMatch: (matchResponse: SwipeResponse) => void;
  onOpenFilter?: () => void;
}

export const DiscoverPage: React.FC<DiscoverPageProps> = ({ onMatch, onOpenFilter }) => {
  const { t } = useTranslation();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getRecommendations(15);
      setProfiles(res.profiles || []);
      setCurrentIndex(0);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error loading profiles';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const handleSwipe = async (action: SwipeAction) => {
    if (currentIndex >= profiles.length) return;

    const currentProfile = profiles[currentIndex];
    // Move to next card immediately for fluid UI feedback
    setCurrentIndex((prev) => prev + 1);

    try {
      const result = await api.swipe(currentProfile.id, action);
      if (result.is_match) {
        onMatch(result);
      }
    } catch (err) {
      console.error('Swipe error:', err);
    }
  };

  const currentProfile = profiles[currentIndex];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-3 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-pink-500" />
        <p className="text-sm font-medium">Memuat rekomendasi profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] p-6 text-center gap-4">
        <p className="text-rose-400 text-sm">{error}</p>
        <button
          onClick={fetchRecommendations}
          className="px-4 py-2 rounded-xl bg-pink-500 text-white font-semibold text-xs flex items-center gap-2 hover:bg-pink-600 transition"
        >
          <RefreshCw className="w-4 h-4" /> Coba Lagi
        </button>
      </div>
    );
  }

  if (!currentProfile || currentIndex >= profiles.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] p-6 text-center gap-4 bg-slate-900/50 rounded-3xl border border-slate-800/80 max-w-sm mx-auto my-4">
        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
          <Sparkles className="w-8 h-8 text-pink-400" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white">{t('noMoreProfiles')}</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            {t('tryChangingFilter')}
          </p>
        </div>
        <div className="flex flex-col gap-2 w-full pt-2">
          {onOpenFilter && (
            <button
              onClick={onOpenFilter}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-slate-700 transition"
            >
              <Sliders className="w-4 h-4 text-pink-400" /> Ubah Filter
            </button>
          )}
          <button
            onClick={fetchRecommendations}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-4 max-w-md mx-auto">
      <DiscoverCard profile={currentProfile} onSwipe={handleSwipe} />
    </div>
  );
};
