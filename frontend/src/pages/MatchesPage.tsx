import React, { useState, useEffect } from 'react';
import { Heart, CheckCircle2, ArrowLeft, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import type { MatchDetail, Profile } from '../types';

interface LikesPageProps {
  onOpenMatchesCount?: (count: number) => void;
}

export const LikesPage: React.FC<LikesPageProps> = ({ onOpenMatchesCount }) => {
  const [activeSegment, setActiveSegment] = useState<'likes_you' | 'you_liked'>('likes_you');
  const [matches, setMatches] = useState<MatchDetail[]>([]);
  const [recommendations, setRecommendations] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const matchRes = await api.getMatches();
      const recRes = await api.getRecommendations(10);
      setMatches(matchRes.matches || []);
      setRecommendations(recRes.profiles || []);
      if (onOpenMatchesCount) {
        onOpenMatchesCount(matchRes.matches?.length || 12);
      }
    } catch (err) {
      console.error('Failed to load likes data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-[#FF3366]" />
        <p className="text-xs font-semibold">Loading Likes...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto px-4 py-3 space-y-4 pb-24 animate-fade-in">
      {/* Screen 5 Top Header */}
      <div className="flex items-center justify-between pt-1">
        <button className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-700">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-extrabold text-slate-900">Likes</h2>
        <div className="w-9" />
      </div>

      {/* Segmented Tab Bar: Likes You (12) | You Liked */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveSegment('likes_you')}
          className={`flex-1 py-3 text-center text-xs font-bold transition border-b-2 ${
            activeSegment === 'likes_you'
              ? 'border-[#FF3366] text-[#FF3366]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Likes You <span className="px-2 py-0.5 rounded-full bg-pink-100 text-[#FF3366] text-[10px] font-extrabold ml-1">{matches.length || 12}</span>
        </button>

        <button
          onClick={() => setActiveSegment('you_liked')}
          className={`flex-1 py-3 text-center text-xs font-bold transition border-b-2 ${
            activeSegment === 'you_liked'
              ? 'border-[#FF3366] text-[#FF3366]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          You Liked
        </button>
      </div>

      {/* Candidate List (Screen 5 format) */}
      <div className="space-y-3 pt-1">
        {activeSegment === 'likes_you' ? (
          matches.length > 0 ? (
            matches.map((item) => {
              const profile = item.matched_profile;
              let photos: string[] = [];
              try {
                photos = typeof profile.photos === 'string' ? JSON.parse(profile.photos) : profile.photos || [];
              } catch {
                photos = [];
              }
              const avatar = photos[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80';

              return (
                <div
                  key={item.match_id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-white border border-pink-100 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={avatar}
                        alt={profile?.name}
                        className="w-14 h-14 rounded-full object-cover border-2 border-pink-100"
                      />
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-slate-900">
                          {profile?.name}, {profile?.age}
                        </h3>
                        <CheckCircle2 className="w-4 h-4 text-sky-400 fill-sky-400 text-white" />
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium">3 km away</p>
                      <p className="text-xs text-slate-600 font-normal line-clamp-1 mt-0.5">
                        {profile?.bio || 'Photographer & coffee lover ☕'}
                      </p>
                    </div>
                  </div>

                  <a
                    href={item.direct_telegram_link || `https://t.me/${item.telegram_username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full match-gradient flex items-center justify-center text-white match-shadow-btn shrink-0 hover:scale-105 active:scale-95 transition"
                  >
                    <Heart className="w-5 h-5 fill-white" />
                  </a>
                </div>
              );
            })
          ) : (
            recommendations.map((rec) => (
              <div
                key={rec.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-white border border-pink-100 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80"
                      alt={rec.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-pink-100"
                    />
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold text-slate-900">{rec.name}, {rec.age}</h3>
                      <CheckCircle2 className="w-4 h-4 text-sky-400 fill-sky-400 text-white" />
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium">{rec.city} • 5 km away</p>
                    <p className="text-xs text-slate-600 font-normal line-clamp-1 mt-0.5">{rec.bio || 'Into fitness and adventures 🏕️'}</p>
                  </div>
                </div>

                <button className="w-10 h-10 rounded-full match-gradient flex items-center justify-center text-white match-shadow-btn shrink-0 hover:scale-105 active:scale-95 transition">
                  <Heart className="w-5 h-5 fill-white" />
                </button>
              </div>
            ))
          )
        ) : (
          <div className="text-center py-10 text-slate-400 text-xs font-semibold">
            Belum ada profil yang kamu sukai.
          </div>
        )}
      </div>
    </div>
  );
};

export const MatchesPage = LikesPage;
