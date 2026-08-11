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
  likesCount = 0,
  chatsCount = 0,
}) => {
  return (
    <div className="fixed bottom-5 left-0 right-0 z-40 px-6 pointer-events-none">
      <nav className="max-w-sm mx-auto bg-white/95 backdrop-blur-xl rounded-full flex items-center justify-around px-6 py-2.5 shadow-[0_4px_30px_rgba(0,0,0,0.1)] border border-slate-100/80 pointer-events-auto">
        {/* Discover Tab */}
        <button
          onClick={() => onTabChange('discover')}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-semibold transition-all duration-200 ${
            activeTab === 'discover' ? 'text-[#FF3366]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Compass className={`w-[22px] h-[22px] ${activeTab === 'discover' ? 'stroke-[2.5px]' : ''}`} />
          <span>Discover</span>
        </button>

        {/* Likes Tab */}
        <button
          onClick={() => onTabChange('likes')}
          className={`relative flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-semibold transition-all duration-200 ${
            activeTab === 'likes' ? 'text-[#FF3366]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className="relative">
            <Heart className={`w-[22px] h-[22px] ${activeTab === 'likes' ? 'fill-[#FF3366] stroke-[#FF3366]' : ''}`} />
            {likesCount > 0 && (
              <span className="absolute -top-1.5 -right-3 min-w-[16px] h-[16px] px-1 rounded-full bg-[#FF3366] text-white text-[8px] font-extrabold flex items-center justify-center border-2 border-white">
                {likesCount > 99 ? '99+' : likesCount}
              </span>
            )}
          </div>
          <span>Likes</span>
        </button>

        {/* Chats Tab */}
        <button
          onClick={() => onTabChange('chats')}
          className={`relative flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-semibold transition-all duration-200 ${
            activeTab === 'chats' ? 'text-[#FF3366]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className="relative">
            <MessageSquare className={`w-[22px] h-[22px] ${activeTab === 'chats' ? 'fill-[#FF3366] stroke-[#FF3366]' : ''}`} />
            {chatsCount > 0 && (
              <span className="absolute -top-1.5 -right-3 min-w-[16px] h-[16px] px-1 rounded-full bg-[#FF3366] text-white text-[8px] font-extrabold flex items-center justify-center border-2 border-white">
                {chatsCount > 99 ? '99+' : chatsCount}
              </span>
            )}
          </div>
          <span>Chats</span>
        </button>

        {/* Profile Tab */}
        <button
          onClick={() => onTabChange('profile')}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-semibold transition-all duration-200 ${
            activeTab === 'profile' ? 'text-[#FF3366]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <User className={`w-[22px] h-[22px] ${activeTab === 'profile' ? 'stroke-[2.5px]' : ''}`} />
          <span>Profile</span>
        </button>
      </nav>
    </div>
  );
};
