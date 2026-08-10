import React, { useState } from 'react';
import type { Profile } from '../types';
import { CheckCircle2, Heart, X, Star, ChevronLeft, ChevronRight } from 'lucide-react';

interface DiscoverCardProps {
  profile: Profile;
  onSwipe: (action: 'like' | 'pass' | 'superlike') => void;
}

export const DiscoverCard: React.FC<DiscoverCardProps> = ({ profile, onSwipe }) => {
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  // Parse photos safely
  let photos: string[] = [];
  try {
    photos = typeof profile.photos === 'string' ? JSON.parse(profile.photos) : profile.photos || [];
  } catch {
    photos = [];
  }
  if (photos.length === 0) {
    photos = ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'];
  }

  // Parse interests safely
  let interests: string[] = [];
  try {
    interests = typeof profile.interests === 'string' ? JSON.parse(profile.interests) : profile.interests || [];
  } catch {
    interests = [];
  }
  if (interests.length === 0) {
    interests = ['Travel', 'Coffee', 'Design'];
  }

  const currentPhoto = photos[activeMediaIndex] || photos[0];

  return (
    <div className="w-full max-w-sm flex flex-col items-center gap-5">
      {/* Card Container */}
      <div className="relative w-full h-[520px] rounded-[32px] overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.12)] border border-slate-100 flex flex-col justify-between bg-slate-900 selection:bg-none">
        {/* Photo Media Background */}
        <div className="absolute inset-0 z-0">
          <img
            src={currentPhoto}
            alt={profile.name}
            className="w-full h-full object-cover"
          />
          {/* Subtle Dark Gradient Overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
        </div>

        {/* Top Badges */}
        <div className="relative z-10 p-4 flex items-center justify-between">
          <span className="px-3 py-1 rounded-full bg-[#FF3366] text-white text-xs font-bold shadow-md shadow-pink-500/30">
            New here
          </span>

          <span className="px-3 py-1 rounded-full match-pill-dark text-xs font-bold tracking-wide">
            {activeMediaIndex + 1}/{photos.length || 1}
          </span>
        </div>

        {/* Photo Gallery Tap Controls */}
        {photos.length > 1 && (
          <div className="absolute inset-x-0 top-1/3 z-10 px-2 flex justify-between pointer-events-none">
            <button
              onClick={() => setActiveMediaIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1))}
              className="p-2 rounded-full bg-black/30 text-white backdrop-blur-md pointer-events-auto hover:bg-black/50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveMediaIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0))}
              className="p-2 rounded-full bg-black/30 text-white backdrop-blur-md pointer-events-auto hover:bg-black/50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Card Content Overlay */}
        <div className="relative z-10 p-5 space-y-3 mt-auto">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-white tracking-tight">
                {profile.name}, {profile.age}
              </h2>
              <CheckCircle2 className="w-5 h-5 text-sky-400 fill-sky-400 text-slate-900" />
            </div>

            <div className="flex items-center gap-2 mt-1">
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Online
              </span>
              <span className="text-xs text-slate-300 font-medium">
                • {profile.city || 'Jakarta'} • 3 km away
              </span>
            </div>

            <p className="text-xs text-slate-200 mt-2 font-normal leading-relaxed line-clamp-2">
              {profile.bio || 'Love traveling, coffee, and good conversations.'}
            </p>
          </div>

          {/* Interest Pills */}
          <div className="flex flex-wrap gap-2 pt-1">
            {interests.map((interest, idx) => (
              <span
                key={idx}
                className="px-3.5 py-1 rounded-full match-pill-dark text-xs font-semibold"
              >
                {interest}
              </span>
            ))}
            <span className="px-3 py-1 rounded-full match-pill-dark text-xs font-semibold">+</span>
          </div>
        </div>
      </div>

      {/* Screen 2 Action Buttons */}
      <div className="flex items-center justify-center gap-6">
        {/* Pass Button */}
        <button
          onClick={() => onSwipe('pass')}
          className="w-14 h-14 rounded-full bg-white border border-slate-200/80 text-slate-800 flex items-center justify-center shadow-lg hover:bg-slate-50 active:scale-95 transition"
          title="Pass"
        >
          <X className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* Like Button */}
        <button
          onClick={() => onSwipe('like')}
          className="w-18 h-18 rounded-full match-gradient text-white flex items-center justify-center match-shadow-btn hover:scale-105 active:scale-95 transition"
          title="Like"
        >
          <Heart className="w-8 h-8 fill-white" />
        </button>

        {/* Superlike Button */}
        <button
          onClick={() => onSwipe('superlike')}
          className="w-14 h-14 rounded-full bg-white border border-slate-200/80 text-slate-800 flex items-center justify-center shadow-lg hover:bg-slate-50 active:scale-95 transition"
          title="Superlike"
        >
          <Star className="w-6 h-6 text-slate-700 stroke-[2]" />
        </button>
      </div>
    </div>
  );
};
