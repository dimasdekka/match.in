import React from 'react';
import { Heart } from 'lucide-react';

interface WelcomeScreenProps {
  onContinue: () => void;
}

const SAMPLE_AVATARS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=2&w=96&h=96&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=96&h=96&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=facearea&facepad=2&w=96&h=96&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=96&h=96&q=80',
];

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onContinue }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-gradient-to-b from-pink-50 via-white to-white px-6 py-10 overflow-hidden">
      {/* Soft Pink Glow Background Circle */}
      <div className="absolute top-[-60px] left-1/2 -translate-x-1/2 w-[340px] h-[340px] rounded-full bg-pink-100/60 blur-3xl pointer-events-none" />

      {/* Top Section: Logo + Tagline */}
      <div className="relative z-10 flex flex-col items-center text-center pt-12 space-y-5">
        {/* 3D Heart Logo */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-400 via-[#FF3366] to-pink-500 flex items-center justify-center shadow-2xl shadow-pink-500/30 animate-float-heart">
            <Heart className="w-12 h-12 text-white fill-white drop-shadow-md" />
          </div>
          {/* Subtle glow ring */}
          <div className="absolute inset-0 w-24 h-24 rounded-full bg-pink-400/20 blur-xl -z-10" />
        </div>

        {/* Brand Name */}
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          match<span className="text-[#FF3366]">.in</span>
        </h1>

        {/* Tagline */}
        <div className="space-y-1">
          <h2 className="text-2xl font-extrabold text-slate-900 leading-tight">
            Real <span className="match-gradient-text">connections</span>
          </h2>
          <h2 className="text-2xl font-extrabold text-slate-900 leading-tight">
            start here
          </h2>
        </div>

        <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-[260px]">
          Meet genuine people nearby<br />and find your spark 💕
        </p>

        {/* Avatar Row */}
        <div className="flex items-center justify-center pt-3">
          <div className="flex -space-x-3">
            {SAMPLE_AVATARS.map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt={`User ${idx + 1}`}
                className="w-12 h-12 rounded-full object-cover border-[3px] border-white shadow-md"
              />
            ))}
            {/* Plus button */}
            <div className="w-12 h-12 rounded-full bg-pink-50 border-[3px] border-white shadow-md flex items-center justify-center text-pink-400 font-bold text-lg">
              +
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: CTA Button + Privacy Text */}
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-4 pb-4">
        {/* Continue with Telegram Button */}
        <button
          onClick={onContinue}
          className="w-full py-4 rounded-full match-gradient text-white font-bold text-sm flex items-center justify-center gap-2.5 match-shadow-btn hover:opacity-95 active:scale-[0.98] transition-all duration-200"
        >
          <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
          </svg>
          <span>Continue with Telegram</span>
        </button>

        {/* Privacy Notice */}
        <p className="text-[11px] text-slate-400 font-medium text-center">
          100% private. No posts on your Telegram.
        </p>
      </div>
    </div>
  );
};
