import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { MatchDetail } from '../types';
import { api } from '../services/api';
import { Heart, Send, MapPin, Sparkles } from 'lucide-react';

export const Matches: React.FC = () => {
  const { t } = useTranslation();
  const [matches, setMatches] = useState<MatchDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const data = await api.getMatches();
        setMatches(data.matches || []);
      } catch (err) {
        console.error('Failed to fetch matches', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-8 h-8 rounded-full border-2 border-pink-500/20 border-t-pink-500 animate-spin" />
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
          <Heart className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">{t('noMatchesYet')}</h3>
          <p className="text-xs text-slate-400 max-w-xs mt-1 leading-relaxed">
            {t('startSwipingToMatch')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 max-w-md mx-auto w-full space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
          <span>{t('myMatches')}</span>
        </h2>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30">
          {matches.length}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {matches.map((item) => {
          const profile = item.matched_profile;
          let photos: string[] = [];
          try {
            photos = typeof profile.photos === 'string' ? JSON.parse(profile.photos) : profile.photos || [];
          } catch {
            photos = [];
          }
          const avatar = photos[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80';

          return (
            <div
              key={item.match_id}
              className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3 shadow-lg hover:border-slate-700 transition"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={avatar}
                    alt={profile.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-pink-500/50"
                  />
                  {profile.is_verified && (
                    <div className="absolute -bottom-0.5 -right-0.5 p-1 rounded-full bg-emerald-500 text-white">
                      <Sparkles className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-baseline gap-1.5">
                    <h3 className="text-base font-bold text-white">{profile.name}</h3>
                    <span className="text-sm font-light text-slate-400">{profile.age}</span>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                    <MapPin className="w-3 h-3 text-rose-400" />
                    <span>
                      {profile.city}, {profile.country}
                    </span>
                  </div>
                </div>
              </div>

              {item.direct_telegram_link ? (
                <a
                  href={item.direct_telegram_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md hover:opacity-95 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Chat</span>
                </a>
              ) : (
                <span className="text-xs text-slate-500 font-medium">@{item.telegram_username || 'no_username'}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
