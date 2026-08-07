import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { Profile } from '../types';
import { MapPin, CheckCircle, Volume2, VolumeX, Sparkles, Heart, X, Star, ChevronLeft, ChevronRight } from 'lucide-react';

interface SwipeCardProps {
  profile: Profile;
  onSwipe: (action: 'like' | 'pass' | 'superlike') => void;
}

export const SwipeCard: React.FC<SwipeCardProps> = ({ profile, onSwipe }) => {
  const { t } = useTranslation();
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Parse media (photos & videos) safely
  let mediaList: string[] = [];
  try {
    mediaList = typeof profile.photos === 'string' ? JSON.parse(profile.photos) : profile.photos || [];
  } catch {
    mediaList = [];
  }
  if (mediaList.length === 0) {
    mediaList = ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80'];
  }

  mediaList = mediaList.slice(0, 3);
  const currentMedia = mediaList[activeMediaIndex] || mediaList[0];

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

  const isVideo = (url: string) => url.endsWith('.mp4') || url.endsWith('.webm');

  return (
    <div className="relative w-full max-w-sm h-[560px] rounded-[32px] overflow-hidden ios-glass-card flex flex-col select-none transition-all duration-300">
      {/* Background Media */}
      <div className="absolute inset-0 z-0">
        {isVideo(currentMedia) ? (
          <video
            src={currentMedia}
            className="w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
          />
        ) : (
          <img
            src={currentMedia}
            alt={profile.name}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
      </div>

      {/* Top Media Gallery Progress Bar */}
      {mediaList.length > 1 && (
        <div className="relative z-10 p-3.5 flex gap-1.5">
          {mediaList.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                idx === activeMediaIndex ? 'bg-white shadow-md' : 'bg-white/30 backdrop-blur-md'
              }`}
            />
          ))}
        </div>
      )}

      {/* Media Navigation Touch Controls */}
      {mediaList.length > 1 && (
        <div className="absolute inset-x-0 top-1/3 z-10 px-3 flex justify-between pointer-events-none">
          <button
            onClick={() => setActiveMediaIndex((prev) => (prev > 0 ? prev - 1 : mediaList.length - 1))}
            className="p-2.5 rounded-full ios-glass-button text-white pointer-events-auto shadow-lg"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveMediaIndex((prev) => (prev < mediaList.length - 1 ? prev + 1 : 0))}
            className="p-2.5 rounded-full ios-glass-button text-white pointer-events-auto shadow-lg"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top iOS Floating Badges */}
      <div className="relative z-10 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Asal (Kota, Negara) */}
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full ios-glass text-xs font-bold text-white shadow-lg">
            <MapPin className="w-3.5 h-3.5 text-rose-400" />
            <span>
              {profile.city}, {profile.country}
            </span>
          </div>

          {profile.is_boosted && (
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 text-[11px] font-black tracking-wider uppercase shadow-lg shadow-orange-500/40">
              <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
              <span>BOOSTED</span>
            </div>
          )}
        </div>

        {profile.is_verified && (
          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 backdrop-blur-xl border border-emerald-400/40 text-emerald-300 text-xs font-bold shadow-md">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{t('verified')}</span>
          </div>
        )}
      </div>

      {/* Card Body Info Frame */}
      <div className="relative z-10 mt-auto p-5 space-y-3.5">
        {/* Nama, Umur & Bio */}
        <div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-extrabold text-white tracking-tight leading-none">{profile.name}</h2>
            <span className="text-3xl font-light text-slate-300">{profile.age}</span>
          </div>

          {profile.bio && (
            <p className="text-xs text-slate-200 line-clamp-2 mt-1.5 font-normal leading-relaxed">
              {profile.bio}
            </p>
          )}
        </div>

        {/* Voice Bio Player */}
        {profile.voice_bio_url && (
          <button
            onClick={toggleVoice}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl ios-glass-button text-purple-300 text-xs font-bold shadow-md hover:bg-purple-500/20"
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
                className="px-3 py-1 rounded-full ios-glass text-[11px] font-semibold text-slate-200 border border-white/10"
              >
                #{interest}
              </span>
            ))}
          </div>
        )}

        {/* iOS Action Buttons */}
        <div className="pt-2 flex items-center justify-evenly">
          <button
            onClick={() => onSwipe('pass')}
            className="w-14 h-14 rounded-full ios-glass border-rose-500/40 text-rose-400 flex items-center justify-center shadow-lg hover:bg-rose-500/20 hover:scale-110 active:scale-95 transition"
            title={t('pass')}
          >
            <X className="w-7 h-7" />
          </button>

          <button
            onClick={() => onSwipe('superlike')}
            className="w-12 h-12 rounded-full ios-glass border-amber-400/40 text-amber-300 flex items-center justify-center shadow-lg hover:bg-amber-400/20 hover:scale-110 active:scale-95 transition"
            title={t('superlike')}
          >
            <Star className="w-6 h-6 fill-amber-300/20" />
          </button>

          <button
            onClick={() => onSwipe('like')}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-rose-500 via-pink-500 to-indigo-600 text-white flex items-center justify-center shadow-xl ios-glow-pink hover:scale-110 active:scale-95 transition"
            title={t('like')}
          >
            <Heart className="w-7 h-7 fill-white" />
          </button>
        </div>
      </div>
    </div>
  );
};
