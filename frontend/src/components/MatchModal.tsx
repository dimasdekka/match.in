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
  userAvatar = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
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
  const matchedAvatar = photos[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm rounded-[32px] bg-white p-6 flex flex-col items-center text-center shadow-2xl space-y-6 border border-pink-100">
        {/* Brand Logo */}
        <div className="flex items-center gap-1">
          <span className="text-xl font-black text-slate-900">
            match<span className="text-[#FF3366]">.in</span>
          </span>
        </div>

        {/* 3D Heart Illustration */}
        <div className="relative flex items-center justify-center py-2">
          <div className="w-20 h-20 rounded-full match-gradient flex items-center justify-center match-shadow-btn animate-bounce">
            <Heart className="w-10 h-10 text-white fill-white" />
          </div>
        </div>

        {/* Headline */}
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-900">It's a match! 💕</h2>
          <p className="text-xs text-slate-500 font-medium">
            You and {matchedProfile.name} liked each other.
          </p>
        </div>

        {/* Overlapping Avatars Joined by Pink Heart */}
        <div className="relative flex items-center justify-center py-3">
          <div className="relative flex items-center -space-x-4">
            <img
              src={userAvatar}
              alt="You"
              className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
            />
            <img
              src={matchedAvatar}
              alt={matchedProfile.name}
              className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
            />
          </div>
          {/* Joining Heart Badge */}
          <div className="absolute z-10 w-8 h-8 rounded-full match-gradient flex items-center justify-center border-2 border-white shadow-md">
            <Heart className="w-4 h-4 text-white fill-white" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-2.5 pt-2">
          <button
            onClick={() => {
              onClose();
              onOpenMatches();
            }}
            className="w-full py-3.5 rounded-full match-gradient text-white font-bold text-xs flex items-center justify-center gap-2 match-shadow-btn hover:opacity-95 active:scale-98 transition"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>Send a message</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-full bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 active:scale-98 transition"
          >
            Keep swiping
          </button>
        </div>
      </div>
    </div>
  );
};
