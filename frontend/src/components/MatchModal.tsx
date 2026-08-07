import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Profile } from '../types';
import { Heart, Send, Sparkles, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface MatchModalProps {
  matchedProfile: Profile;
  onClose: () => void;
  onOpenMatches: () => void;
}

export const MatchModal: React.FC<MatchModalProps> = ({ matchedProfile, onClose, onOpenMatches }) => {
  const { t } = useTranslation();

  useEffect(() => {
    // Trigger confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {
      console.log('Confetti failed to trigger', e);
    }
  }, []);

  let photos: string[] = [];
  try {
    photos = typeof matchedProfile.photos === 'string' ? JSON.parse(matchedProfile.photos) : matchedProfile.photos || [];
  } catch {
    photos = [];
  }
  const photo = photos[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80';

  const telegramLink = matchedProfile.user?.username
    ? `https://t.me/${matchedProfile.user.username}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm rounded-3xl bg-slate-900 border border-pink-500/30 p-6 flex flex-col items-center text-center shadow-2xl shadow-pink-500/20">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-rose-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-pink-500/40 animate-bounce">
          <Heart className="w-8 h-8 text-white fill-white" />
        </div>

        <h2 className="text-2xl font-bold bg-gradient-to-r from-rose-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
          {t('matchTitle')}
        </h2>

        <p className="text-sm text-slate-300 mt-1 mb-6">
          {t('matchSubtitle', { name: matchedProfile.name })}
        </p>

        {/* Profile Avatar */}
        <div className="relative mb-6">
          <img
            src={photo}
            alt={matchedProfile.name}
            className="w-24 h-24 rounded-full object-cover border-4 border-pink-500/60 shadow-xl"
          />
          <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-pink-500 text-white shadow-md">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        {/* Buttons */}
        <div className="w-full space-y-2.5">
          {telegramLink ? (
            <a
              href={telegramLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-pink-500/30 hover:opacity-95 transition"
            >
              <Send className="w-4 h-4" />
              <span>{t('chatOnTelegram')}</span>
            </a>
          ) : (
            <button
              onClick={onOpenMatches}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-pink-500/30 hover:opacity-95 transition"
            >
              <span>{t('myMatches')}</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 text-slate-300 font-semibold text-sm hover:bg-slate-700 hover:text-white transition"
          >
            {t('keepSwiping')}
          </button>
        </div>
      </div>
    </div>
  );
};
