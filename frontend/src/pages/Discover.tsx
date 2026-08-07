import React, { useEffect, useState } from 'react';
import type { Profile, SwipeAction, LocationFilterMode } from '../types';
import { api } from '../services/api';
import { SwipeCard } from '../components/SwipeCard';
import { MatchModal } from '../components/MatchModal';
import { RefreshCw, Flame, Sparkles } from 'lucide-react';

interface DiscoverProps {
  onOpenMatches: () => void;
  locationFilterMode: LocationFilterMode;
}

export const Discover: React.FC<DiscoverProps> = ({ onOpenMatches }) => {
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
      setError(err.message || 'Gagal memuat rekomendasi');
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
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 animate-fade-in">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-4 border-pink-500/20 border-t-pink-500 animate-spin" />
          <Flame className="w-6 h-6 text-rose-500 absolute animate-pulse" />
        </div>
        <p className="text-xs font-semibold text-slate-400 tracking-wide uppercase">Mencari pasangan terbaik...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <p className="text-sm text-rose-400 font-medium">{error}</p>
        <button
          onClick={fetchProfiles}
          className="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-800 transition"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  const activeProfile = profiles[currentIndex];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-3 pb-20 max-w-sm mx-auto w-full">
      {activeProfile ? (
        <div className="w-full flex justify-center animate-fade-in">
          <SwipeCard profile={activeProfile} onSwipe={handleSwipe} />
        </div>
      ) : (
        <div className="w-full rounded-3xl bg-slate-900/90 backdrop-blur-xl border border-slate-800/90 p-8 flex flex-col items-center text-center space-y-5 shadow-2xl shadow-pink-500/5 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-rose-500/20 to-purple-600/20 border border-pink-500/30 flex items-center justify-center text-pink-400">
            <Sparkles className="w-8 h-8 animate-pulse text-pink-400" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Belum Ada Profil Baru</h3>
            <p className="text-xs text-slate-400 leading-relaxed mt-1">
              Kamu sudah melihat semua kandidat saat ini. Coba muat ulang rekomendasi atau ubah filter lokasi!
            </p>
          </div>

          <button
            onClick={fetchProfiles}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-pink-500/25 hover:opacity-95 active:scale-98 transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Muat Ulang Rekomendasi</span>
          </button>
        </div>
      )}

      {/* Match Celebration Modal */}
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
