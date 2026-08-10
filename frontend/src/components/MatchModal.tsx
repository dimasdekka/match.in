import React from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, Send, Sparkles, X } from 'lucide-react';
import type { SwipeResponse } from '../types';

interface MatchModalProps {
  matchData: SwipeResponse | null;
  onClose: () => void;
}

export const MatchModal: React.FC<MatchModalProps> = ({ matchData, onClose }) => {
  const { t } = useTranslation();

  if (!matchData || !matchData.is_match) return null;

  const match = matchData.match;
  const profile = match?.matched_profile || matchData.profile;
  const name = profile?.name || match?.matched_user?.first_name || 'Someone';
  const username = match?.telegram_username || match?.matched_user?.username || '';
  const chatUrl = match?.direct_telegram_link || (username ? `https://t.me/${username}` : '#');

  // Photo
  let photosArray: string[] = [];
  if (Array.isArray(profile?.photos)) photosArray = profile.photos;
  else if (typeof profile?.photos === 'string' && profile.photos.trim()) {
    try {
      photosArray = JSON.parse(profile.photos);
    } catch {
      photosArray = [profile.photos];
    }
  }
  const photoUrl = photosArray[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-sm bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-pink-500/30 rounded-3xl p-6 text-center space-y-5 shadow-2xl shadow-pink-500/10 relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800/80 text-slate-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Animated Heart / Sparkles */}
        <div className="relative w-20 h-20 mx-auto mt-2">
          <div className="absolute inset-0 bg-gradient-to-tr from-rose-500 via-pink-500 to-purple-600 rounded-full animate-ping opacity-30" />
          <div className="relative w-full h-full bg-gradient-to-tr from-rose-500 via-pink-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-pink-500/30">
            <Heart className="w-10 h-10 text-white fill-white animate-bounce" />
          </div>
          <Sparkles className="w-6 h-6 text-amber-300 absolute -top-1 -right-1 animate-pulse" />
        </div>

        {/* Match Title */}
        <div className="space-y-1">
          <h2 className="text-2xl font-black bg-gradient-to-r from-rose-400 via-pink-400 to-purple-400 bg-clip-text text-transparent uppercase tracking-wide">
            {t('matchTitle')}
          </h2>
          <p className="text-xs text-slate-300">
            {t('matchSubtitle', { name })}
          </p>
        </div>

        {/* Matched Avatar */}
        <div className="relative w-24 h-24 mx-auto rounded-2xl overflow-hidden border-2 border-pink-500 shadow-xl">
          <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
        </div>

        {/* Actions */}
        <div className="space-y-2.5 pt-2">
          <a
            href={chatUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 hover:opacity-95 transition active:scale-95"
          >
            <Send className="w-4 h-4" />
            <span>{t('chatOnTelegram')}</span>
          </a>

          <button
            onClick={onClose}
            className="w-full py-3 px-4 rounded-2xl bg-slate-800 text-slate-300 font-semibold text-xs hover:bg-slate-700 transition"
          >
            {t('keepSwiping')}
          </button>
        </div>
      </div>
    </div>
  );
};
