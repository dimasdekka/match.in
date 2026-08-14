import { Icon } from '@iconify/react';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import type { DiscoverProfile } from '@/modules/discover/@types';
import { LoveReactionSurface } from '@/modules/app-shell/components/LoveReactionSurface';
import { useCurrentProfile } from '@/modules/app-shell/hooks/useCurrentProfile';
import { AppHeader } from '@/modules/app-shell/components/AppHeader';
import { api } from '@/utils/api';

interface Props {
  profiles: DiscoverProfile[];
  onDiscover: () => void;
  onProfile: () => void;
  onOpenConversation: (profile: DiscoverProfile) => void;
}

export function MessagesPage({ profiles, onDiscover, onProfile, onOpenConversation }: Props) {
  const currentProfile = useCurrentProfile();
  const [displayProfiles, setDisplayProfiles] = useState<DiscoverProfile[]>(profiles);

  useEffect(() => {
    let mounted = true;
    api.getConversations()
      .then(({ conversations }) => {
        if (!mounted) return;
        if (conversations && conversations.length > 0) {
          const mapped: DiscoverProfile[] = conversations.map((c) => {
            const name = c.matched_profile?.name || c.matched_user?.first_name || 'User';
            let image = `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80`;
            if (c.matched_profile?.photos) {
              try {
                const photos = typeof c.matched_profile.photos === 'string' ? JSON.parse(c.matched_profile.photos) : c.matched_profile.photos;
                if (Array.isArray(photos) && photos.length > 0 && photos[0]) {
                  image = photos[0];
                }
              } catch {}
            }

            return {
              id: c.match_id,
              name,
              age: c.matched_profile?.age || 22,
              city: c.matched_profile?.city || 'Jakarta',
              bio: c.matched_profile?.bio || '',
              interests: [],
              image,
              distance: 3,
              verified: c.matched_profile?.is_verified ?? true,
            };
          });
          setDisplayProfiles(mapped);
        }
      })
      .catch(() => {
        // Fallback already handled by initial state
      });
    return () => { mounted = false; };
  }, [profiles]);

  return (
    <section className="app-page messages-page">
      <AppHeader
        left={<span className="w-11 h-11" />}
        center={<h1 className="text-lg font-black tracking-tight text-white m-0">Messages</h1>}
        right={
          <button type="button" className="profile-monogram" onClick={onProfile} aria-label="Profile">
            {currentProfile.mainPhoto ? (
              <img src={currentProfile.mainPhoto} alt={currentProfile.name} />
            ) : (
              currentProfile.initials
            )}
          </button>
        }
      />
      {displayProfiles.length === 0 ? (
        <LoveReactionSurface>
          <div className="flex flex-col items-center justify-center flex-1 text-center p-6 text-neutral-300 gap-4 my-auto">
            <div className="w-20 h-20 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center text-3xl text-pink-500 shadow-xl">
              <Icon icon="solar:chat-round-heart-bold" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Belum Ada Percakapan</h3>
              <p className="text-xs text-neutral-400 max-w-[260px] mx-auto mt-1">
                Mulai obrolan baru dengan menemukan pasangan cocok Anda di halaman Discover.
              </p>
            </div>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                className="px-4 py-2 rounded-full bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-pink-600/30"
                onClick={onDiscover}
              >
                <Icon icon="solar:magnifer-linear" /> Cari Pasangan
              </button>
            </div>
          </div>
        </LoveReactionSurface>
      ) : (
        <div className="conversation-list">
          {displayProfiles.map((profile, index) => (
            <motion.button
              type="button"
              key={profile.id}
              onClick={() => onOpenConversation(profile)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <span className="conversation-avatar">
                <img src={profile.image} alt="" />
                <i />
              </span>
              <span>
                <strong>{profile.name}</strong>
                <small>
                  {index === 0 ? 'You matched! Say hello 💕' : 'Start a new conversation'}
                </small>
              </span>
              <time>Now</time>
            </motion.button>
          ))}
        </div>
      )}
    </section>
  );
}
