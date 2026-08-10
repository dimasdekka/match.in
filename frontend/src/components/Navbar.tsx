import React from 'react';
import { useTranslation } from 'react-i18next';
import { Flame, Heart, User as UserIcon } from 'lucide-react';

export type TabType = 'discover' | 'matches' | 'profile';

interface NavbarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  matchesCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  matchesCount = 0,
}) => {
  const { t } = useTranslation();

  const tabs: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'discover', label: t('tabDiscover'), icon: Flame },
    { id: 'matches', label: t('tabMatches'), icon: Heart },
    { id: 'profile', label: t('tabProfile'), icon: UserIcon },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-md border-t border-slate-800/80 px-6 py-2 max-w-md mx-auto">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-pink-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-6 h-6 transition-transform duration-200 ${
                    isActive ? 'scale-110 text-pink-400 fill-pink-500/20' : ''
                  }`}
                />
                {tab.id === 'matches' && matchesCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border border-slate-950">
                    {matchesCount > 99 ? '99+' : matchesCount}
                  </span>
                )}
              </div>
              <span className="text-[11px]">{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
