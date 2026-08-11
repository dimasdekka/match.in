import React, { useState, useEffect } from 'react';
import { Heart, CheckCircle2, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import type { MatchDetail, Profile } from '../types';

interface LikesPageProps {
  onOpenMatchesCount?: (count: number) => void;
}

export const LikesPage: React.FC<LikesPageProps> = ({ onOpenMatchesCount: _onOpenMatchesCount }) => {
  const [activeSegment, setActiveSegment] = useState<'likes_you' | 'you_liked'>('likes_you');
  const [matches, setMatches] = useState<MatchDetail[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const matchRes = await api.getMatches();
      setMatches(matchRes.matches || []);
    } catch (err) {
      console.error('Failed to load likes data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Helper: parse photos from profile
  const getAvatar = (profile: Profile | undefined): string => {
    if (!profile?.photos) return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=128&h=128&q=80';
    let photos: string[] = [];
    try {
      photos = typeof profile.photos === 'string' ? JSON.parse(profile.photos) : profile.photos;
    } catch {
      photos = [];
    }
    return photos[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=128&h=128&q=80';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-slate-400">
        <RefreshCw className="w-7 h-7 animate-spin text-[#FF3366]" />
        <p className="text-xs font-semibold">Loading...</p>
      </div>
    );
  }

  // Build display list from real matches
  const displayList = matches.map((m) => ({
    id: m.match_id,
    name: m.matched_profile?.name || m.matched_user?.first_name || 'User',
    age: m.matched_profile?.age || 0,
    city: m.matched_profile?.city || '',
    bio: m.matched_profile?.bio || '',
    avatar: getAvatar(m.matched_profile),
    isVerified: m.matched_profile?.is_verified || false,
    telegramLink: m.direct_telegram_link || (m.telegram_username ? `https://t.me/${m.telegram_username}` : '#'),
  }));

  const likesCount = displayList.length;

  return (
    <div className="w-full max-w-md mx-auto bg-white min-h-screen">
      {/* ── Top Header ── */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-start">
        <h2 className="text-xl font-extrabold text-slate-900">Likes</h2>
      </div>

      {/* ── Segmented Tabs ── */}
      <div className="flex border-b border-slate-200 px-4">
        <button
          onClick={() => setActiveSegment('likes_you')}
          className={`flex-1 pb-3 text-center text-sm font-bold transition-all border-b-[2.5px] ${
            activeSegment === 'likes_you'
              ? 'border-[#FF3366] text-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <span>Likes You</span>
          <span className="ml-1.5 px-2 py-0.5 rounded-full bg-[#FF3366] text-white text-[10px] font-extrabold align-middle">
            {likesCount}
          </span>
        </button>

        <button
          onClick={() => setActiveSegment('you_liked')}
          className={`flex-1 pb-3 text-center text-sm font-bold transition-all border-b-[2.5px] ${
            activeSegment === 'you_liked'
              ? 'border-[#FF3366] text-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          You Liked
        </button>
      </div>

      {/* ── List ── */}
      <div className="px-4 py-3">
        {activeSegment === 'likes_you' ? (
          displayList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-pink-50 flex items-center justify-center">
                <Heart className="w-7 h-7 text-pink-300" />
              </div>
              <p className="text-sm font-bold text-slate-700">Belum ada orang yang menyukaimu</p>
              <p className="text-xs text-slate-400">Terus swipe di Discover untuk menemukan match!</p>
            </div>
          ) : (
            <div className="space-y-1">
              {displayList.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-3.5 border-b border-slate-100 last:border-b-0"
                >
                  {/* Left: Avatar + Info */}
                  <div className="flex items-center gap-3.5">
                    {/* Avatar with Online Dot */}
                    <div className="relative shrink-0">
                      <img
                        src={item.avatar}
                        alt={item.name}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                      <span className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                    </div>

                    {/* Name + Distance + Bio */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-[15px] font-bold text-slate-900 leading-tight">
                          {item.name}, {item.age}
                        </h3>
                        {item.isVerified && (
                          <CheckCircle2 className="w-4 h-4 text-sky-500 fill-sky-500 shrink-0" style={{ color: 'white' }} />
                        )}
                      </div>
                      <p className="text-[12px] text-slate-400 font-medium mt-0.5 leading-tight">
                        {item.city || '3 km away'}
                      </p>
                      <p className="text-[13px] text-slate-600 mt-0.5 leading-snug truncate max-w-[200px]">
                        {item.bio || 'Hey there! 👋'}
                      </p>
                    </div>
                  </div>

                  {/* Right: Heart Button */}
                  <a
                    href={item.telegramLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-11 h-11 rounded-full match-gradient flex items-center justify-center text-white shrink-0 shadow-md shadow-pink-500/20 hover:scale-105 active:scale-90 transition"
                  >
                    <Heart className="w-5 h-5 fill-white" />
                  </a>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-pink-50 flex items-center justify-center">
              <Heart className="w-7 h-7 text-pink-300" />
            </div>
            <p className="text-sm text-slate-400 font-medium">Belum ada profil yang kamu sukai.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export const MatchesPage = LikesPage;
