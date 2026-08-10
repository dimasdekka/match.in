import React from 'react';
import type { Profile } from '../types';
import { Heart, MessageCircle } from 'lucide-react';

interface MatchModalProps {
  matchedProfile: Profile;
  userAvatar?: string;
  onClose: () => void;
  onOpenMatches: () => void;
}

export const MatchModal: React.FC<MatchModalProps> = ({
  matchedProfile,
  userAvatar = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  onClose,
  onOpenMatches,
}) => {
  // Parse matched photo
  let photos: string[] = [];
  try {
    photos = typeof matchedProfile.photos === 'string' ? JSON.parse(matchedProfile.photos) : matchedProfile.photos || [];
  } catch {
    photos = [];
  }
  const matchedAvatar = photos[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white rounded-[32px] px-6 py-8 flex flex-col items-center text-center shadow-2xl space-y-5 border border-pink-50">

        {/* Brand */}
        <span className="text-lg font-black text-slate-900 tracking-tight">
          match<span className="text-[#FF3366]">.in</span>
        </span>

        {/* 3D Pink Heart */}
        <div className="relative py-2">
          {/* Soft pink glow behind */}
          <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full bg-pink-200/50 blur-2xl" />
          <div className="relative w-24 h-24 mx-auto">
            {/* Heart shape using gradient */}
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg" style={{ filter: 'drop-shadow(0 8px 20px rgba(255, 51, 102, 0.35))' }}>
              <defs>
                <linearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FF7EB3" />
                  <stop offset="50%" stopColor="#FF3366" />
                  <stop offset="100%" stopColor="#FF2A60" />
                </linearGradient>
              </defs>
              <path
                d="M50 88 C25 65, 0 45, 0 28 C0 12, 12 0, 25 0 C35 0, 45 8, 50 18 C55 8, 65 0, 75 0 C88 0, 100 12, 100 28 C100 45, 75 65, 50 88Z"
                fill="url(#heartGrad)"
              />
              {/* Shine highlight */}
              <ellipse cx="32" cy="22" rx="12" ry="8" fill="rgba(255,255,255,0.35)" transform="rotate(-25 32 22)" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <h2 className="text-2xl font-black text-slate-900">It's a match! 💕</h2>
          <p className="text-sm text-slate-500 font-medium">
            You and {matchedProfile.name} liked each other.
          </p>
        </div>

        {/* Overlapping Avatars with Joining Heart */}
        <div className="relative flex items-center justify-center py-2">
          <div className="flex items-center">
            {/* Your Avatar */}
            <img
              src={userAvatar}
              alt="You"
              className="w-24 h-24 rounded-full object-cover border-[4px] border-white shadow-lg z-10"
            />
            {/* Matched Avatar */}
            <img
              src={matchedAvatar}
              alt={matchedProfile.name}
              className="w-24 h-24 rounded-full object-cover border-[4px] border-white shadow-lg -ml-5 z-0"
            />
          </div>

          {/* Small Heart Bridge */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 z-20 w-9 h-9 rounded-full match-gradient flex items-center justify-center border-[3px] border-white shadow-md">
            <Heart className="w-4 h-4 text-white fill-white" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-2.5 pt-3">
          {/* Send a message */}
          <button
            onClick={() => {
              onClose();
              onOpenMatches();
            }}
            className="w-full py-3.5 rounded-full match-gradient text-white font-bold text-sm flex items-center justify-center gap-2 match-shadow-btn hover:opacity-95 active:scale-[0.98] transition"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Send a message</span>
          </button>

          {/* Keep swiping */}
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-full bg-white border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 active:scale-[0.98] transition"
          >
            Keep swiping
          </button>
        </div>
      </div>
    </div>
  );
};
