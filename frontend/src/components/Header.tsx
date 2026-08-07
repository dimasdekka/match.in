import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Sliders, Heart, Sparkles } from 'lucide-react';
import { api } from '../services/api';

interface HeaderProps {
  onOpenFilter?: () => void;
  currentLang: string;
  onLanguageChange: (lang: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenFilter, currentLang, onLanguageChange }) => {
  const { t, i18n } = useTranslation();

  const toggleLanguage = async () => {
    const nextLang = currentLang === 'id' ? 'en' : 'id';
    i18n.changeLanguage(nextLang);
    onLanguageChange(nextLang);
    try {
      await api.updateLanguage(nextLang);
    } catch (e) {
      console.error('Failed to sync language to backend', e);
    }
  };

  const appDisplayName = currentLang === 'id' ? 'Ketemu.in' : 'Match.in';
  const appTagline = currentLang === 'id' ? 'Cari Pasangan & Matchmaking' : 'Find Matches & Dating';

  return (
    <header className="sticky top-0 z-40 px-4 py-3 ios-glass border-b border-white/10 shadow-xl">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Brand Logo & iOS Pill */}
        <div className="flex items-center gap-2.5">
          <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-pink-500/25 border border-white/20">
            <Heart className="w-5 h-5 text-white fill-white animate-pulse" />
            <Sparkles className="w-3 h-3 text-amber-300 absolute -top-1 -right-1" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-rose-400 via-pink-300 to-indigo-300 bg-clip-text text-transparent">
                {appDisplayName}
              </h1>
              <span className="text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/10 text-pink-300 border border-white/20 backdrop-blur-md">
                iOS GLASS
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide">
              {appTagline}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {onOpenFilter && (
            <button
              onClick={onOpenFilter}
              className="p-2.5 rounded-2xl ios-glass-button text-slate-200 hover:text-white shadow-md"
              title={t('filterTitle')}
            >
              <Sliders className="w-4 h-4 text-pink-400" />
            </button>
          )}

          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl ios-glass-button text-xs font-bold text-slate-200 hover:text-white shadow-md"
          >
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <span>{currentLang.toUpperCase()}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
