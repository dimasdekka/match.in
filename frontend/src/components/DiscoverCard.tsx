import React, { useState } from 'react';
import type { Profile } from '../types';
import { CheckCircle2, Heart, X, Star, ChevronLeft, ChevronRight } from 'lucide-react';

interface DiscoverCardProps {
  profile: Profile;
  onSwipe: (action: 'like' | 'pass' | 'superlike') => void;
}

export const DiscoverCard: React.FC<DiscoverCardProps> = ({ profile, onSwipe }) => {
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  // Parse photos
  let photos: string[] = [];
  try {
    photos = typeof profile.photos === 'string' ? JSON.parse(profile.photos) : profile.photos || [];
  } catch {
    photos = [];
  }
  if (photos.length === 0) {
    photos = ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'];
  }

  // Parse interests
  let interests: string[] = [];
  try {
    interests = typeof profile.interests === 'string' ? JSON.parse(profile.interests) : profile.interests || [];
  } catch {
    interests = [];
  }
  if (interests.length === 0) interests = ['Travel', 'Coffee', 'Design'];

  const currentPhoto = photos[activeMediaIndex] || photos[0];
  const totalPhotos = photos.length;

  return (
    <div className="w-full max-w-sm flex flex-col items-center gap-5">
      {/* White Card Container */}
      <div className="relative w-full bg-white rounded-[28px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-slate-100">

        {/* ── Photo Section ── */}
        <div className="relative w-full aspect-[3/4] overflow-hidden bg-slate-100">
          <img
            src={currentPhoto}
            alt={profile.name}
            className="w-full h-full object-cover"
          />

          {/* Top Badges Row */}
          <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between z-10">
            <span className="px-3.5 py-1 rounded-full bg-[#FF3366] text-white text-[11px] font-bold shadow-md">
              New here
            </span>
            <span className="px-3 py-1 rounded-full bg-white/80 backdrop-blur-sm text-slate-700 text-[11px] font-bold shadow-sm">
              {activeMediaIndex + 1}/{totalPhotos}
            </span>
          </div>

          {/* Photo Navigation Arrows */}
          {totalPhotos > 1 && (
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-2.5 flex justify-between z-10 pointer-events-none">
              <button
                onClick={() => setActiveMediaIndex((p) => (p > 0 ? p - 1 : totalPhotos - 1))}
                className="w-8 h-8 rounded-full bg-white/70 backdrop-blur-sm flex items-center justify-center text-slate-700 shadow pointer-events-auto hover:bg-white transition active:scale-90"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveMediaIndex((p) => (p < totalPhotos - 1 ? p + 1 : 0))}
                className="w-8 h-8 rounded-full bg-white/70 backdrop-blur-sm flex items-center justify-center text-slate-700 shadow pointer-events-auto hover:bg-white transition active:scale-90"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* ── Info Section (White Background) ── */}
        <div className="px-5 py-4 space-y-3">
          {/* Name + Age + Verified */}
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {profile.name}, {profile.age}
              </h2>
              {profile.is_verified && (
                <CheckCircle2 className="w-5 h-5 text-sky-500 fill-sky-500" style={{ color: 'white' }} />
              )}
              {!profile.is_verified && (
                <CheckCircle2 className="w-5 h-5 text-sky-500 fill-sky-500" style={{ color: 'white' }} />
              )}
            </div>

            {/* Online + Location */}
            <div className="flex items-center gap-1.5 mt-1">
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Online
              </span>
              <span className="text-xs text-slate-400 font-medium">
                • {profile.city || 'Jakarta'} • 3 km away
              </span>
            </div>
          </div>

          {/* Bio */}
          <p className="text-[13px] text-slate-600 leading-relaxed line-clamp-2">
            {profile.bio || 'Love traveling, coffee, and good conversations.'}
          </p>

          {/* Interest Pills (Outlined Style) */}
          <div className="flex flex-wrap gap-2">
            {interests.slice(0, 4).map((interest, idx) => (
              <span
                key={idx}
                className="px-4 py-1.5 rounded-full text-xs font-semibold border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition"
              >
                {interest}
              </span>
            ))}
            {interests.length > 4 && (
              <span className="px-3 py-1.5 rounded-full text-xs font-semibold border border-slate-200 text-slate-400">
                +{interests.length - 4}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Action Buttons (Below Card) ── */}
      <div className="flex items-center justify-center gap-5">
        {/* Pass (X) */}
        <button
          onClick={() => onSwipe('pass')}
          className="w-14 h-14 rounded-full bg-white border border-slate-200 text-slate-500 flex items-center justify-center shadow-md hover:shadow-lg hover:border-slate-300 active:scale-90 transition"
        >
          <X className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* Like (Heart) — Big Pink */}
        <button
          onClick={() => onSwipe('like')}
          className="w-[68px] h-[68px] rounded-full match-gradient text-white flex items-center justify-center shadow-xl match-shadow-btn hover:scale-105 active:scale-90 transition"
        >
          <Heart className="w-8 h-8 fill-white" />
        </button>

        {/* Superlike (Star) */}
        <button
          onClick={() => onSwipe('superlike')}
          className="w-14 h-14 rounded-full bg-white border border-slate-200 text-slate-500 flex items-center justify-center shadow-md hover:shadow-lg hover:border-slate-300 active:scale-90 transition"
        >
          <Star className="w-6 h-6 stroke-[2]" />
        </button>
      </div>
    </div>
  );
};
