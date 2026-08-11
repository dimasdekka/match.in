import React, { useState, useRef } from 'react';
import type { Profile } from '../types';
import { CheckCircle2, Heart, X, Star, ChevronLeft, ChevronRight } from 'lucide-react';

interface DiscoverCardProps {
  profile: Profile;
  onSwipe: (action: 'like' | 'pass' | 'superlike') => void;
}

export const DiscoverCard: React.FC<DiscoverCardProps> = ({ profile, onSwipe }) => {
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  // Swipe / Drag gesture state
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [swipingDirection, setSwipingDirection] = useState<'like' | 'pass' | null>(null);

  const startPos = useRef({ x: 0, y: 0 });

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

  // ── Touch & Mouse Drag Handlers ──
  const handleTouchStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    startPos.current = { x: clientX, y: clientY };
  };

  const handleTouchMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    const deltaX = clientX - startPos.current.x;
    const deltaY = clientY - startPos.current.y;
    setDragOffset({ x: deltaX, y: deltaY });

    if (deltaX > 40) {
      setSwipingDirection('like');
    } else if (deltaX < -40) {
      setSwipingDirection('pass');
    } else {
      setSwipingDirection(null);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const threshold = 100;
    if (dragOffset.x > threshold) {
      // Swipe Right -> Like
      setSwipingDirection('like');
      setTimeout(() => onSwipe('like'), 150);
    } else if (dragOffset.x < -threshold) {
      // Swipe Left -> Pass
      setSwipingDirection('pass');
      setTimeout(() => onSwipe('pass'), 150);
    } else {
      // Snap back to center
      setDragOffset({ x: 0, y: 0 });
      setSwipingDirection(null);
    }
  };

  // Card Transform Style
  const rotation = dragOffset.x * 0.08;
  const cardStyle: React.CSSProperties = {
    transform: `translate3d(${dragOffset.x}px, ${dragOffset.y * 0.3}px, 0) rotate(${rotation}deg)`,
    transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  return (
    <div className="w-full max-w-xs sm:max-w-sm flex flex-col items-center gap-3 px-2 select-none touch-none">
      {/* ── Swipeable Container Card ── */}
      <div
        style={cardStyle}
        onMouseDown={(e) => handleTouchStart(e.clientX, e.clientY)}
        onMouseMove={(e) => handleTouchMove(e.clientX, e.clientY)}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
        onTouchStart={(e) => handleTouchStart(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={(e) => handleTouchMove(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={handleTouchEnd}
        className="relative w-full bg-white rounded-[24px] overflow-hidden shadow-[0_6px_25px_rgba(0,0,0,0.08)] border border-slate-100 transition-shadow active:shadow-2xl"
      >
        {/* Swipe Badge Indicators (LIKE / NOPE Overlay) */}
        {swipingDirection === 'like' && (
          <div className="absolute top-6 left-6 z-30 border-4 border-emerald-500 rounded-xl px-4 py-1.5 rotate-[-15deg] shadow-lg pointer-events-none animate-pulse">
            <span className="text-2xl font-black text-emerald-500 tracking-wider">LIKE</span>
          </div>
        )}
        {swipingDirection === 'pass' && (
          <div className="absolute top-6 right-6 z-30 border-4 border-rose-500 rounded-xl px-4 py-1.5 rotate-[15deg] shadow-lg pointer-events-none animate-pulse">
            <span className="text-2xl font-black text-rose-500 tracking-wider">NOPE</span>
          </div>
        )}

        {/* ── Compact Photo Section ── */}
        <div className="relative w-full h-[290px] sm:h-[320px] overflow-hidden bg-slate-100">
          <img
            src={currentPhoto}
            alt={profile.name}
            className="w-full h-full object-cover pointer-events-none"
          />

          {/* Top Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
            <span className="px-3 py-0.5 rounded-full bg-[#FF3366] text-white text-[10px] font-bold shadow-md">
              New
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-white/85 backdrop-blur-sm text-slate-700 text-[10px] font-bold shadow-xs">
              {activeMediaIndex + 1}/{totalPhotos}
            </span>
          </div>

          {/* Photo Navigation Arrows */}
          {totalPhotos > 1 && (
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-2 flex justify-between z-10 pointer-events-none">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMediaIndex((p) => (p > 0 ? p - 1 : totalPhotos - 1));
                }}
                className="w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-slate-700 shadow pointer-events-auto hover:bg-white active:scale-90 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMediaIndex((p) => (p < totalPhotos - 1 ? p + 1 : 0));
                }}
                className="w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-slate-700 shadow pointer-events-auto hover:bg-white active:scale-90 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* ── Compact Info Section (No Scroll Required) ── */}
        <div className="px-4 py-3 space-y-2">
          {/* Name + Age + Verified */}
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                {profile.name}, {profile.age}
              </h2>
              <CheckCircle2 className="w-4.5 h-4.5 text-sky-500 fill-sky-500" style={{ color: 'white' }} />
            </div>

            {/* Online + Location */}
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                • {profile.city || 'Jakarta'}
              </span>
            </div>
          </div>

          {/* Bio */}
          <p className="text-[12px] text-slate-600 leading-snug line-clamp-2">
            {profile.bio || 'Menyukai kopi, musik, dan obrolan seru.'}
          </p>

          {/* Interest Pills */}
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {interests.slice(0, 3).map((interest, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-full text-[10px] font-bold border border-slate-200 text-slate-700 bg-white"
              >
                {interest}
              </span>
            ))}
            {interests.length > 3 && (
              <span className="px-2 py-1 rounded-full text-[10px] font-bold border border-slate-200 text-slate-400">
                +{interests.length - 3}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Action Buttons (Below Card) ── */}
      <div className="flex items-center justify-center gap-4 pt-1">
        {/* Pass (X) */}
        <button
          onClick={() => {
            setSwipingDirection('pass');
            setTimeout(() => onSwipe('pass'), 150);
          }}
          className="w-12 h-12 rounded-full bg-white border border-slate-200 text-slate-500 flex items-center justify-center shadow-sm hover:border-rose-200 hover:text-rose-500 active:scale-90 transition cursor-pointer"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Like (Heart) — Big Pink */}
        <button
          onClick={() => {
            setSwipingDirection('like');
            setTimeout(() => onSwipe('like'), 150);
          }}
          className="w-14 h-14 rounded-full match-gradient text-white flex items-center justify-center shadow-lg match-shadow-btn hover:scale-105 active:scale-90 transition cursor-pointer"
        >
          <Heart className="w-7 h-7 fill-white" />
        </button>

        {/* Superlike (Star) */}
        <button
          onClick={() => {
            setSwipingDirection('superlike');
            setTimeout(() => onSwipe('superlike'), 150);
          }}
          className="w-12 h-12 rounded-full bg-white border border-slate-200 text-slate-500 flex items-center justify-center shadow-sm hover:border-amber-200 hover:text-amber-500 active:scale-90 transition cursor-pointer"
        >
          <Star className="w-5 h-5 stroke-[2]" />
        </button>
      </div>
    </div>
  );
};
