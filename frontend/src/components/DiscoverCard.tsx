import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, CheckCircle, Volume2, VolumeX, Sparkles, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Profile } from '../types';

interface DiscoverCardProps {
  profile: Profile;
  onSwipe: (action: 'like' | 'pass' | 'superlike') => void;
}

export const DiscoverCard: React.FC<DiscoverCardProps> = ({ profile, onSwipe }) => {
  const { t } = useTranslation();
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [audioObj, setAudioObj] = useState<HTMLAudioElement | null>(null);

  // Parse photos safely
  const photosArray: string[] = React.useMemo(() => {
    if (Array.isArray(profile.photos)) return profile.photos;
    if (typeof profile.photos === 'string' && profile.photos.trim()) {
      try {
        const parsed = JSON.parse(profile.photos);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return [profile.photos];
      }
    }
    return ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'];
  }, [profile.photos]);

  // Parse interests safely
  const interestsArray: string[] = React.useMemo(() => {
    if (Array.isArray(profile.interests)) return profile.interests;
    if (typeof profile.interests === 'string' && profile.interests.trim()) {
      try {
        const parsed = JSON.parse(profile.interests);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return profile.interests.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }
    return [];
  }, [profile.interests]);

  const toggleVoice = () => {
    if (!profile.voice_bio_url) return;

    if (isPlayingVoice && audioObj) {
      audioObj.pause();
      setIsPlayingVoice(false);
    } else {
      const audio = new Audio(profile.voice_bio_url);
      setAudioObj(audio);
      setIsPlayingVoice(true);
      audio.play().catch((err) => {
        console.error('Audio play error:', err);
        setIsPlayingVoice(false);
      });
      audio.onended = () => setIsPlayingVoice(false);
    }
  };

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (photosArray.length > 1) {
      setCurrentPhotoIdx((prev) => (prev + 1) % photosArray.length);
    }
  };

  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (photosArray.length > 1) {
      setCurrentPhotoIdx((prev) => (prev - 1 + photosArray.length) % photosArray.length);
    }
  };

  return (
    <div className="relative w-full max-w-sm mx-auto h-[620px] rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl flex flex-col justify-between transition-all duration-300">
      {/* Background Image Carousel */}
      <div className="absolute inset-0 z-0">
        <img
          src={photosArray[currentPhotoIdx] || photosArray[0]}
          alt={profile.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

        {/* Photo Navigation Indicators */}
        {photosArray.length > 1 && (
          <div className="absolute top-3 left-4 right-4 z-10 flex gap-1.5">
            {photosArray.map((_, idx) => (
              <div
                key={idx}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  idx === currentPhotoIdx ? 'bg-white' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        )}

        {/* Photo Tap Overlay Nav */}
        {photosArray.length > 1 && (
          <>
            <button
              onClick={prevPhoto}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-slate-950/40 text-white hover:bg-slate-950/70"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextPhoto}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-slate-950/40 text-white hover:bg-slate-950/70"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Top Badges */}
      <div className="relative z-10 p-4 flex justify-between items-start pt-6">
        <div className="flex flex-col gap-1">
          {profile.is_verified && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
              <CheckCircle className="w-3.5 h-3.5" />
              {t('verified')}
            </span>
          )}
        </div>
        {profile.is_boosted && (
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 backdrop-blur-md animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            Boosted
          </span>
        )}
      </div>

      {/* Bottom Info & Action Buttons */}
      <div className="relative z-10 p-5 pt-0 flex flex-col gap-3">
        {/* Profile Info */}
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {profile.name}, {profile.age}
            </h2>
          </div>

          {(profile.city || profile.country) && (
            <div className="flex items-center gap-1.5 text-slate-300 text-xs font-medium">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              <span>
                {[profile.city, profile.country].filter(Boolean).join(', ')}
              </span>
            </div>
          )}

          {profile.bio && (
            <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/50 backdrop-blur-sm">
              {profile.bio}
            </p>
          )}

          {/* Voice Bio Button */}
          {profile.voice_bio_url && (
            <button
              onClick={toggleVoice}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-semibold hover:bg-purple-500/30 transition backdrop-blur-md"
            >
              {isPlayingVoice ? (
                <>
                  <VolumeX className="w-4 h-4 text-purple-400 animate-pulse" />
                  <span>{t('stopVoice')}</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-purple-400" />
                  <span>{t('playVoice')}</span>
                </>
              )}
            </button>
          )}

          {/* Interests Tags */}
          {interestsArray.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {interestsArray.slice(0, 4).map((interest, idx) => (
                <span
                  key={idx}
                  className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-slate-800/80 text-slate-200 border border-slate-700/60 backdrop-blur-sm"
                >
                  #{interest}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons: Pass, Superlike, Like */}
        <div className="flex items-center justify-center gap-4 pt-2">
          {/* Pass Button */}
          <button
            onClick={() => onSwipe('pass')}
            className="w-14 h-14 rounded-full bg-slate-900/90 border border-slate-700 text-rose-400 flex items-center justify-center hover:bg-rose-500/20 hover:border-rose-500 transition-all duration-200 active:scale-90 shadow-lg"
            title={t('pass')}
          >
            <span className="text-xl font-bold">✕</span>
          </button>

          {/* Superlike Button */}
          <button
            onClick={() => onSwipe('superlike')}
            className="w-12 h-12 rounded-full bg-slate-900/90 border border-slate-700 text-amber-400 flex items-center justify-center hover:bg-amber-500/20 hover:border-amber-500 transition-all duration-200 active:scale-90 shadow-lg"
            title={t('superlike')}
          >
            <Star className="w-5 h-5 fill-amber-400" />
          </button>

          {/* Like Button */}
          <button
            onClick={() => onSwipe('like')}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center hover:scale-105 transition-all duration-200 active:scale-90 shadow-lg shadow-pink-500/30"
            title={t('like')}
          >
            <span className="text-2xl font-bold">♥</span>
          </button>
        </div>
      </div>
    </div>
  );
};
