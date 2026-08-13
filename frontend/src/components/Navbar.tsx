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
    <div className="mini-navbar-wrap fixed left-0 right-0 z-40 pointer-events-none">
      <nav className="mini-navbar pointer-events-auto" aria-label="Navigasi utama">
        {/* Discover Tab */}
        <button
          onClick={() => onTabChange('discover')}
          className={`mini-nav-button ${
            activeTab === 'discover' ? 'mini-nav-button--active' : ''
          }`}
        >
          <Compass className="mini-nav-icon" />
          <span>Discover</span>
        </button>

        {/* Likes Tab */}
        <button
          onClick={() => onTabChange('likes')}
          className={`mini-nav-button relative ${
            activeTab === 'likes' ? 'mini-nav-button--active' : ''
          }`}
        >
          <div className="relative">
            <Heart className={`mini-nav-icon ${activeTab === 'likes' ? 'fill-current' : ''}`} />
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
          className={`mini-nav-button relative ${
            activeTab === 'chats' ? 'mini-nav-button--active' : ''
          }`}
        >
          <div className="relative">
            <MessageSquare className={`mini-nav-icon ${activeTab === 'chats' ? 'fill-current' : ''}`} />
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
          className={`mini-nav-button ${
            activeTab === 'profile' ? 'mini-nav-button--active' : ''
          }`}
        >
          <User className="mini-nav-icon" />
          <span>Profile</span>
        </button>
      </nav>
    </div>
  );
};
