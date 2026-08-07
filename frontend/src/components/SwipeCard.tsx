import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { Profile } from '../types';
import { MapPin, CheckCircle, Volume2, VolumeX, Sparkles, Heart, X, Star } from 'lucide-react';

interface SwipeCardProps {
  profile: Profile;
  onSwipe: (action: 'like' | 'pass' | 'superlike') => void;
}

export const SwipeCard: React.FC<SwipeCardProps> = ({ profile, onSwipe }) => {
  const { t } = useTranslation();
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Parse photos safely
  let photos: string[] = [];
  try {
    photos = typeof profile.photos === 'string' ? JSON.parse(profile.photos) : profile.photos || [];
  } catch {
    photos = [];
  }
  const mainPhoto = photos[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80';

  // Parse interests safely
  let interests: string[] = [];
  try {
    interests = typeof profile.interests === 'string' ? JSON.parse(profile.interests) : profile.interests || [];
  } catch {
    interests = [];
  }

  const toggleVoice = () => {
    if (!profile.voice_bio_url) return;
    if (isPlayingVoice) {
      audioRef.current?.pause();
      setIsPlayingVoice(false);
    } else {
      if (!audioRef.current) {
        audioRef.current = new Audio(profile.voice_bio_url);
        audioRef.current.onended = () => setIsPlayingVoice(false);
      }
      audioRef.current.play().catch(() => setIsPlayingVoice(false));
      setIsPlayingVoice(true);
    }
  };

  return (
    <div className="relative w-full max-w-sm h-[520px] rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl flex flex-col select-none transition-all duration-300">
      {/* Background Image with Gradient Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={mainPhoto}
          alt={profile.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
      </div>

      {/* Top Badges */}
      <div className="relative z-10 p-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/60 backdrop-blur-md border border-slate-700/50 text-xs font-semibold text-slate-200">
            <MapPin className="w-3.5 h-3.5 text-rose-400" />
            <span>
              {profile.city}, {profile.country}
            </span>
          </div>

          {profile.is_boosted && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-[11px] font-extrabold shadow-lg shadow-orange-500/30 animate-pulse">
              <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
              <span>BOOSTED</span>
            </div>
          )}
        </div>

        {profile.is_verified && (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-500/40 text-emerald-400 text-xs font-semibold">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{t('verified')}</span>
          </div>
        )}
      </div>

      {/* Card Body Info */}
      <div className="relative z-10 mt-auto p-5 space-y-3">
        {/* Name & Age */}
        <div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">{profile.name}</h2>
            <span className="text-2xl font-light text-slate-300">{profile.age}</span>
          </div>
          {profile.bio && <p className="text-sm text-slate-300 line-clamp-2 mt-1 font-normal leading-relaxed">{profile.bio}</p>}
        </div>

        {/* Voice Bio Player (if available) */}
        {profile.voice_bio_url && (
          <button
            onClick={toggleVoice}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-purple-500/20 backdrop-blur-md border border-purple-500/40 text-purple-300 text-xs font-semibold hover:bg-purple-500/30 transition active:scale-98"
          >
            <div className="flex items-center gap-2">
              {isPlayingVoice ? <VolumeX className="w-4 h-4 text-purple-400 animate-pulse" /> : <Volume2 className="w-4 h-4 text-purple-400" />}
              <span>{isPlayingVoice ? t('stopVoice') : t('playVoice')}</span>
            </div>
            <Sparkles className="w-3.5 h-3.5 text-purple-300" />
          </button>
        )}

        {/* Interest Badges */}
        {interests.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {interests.map((interest, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-[11px] font-medium text-slate-300"
              >
                #{interest}
              </span>
            ))}
          </div>
        )}

        {/* Swipe Action Buttons */}
        <div className="pt-2 flex items-center justify-evenly">
          <button
            onClick={() => onSwipe('pass')}
            className="w-14 h-14 rounded-full bg-slate-950/80 backdrop-blur-md border border-rose-500/40 text-rose-500 flex items-center justify-center shadow-lg hover:bg-rose-500/20 hover:scale-110 active:scale-95 transition"
            title={t('pass')}
          >
            <X className="w-7 h-7" />
          </button>

          <button
            onClick={() => onSwipe('superlike')}
            className="w-12 h-12 rounded-full bg-slate-950/80 backdrop-blur-md border border-amber-400/40 text-amber-400 flex items-center justify-center shadow-lg hover:bg-amber-400/20 hover:scale-110 active:scale-95 transition"
            title={t('superlike')}
          >
            <Star className="w-6 h-6 fill-amber-400/20" />
          </button>

          <button
            onClick={() => onSwipe('like')}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-rose-500 via-pink-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-pink-500/30 hover:scale-110 active:scale-95 transition"
            title={t('like')}
          >
            <Heart className="w-7 h-7 fill-white" />
          </button>
        </div>
      </div>
    </div>
  );
};
