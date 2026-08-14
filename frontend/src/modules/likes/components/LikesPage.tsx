import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { motion } from 'motion/react';
import type { DiscoverProfile } from '@/modules/discover/@types';
import { LoveReactionSurface } from '@/modules/app-shell/components/LoveReactionSurface';
import { api } from '@/utils/api';
import type { Profile } from '@/@types';

type LikeTab = 'received' | 'sent' | 'matches';

export function LikesPage({
  onDateNight,
  onMenu,
  onOpenConversation,
}: {
  profiles?: DiscoverProfile[];
  onDateNight: () => void;
  onMenu: () => void;
  onOpenConversation?: (profile: DiscoverProfile) => void;
}) {
  const [tab, setTab] = useState<LikeTab>('received');
  const [receivedLikes, setReceivedLikes] = useState<DiscoverProfile[]>([]);
  const [sentLikes, setSentLikes] = useState<DiscoverProfile[]>([]);
  const [matches, setMatches] = useState<DiscoverProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<DiscoverProfile | null>(null);

  const mapProfile = (p: Profile): DiscoverProfile => {
    let photos: string[] = [];
    try {
      photos = typeof p.photos === 'string' ? JSON.parse(p.photos) : p.photos || [];
    } catch {
      photos = [];
    }
    const img = photos[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80';

    return {
      id: p.user_id || p.id,
      name: p.name,
      age: p.age,
      city: p.city || 'Jakarta',
      distance: 3,
      bio: p.bio || '',
      image: img,
      verified: p.is_verified ?? true,
      interests: [],
    };
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    Promise.allSettled([
      api.getLikesReceived(),
      api.getLikesSent(),
      api.getMatches(),
    ]).then(([recRes, sentRes, matchRes]) => {
      if (!mounted) return;
      if (recRes.status === 'fulfilled' && recRes.value.profiles) {
        setReceivedLikes(recRes.value.profiles.map(mapProfile));
      }
      if (sentRes.status === 'fulfilled' && sentRes.value.profiles) {
        setSentLikes(sentRes.value.profiles.map(mapProfile));
      }
      if (matchRes.status === 'fulfilled' && matchRes.value.matches) {
        setMatches(
          matchRes.value.matches.map((m) => {
            const mapped = mapProfile(m.matched_profile);
            mapped.id = m.match_id;
            return mapped;
          }),
        );
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const currentList =
    tab === 'received' ? receivedLikes : tab === 'sent' ? sentLikes : matches;

  return (
    <section className="app-page likes-page">
      <div className="likes-toolbar">
        <button type="button" className="app-circle-button" onClick={onMenu} aria-label="Menu">
          <Icon icon="solar:widget-4-bold" />
        </button>

        {/* Segmented Control Tabs */}
        <div className="flex bg-neutral-900/90 p-1 rounded-full border border-white/10 text-xs font-bold">
          <button
            type="button"
            onClick={() => setTab('received')}
            className={`px-3 py-1.5 rounded-full transition ${
              tab === 'received'
                ? 'bg-pink-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Likes You ({receivedLikes.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('sent')}
            className={`px-3 py-1.5 rounded-full transition ${
              tab === 'sent'
                ? 'bg-pink-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            You Liked ({sentLikes.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('matches')}
            className={`px-3 py-1.5 rounded-full transition ${
              tab === 'matches'
                ? 'bg-pink-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Matches ({matches.length})
          </button>
        </div>

        <button
          type="button"
          className="app-circle-button"
          onClick={onDateNight}
          aria-label="Date Night"
        >
          <Icon icon="solar:heart-bold" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-neutral-400">
          <Icon icon="svg-spinners:ring-resize" className="w-8 h-8 text-pink-500 animate-spin" />
        </div>
      ) : currentList.length > 0 ? (
        <div className="liked-grid">
          {currentList.map((profile) => (
            <motion.article
              key={`${tab}-${profile.id}`}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              role="button"
              tabIndex={0}
              onClick={() => {
                if (tab === 'matches' && onOpenConversation) {
                  onOpenConversation(profile);
                } else {
                  setSelectedProfile(profile);
                }
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  if (tab === 'matches' && onOpenConversation) {
                    onOpenConversation(profile);
                  } else {
                    setSelectedProfile(profile);
                  }
                }
              }}
              className="cursor-pointer"
            >
              <img src={profile.image} alt={profile.name} />
              <div>
                <strong>
                  {profile.name}, {profile.age}
                </strong>
                <span>
                  {profile.city} · {profile.distance} km
                </span>
                {tab === 'matches' && (
                  <span className="text-[11px] text-pink-400 font-bold mt-0.5">
                    💬 Ketuk untuk chat
                  </span>
                )}
              </div>
            </motion.article>
          ))}
        </div>
      ) : (
        <LoveReactionSurface>
          <div className="empty-state likes-empty">
            <div className="stacked-cards">
              <span />
              <span>
                <Icon icon="solar:heart-bold" />
              </span>
            </div>
            <h2>
              {tab === 'received'
                ? 'Belum ada yang menyukai'
                : tab === 'sent'
                ? 'Belum ada yang disukai'
                : 'Belum ada match'}
            </h2>
            <p>
              {tab === 'received'
                ? 'Profil pengguna yang menyukai Anda akan muncul di sini'
                : tab === 'sent'
                ? 'Profil yang telah Anda like akan tersimpan di sini'
                : 'Ketika kalian saling like, match akan muncul di sini'}
            </p>
          </div>
        </LoveReactionSurface>
      )}
      {selectedProfile && (
        <motion.section className="liked-profile-detail" initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }}>
          <header className="liked-profile-header">
            <button type="button" onClick={() => setSelectedProfile(null)} aria-label="Back"><Icon icon="solar:alt-arrow-left-linear" /></button>
            <strong>{selectedProfile.name.toLowerCase().replace(/\s+/g, '')}</strong>
            <button type="button" aria-label="More options"><Icon icon="solar:menu-dots-bold" /></button>
          </header>
          <div className="liked-profile-scroll">
            <div className="liked-profile-overview">
              <div className="liked-profile-avatar"><img src={selectedProfile.image} alt={selectedProfile.name} /><i /></div>
              <div><strong>{selectedProfile.age}</strong><span>Age</span></div>
              <div><strong>{selectedProfile.distance}</strong><span>km away</span></div>
              <div><strong>{selectedProfile.interests?.length || 0}</strong><span>Interests</span></div>
            </div>
            <div className="liked-profile-copy">
              <h1>{selectedProfile.name} {selectedProfile.verified && <Icon icon="solar:verified-check-bold" />}</h1>
              <span><Icon icon="solar:map-point-bold" /> {selectedProfile.city}</span>
              <p>{selectedProfile.bio || 'Say hello and get to know each other.'}</p>
            </div>
            <div className="liked-profile-actions">
              <button type="button" onClick={() => onOpenConversation?.(selectedProfile)}>Message</button>
              <button type="button" aria-label="Like"><Icon icon="solar:heart-bold" /></button>
            </div>
            {selectedProfile.interests && selectedProfile.interests.length > 0 && (
              <div className="liked-profile-highlights">
                {selectedProfile.interests.map((interest) => <div key={interest.label}><span><Icon icon={interest.icon} /></span><small>{interest.label}</small></div>)}
              </div>
            )}
            <div className="liked-profile-tabs"><Icon icon="solar:gallery-wide-bold" /><Icon icon="solar:heart-angle-bold" /></div>
            <div className="liked-profile-grid">
              {[0, 1, 2, 3, 4, 5].map((item) => <img key={item} src={selectedProfile.image} alt="" />)}
            </div>
          </div>
        </motion.section>
      )}
    </section>
  );
}
