import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Sliders, Heart } from 'lucide-react';
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
  const appTagline = currentLang === 'id' ? 'Cari Pasangan, Teman & Matchmaking' : 'Dating, Find Friends & Matchmaking';

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-rose-500 via-pink-500 to-purple-600 flex items-center justify-center shadow-md shadow-pink-500/20">
          <Heart className="w-5 h-5 text-white fill-white animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-xl font-bold bg-gradient-to-r from-rose-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              {appDisplayName}
            </h1>
            <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-400 border border-pink-500/20">
              MINI APP
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium leading-none mt-0.5">
            {appTagline}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {onOpenFilter && (
          <button
            onClick={onOpenFilter}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition active:scale-95"
            title={t('filterTitle')}
          >
            <Sliders className="w-4 h-4 text-pink-400" />
          </button>
        )}

        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition active:scale-95"
        >
          <Globe className="w-3.5 h-3.5 text-purple-400" />
          <span>{currentLang.toUpperCase()}</span>
        </button>
      </div>
    </header>
  );
};
