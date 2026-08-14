import { Icon } from '@iconify/react';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import type { DiscoverProfile } from '@/modules/discover/@types';
import { LoveReactionSurface } from '@/modules/app-shell/components/LoveReactionSurface';
import { useCurrentProfile } from '@/modules/app-shell/hooks/useCurrentProfile';
import { AppHeader } from '@/modules/app-shell/components/AppHeader';
import { api } from '@/utils/api';

interface ConversationItem {
  matchId: number;
  partnerProfile: DiscoverProfile;
  lastMessageText: string;
  unreadCount: number;
}

interface Props {
  profiles?: DiscoverProfile[];
  onDiscover: () => void;
  onProfile: () => void;
  onOpenConversation: (profile: DiscoverProfile) => void;
}

export function MessagesPage({ onDiscover, onProfile, onOpenConversation }: Props) {
  const currentProfile = useCurrentProfile();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadChatsAndMatches = async () => {
      try {
        const [chatRes, matchRes] = await Promise.allSettled([
          api.getConversations(),
          api.getMatches(),
        ]);

        if (!mounted) return;

        const itemsMap = new Map<number, ConversationItem>();

        // 1. Process active conversations
        if (chatRes.status === 'fulfilled' && chatRes.value.conversations) {
          for (const c of chatRes.value.conversations) {
            let image = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80';
            if (c.matched_profile?.photos) {
              try {
                const photos = typeof c.matched_profile.photos === 'string' ? JSON.parse(c.matched_profile.photos) : c.matched_profile.photos;
                if (Array.isArray(photos) && photos.length > 0 && photos[0]) {
                  image = photos[0];
                }
              } catch {}
            }

            const partner: DiscoverProfile = {
              id: c.match_id, // Match ID used for chat
              name: c.matched_profile?.name || c.matched_user?.first_name || 'User',
              age: c.matched_profile?.age || 22,
              city: c.matched_profile?.city || 'Jakarta',
              bio: c.matched_profile?.bio || '',
              interests: [],
              image,
              distance: 3,
              verified: c.matched_profile?.is_verified ?? true,
            };

            itemsMap.set(c.match_id, {
              matchId: c.match_id,
              partnerProfile: partner,
              lastMessageText: c.last_message?.content || 'Kalian cocok! Katakan halo 💕',
              unreadCount: c.unread_count || 0,
            });
          }
        }

        // 2. Process mutual matches that might not have messages yet
        if (matchRes.status === 'fulfilled' && matchRes.value.matches) {
          for (const m of matchRes.value.matches) {
            if (!itemsMap.has(m.match_id)) {
              let image = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80';
              if (m.matched_profile?.photos) {
                try {
                  const photos = typeof m.matched_profile.photos === 'string' ? JSON.parse(m.matched_profile.photos) : m.matched_profile.photos;
                  if (Array.isArray(photos) && photos.length > 0 && photos[0]) {
                    image = photos[0];
                  }
                } catch {}
              }

              const partner: DiscoverProfile = {
                id: m.match_id,
                name: m.matched_profile?.name || m.matched_user?.first_name || 'User',
                age: m.matched_profile?.age || 22,
                city: m.matched_profile?.city || 'Jakarta',
                bio: m.matched_profile?.bio || '',
                interests: [],
                image,
                distance: 3,
                verified: m.matched_profile?.is_verified ?? true,
              };

              itemsMap.set(m.match_id, {
                matchId: m.match_id,
                partnerProfile: partner,
                lastMessageText: 'Kalian saling menyukai! Mulai obrolan 💕',
                unreadCount: 0,
              });
            }
          }
        }

        setConversations(Array.from(itemsMap.values()));
      } catch (err) {
        console.error('Failed to load conversations and matches', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadChatsAndMatches();
    return () => {
      mounted = false;
    };
  }, []);

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
      {loading && conversations.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-neutral-400">
          <Icon icon="svg-spinners:ring-resize" className="w-8 h-8 text-pink-500 animate-spin" />
        </div>
      ) : conversations.length === 0 ? (
        <LoveReactionSurface>
          <div className="flex flex-col items-center justify-center flex-1 text-center p-6 text-neutral-300 gap-4 my-auto">
            <div className="w-20 h-20 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center text-3xl text-pink-500 shadow-xl">
              <Icon icon="solar:chat-round-heart-bold" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Belum Ada Percakapan</h3>
              <p className="text-xs text-neutral-400 max-w-[260px] mx-auto mt-1">
                Pesan hanya dapat dikirim jika Anda dan pengguna lain sudah saling menyukai profil di halaman Discover.
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
          {conversations.map((item, index) => (
            <motion.button
              type="button"
              key={item.matchId}
              onClick={() => onOpenConversation(item.partnerProfile)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <span className="conversation-avatar">
                <img src={item.partnerProfile.image} alt={item.partnerProfile.name} />
                <i />
              </span>
              <span>
                <strong>{item.partnerProfile.name}</strong>
                <small>{item.lastMessageText}</small>
              </span>
              <time>{item.unreadCount > 0 ? `${item.unreadCount} baru` : 'Online'}</time>
            </motion.button>
          ))}
        </div>
      )}
    </section>
  );
}
