import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sliders, Heart, Globe } from 'lucide-react';
import { api } from '../services/api';

interface HeaderProps {
  onOpenFilter?: () => void;
  currentLang: string;
  onLanguageChange: (lang: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenFilter, currentLang, onLanguageChange }) => {
  const { i18n } = useTranslation();

  const toggleLanguage = async () => {
    const nextLang = currentLang.toLowerCase().startsWith('id') ? 'en' : 'id';
    i18n.changeLanguage(nextLang);
    onLanguageChange(nextLang);
    try {
      await api.updateLanguage(nextLang);
    } catch (e) {
      console.error('Failed to sync language', e);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-pink-100 flex items-center justify-between shadow-xs">
      {/* Left Logo: 3D Heart + match.in */}
      <div className="flex items-center gap-1.5 cursor-pointer">
        <div className="w-8 h-8 rounded-full match-gradient flex items-center justify-center shadow-md shadow-pink-500/20">
          <Heart className="w-4.5 h-4.5 text-white fill-white animate-float-heart" />
        </div>
        <span className="text-xl font-black tracking-tight text-slate-900">
          match<span className="text-[#FF3366]">.in</span>
        </span>
      </div>

      {/* Right Action Controls (Language Switcher & Filter) */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleLanguage}
          className="px-3 py-1.5 rounded-full bg-pink-50 border border-pink-200 text-xs font-bold text-[#FF3366] flex items-center gap-1.5 hover:bg-pink-100 active:scale-95 transition cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>{currentLang.toUpperCase() === 'ID' ? '🇮🇩 ID' : '🇬🇧 EN'}</span>
        </button>

        {onOpenFilter && (
          <button
            type="button"
            onClick={onOpenFilter}
            className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition active:scale-95 cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-[#FF3366]" />
          </button>
        )}
      </div>
    </header>
  );
};
