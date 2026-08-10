import React from 'react';
import { Compass, Heart, MessageSquare, User } from 'lucide-react';

export type NavTab = 'discover' | 'likes' | 'chats' | 'profile';

interface NavbarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  likesCount?: number;
  chatsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  likesCount = 12,
  chatsCount = 2,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-pink-100 px-6 py-2 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
      <nav className="max-w-md mx-auto flex items-center justify-between">
        {/* Discover Tab */}
        <button
          onClick={() => onTabChange('discover')}
          className={`flex flex-col items-center gap-0.5 text-[11px] font-semibold transition-all duration-200 ${
            activeTab === 'discover' ? 'text-[#FF3366] scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Compass className={`w-5 h-5 ${activeTab === 'discover' ? 'stroke-[2.5px]' : ''}`} />
          <span>Discover</span>
        </button>

        {/* Likes Tab with Badge */}
        <button
          onClick={() => onTabChange('likes')}
          className={`relative flex flex-col items-center gap-0.5 text-[11px] font-semibold transition-all duration-200 ${
            activeTab === 'likes' ? 'text-[#FF3366] scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className="relative">
            <Heart className={`w-5 h-5 ${activeTab === 'likes' ? 'fill-[#FF3366] stroke-[#FF3366]' : ''}`} />
            {likesCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 px-1.5 py-0.2 rounded-full bg-[#FF3366] text-white text-[9px] font-extrabold shadow-sm border border-white">
                {likesCount}
              </span>
            )}
          </div>
          <span>Likes</span>
        </button>

        {/* Chats Tab with Badge */}
        <button
          onClick={() => onTabChange('chats')}
          className={`relative flex flex-col items-center gap-0.5 text-[11px] font-semibold transition-all duration-200 ${
            activeTab === 'chats' ? 'text-[#FF3366] scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className="relative">
            <MessageSquare className={`w-5 h-5 ${activeTab === 'chats' ? 'fill-[#FF3366] stroke-[#FF3366]' : ''}`} />
            {chatsCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 px-1.5 py-0.2 rounded-full bg-[#FF3366] text-white text-[9px] font-extrabold shadow-sm border border-white">
                {chatsCount}
              </span>
            )}
          </div>
          <span>Chats</span>
        </button>

        {/* Profile Tab */}
        <button
          onClick={() => onTabChange('profile')}
          className={`flex flex-col items-center gap-0.5 text-[11px] font-semibold transition-all duration-200 ${
            activeTab === 'profile' ? 'text-[#FF3366] scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <User className={`w-5 h-5 ${activeTab === 'profile' ? 'stroke-[2.5px]' : ''}`} />
          <span>Profile</span>
        </button>
      </nav>
    </div>
  );
};
