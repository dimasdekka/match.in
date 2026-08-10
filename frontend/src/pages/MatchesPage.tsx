import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Heart, RefreshCw, MapPin } from 'lucide-react';
import { api } from '../services/api';
import type { MatchDetail } from '../types';

interface MatchesPageProps {
  onMatchesCountChange?: (count: number) => void;
}

export const MatchesPage: React.FC<MatchesPageProps> = ({ onMatchesCountChange }) => {
  const { t } = useTranslation();
  const [matches, setMatches] = useState<MatchDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getMatches();
      const matchData = res.matches || [];
      setMatches(matchData);
      if (onMatchesCountChange) {
        onMatchesCountChange(matchData.length);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load matches';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-3 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-pink-500" />
        <p className="text-sm font-medium">Memuat daftar match...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] p-6 text-center gap-4">
        <p className="text-rose-400 text-sm">{error}</p>
        <button
          onClick={fetchMatches}
          className="px-4 py-2 rounded-xl bg-pink-500 text-white font-semibold text-xs flex items-center gap-2 hover:bg-pink-600 transition"
        >
          <RefreshCw className="w-4 h-4" /> Coba Lagi
        </button>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] p-6 text-center gap-4 bg-slate-900/40 rounded-3xl border border-slate-800/80 max-w-sm mx-auto my-4">
        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
          <Heart className="w-8 h-8 text-pink-400" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white">{t('noMatchesYet')}</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            {t('startSwipingToMatch')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto px-4 py-4 space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
          <h2 className="text-lg font-bold text-white">{t('myMatches')}</h2>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
            {matches.length}
          </span>
        </div>
        <button
          onClick={fetchMatches}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3.5">
        {matches.map((item) => {
          const profile = item.matched_profile;
          const telegramUsername = item.telegram_username || item.matched_user?.username || '';
          const telegramLink =
            item.direct_telegram_link ||
            (telegramUsername ? `https://t.me/${telegramUsername}` : '#');

          // Photo parse
          let photos: string[] = [];
          if (Array.isArray(profile?.photos)) {
            photos = profile.photos;
          } else if (typeof profile?.photos === 'string' && profile.photos.trim()) {
            try {
              photos = JSON.parse(profile.photos);
            } catch {
              photos = [profile.photos];
            }
          }
          const photoUrl = photos[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80';

          return (
            <div
              key={item.match_id}
              className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-lg hover:border-slate-700 transition duration-200"
            >
              <img
                src={photoUrl}
                alt={profile?.name || item.matched_user?.first_name || 'Match'}
                className="w-16 h-16 rounded-xl object-cover border border-slate-700 shrink-0"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base font-bold text-white truncate">
                    {profile?.name || item.matched_user?.first_name}
                  </h3>
                  {profile?.age && (
                    <span className="text-sm font-medium text-slate-400">
                      , {profile.age}
                    </span>
                  )}
                </div>

                {(profile?.city || profile?.country) && (
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                    <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                    {[profile.city, profile.country].filter(Boolean).join(', ')}
                  </p>
                )}

                {telegramUsername ? (
                  <p className="text-[11px] text-pink-400 font-medium mt-1 truncate">
                    @{telegramUsername}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-500 mt-1">Direct Chat</p>
                )}
              </div>

              <a
                href={telegramLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white text-xs font-semibold hover:opacity-90 transition shadow-md shadow-sky-500/20 shrink-0 active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Chat</span>
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
};
