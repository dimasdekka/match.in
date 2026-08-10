import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sliders, Menu, Heart, Globe } from 'lucide-react';
import { api } from '../services/api';

interface HeaderProps {
  onOpenFilter?: () => void;
  currentLang: string;
  onLanguageChange: (lang: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenFilter, currentLang, onLanguageChange }) => {
  const { i18n } = useTranslation();

  const toggleLanguage = async () => {
    const nextLang = currentLang === 'id' ? 'en' : 'id';
    i18n.changeLanguage(nextLang);
    onLanguageChange(nextLang);
    try {
      await api.updateLanguage(nextLang);
    } catch (e) {
      console.error('Failed to sync language', e);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md px-4 py-3 border-b border-pink-100 flex items-center justify-between shadow-xs">
      {/* Left Menu Button */}
      <button className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition active:scale-95">
        <Menu className="w-5 h-5" />
      </button>

      {/* Center Logo: 3D Heart + match.in */}
      <div className="flex items-center gap-1.5 cursor-pointer">
        <div className="w-7 h-7 rounded-full match-gradient flex items-center justify-center shadow-md shadow-pink-500/20">
          <Heart className="w-4 h-4 text-white fill-white animate-float-heart" />
        </div>
        <span className="text-xl font-black tracking-tight text-slate-900">
          match<span className="text-[#FF3366]">.in</span>
        </span>
      </div>

      {/* Right Action Controls (Filter & Language) */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleLanguage}
          className="px-2.5 py-1.5 rounded-full bg-pink-50 border border-pink-200/80 text-[11px] font-bold text-[#FF3366] flex items-center gap-1 hover:bg-pink-100 transition active:scale-95"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>{currentLang.toUpperCase()}</span>
        </button>

        {onOpenFilter && (
          <button
            onClick={onOpenFilter}
            className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition active:scale-95"
          >
            <Sliders className="w-5 h-5 text-[#FF3366]" />
          </button>
        )}
      </div>
    </header>
  );
};
