import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Sliders, Heart, User as UserIcon } from 'lucide-react';
import { api } from '../services/api';
import type { User } from '../types';

interface HeaderProps {
  onOpenFilter?: () => void;
  currentLang: string;
  onLanguageChange: (lang: string) => void;
  user?: User | null;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenFilter,
  currentLang,
  onLanguageChange,
  user,
}) => {
  const { t, i18n } = useTranslation();

  const tgUser = typeof window !== 'undefined' ? window.Telegram?.WebApp?.initDataUnsafe?.user : undefined;
  const avatarUrl = tgUser?.photo_url;
  const displayName = user?.first_name || tgUser?.first_name || 'User';

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
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-rose-500 via-pink-500 to-purple-600 flex items-center justify-center shadow-md shadow-pink-500/20 shrink-0">
          <Heart className="w-5 h-5 text-white fill-white animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-xl font-bold bg-gradient-to-r from-rose-400 via-pink-400 to-purple-400 bg-clip-text text-transparent leading-none">
              {appDisplayName}
            </h1>
            <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-400 border border-pink-500/20 leading-none">
              MINI APP
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium leading-none mt-1">
            {appTagline}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Telegram User Avatar */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800/80 rounded-full py-1 px-2.5">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-5 h-5 rounded-full object-cover border border-pink-400/50"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-[10px] font-bold text-white">
              {displayName.charAt(0).toUpperCase() || <UserIcon className="w-3 h-3" />}
            </div>
          )}
          <span className="text-xs font-semibold text-slate-200 truncate max-w-[70px]">
            {displayName}
          </span>
        </div>

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
