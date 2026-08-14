import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { motion } from 'motion/react';
import type { DiscoverProfile } from '@/modules/discover/@types';
import { LoveReactionSurface } from '@/modules/app-shell/components/LoveReactionSurface';
import { AppHeader } from '@/modules/app-shell/components/AppHeader';
import { api } from '@/utils/api';
import type { Profile } from '@/@types';

type LikeTab = 'received' | 'sent';

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

    const loadLikes = async () => {
      try {
        const [recRes, sentRes] = await Promise.all([
          api.getLikesReceived(),
          api.getLikesSent(),
        ]);
        if (!mounted) return;
        if (recRes?.profiles) {
          setReceivedLikes(recRes.profiles.map(mapProfile));
        }
        if (sentRes?.profiles) {
          setSentLikes(sentRes.profiles.map(mapProfile));
        }
      } catch (err) {
        console.error('Failed to load likes', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadLikes();
    return () => {
      mounted = false;
    };
  }, []);

  const currentList = tab === 'received' ? receivedLikes : sentLikes;

  const handleLikeBack = async (target: DiscoverProfile) => {
    try {
      const res = await api.swipe(target.id, 'like');
      if (res.is_match && res.match?.id) {
        alert(`🎉 It's a match! Anda dan ${target.name} saling menyukai.`);
        setSelectedProfile(null);
        if (onOpenConversation) {
          onOpenConversation({
            ...target,
            id: res.match.id, // Match ID for chat
          });
        }
      } else {
        alert(`Anda telah menyukai balik ${target.name}!`);
        setSelectedProfile(null);
      }
      // Remove from received and add to sent
      setReceivedLikes((prev) => prev.filter((p) => p.id !== target.id));
      setSentLikes((prev) => (prev.some((p) => p.id === target.id) ? prev : [...prev, target]));
    } catch {
      alert('Gagal mengirim like balik. Coba lagi nanti.');
    }
  };

  return (
    <section className="app-page likes-page">
      <AppHeader
        className="likes-header"
        left={
          <button type="button" className="app-circle-button" onClick={onMenu} aria-label="Menu">
            <Icon icon="solar:widget-4-bold" />
          </button>
        }
        center={
          <div className="header-segmented-pill">
            <button
              type="button"
              onClick={() => setTab('received')}
              className={tab === 'received' ? 'active' : ''}
            >
              Menyukai ({receivedLikes.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('sent')}
              className={tab === 'sent' ? 'active' : ''}
            >
              Disukai ({sentLikes.length})
            </button>
          </div>
        }
        right={
          <button
            type="button"
            className="app-circle-button"
            onClick={onDateNight}
            aria-label="Date Night"
          >
            <Icon icon="solar:heart-bold" />
          </button>
        }
      />

      {loading && currentList.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-neutral-400">
          <Icon icon="svg-spinners:ring-resize" className="w-8 h-8 text-pink-500 animate-spin" />
        </div>
      ) : currentList.length > 0 ? (
        <div className="liked-grid">
          {currentList.map((profile) => (
            <motion.article
              key={`${tab}-${profile.id}`}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedProfile(profile)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  setSelectedProfile(profile);
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
                {tab === 'received' && (
                  <span className="text-[11px] text-pink-400 font-bold mt-0.5">
                    ✨ Menyukai profil Anda
                  </span>
                )}
              </div>
            </motion.article>
          ))}
        </div>
      ) : (
        <LoveReactionSurface>
          <div className="flex flex-col items-center justify-center flex-1 text-center p-6 text-neutral-300 gap-4 my-auto">
            <div className="w-20 h-20 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center text-3xl text-pink-500 shadow-xl">
              <Icon icon="solar:heart-bold" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">
                {tab === 'received'
                  ? 'Belum Ada yang Menyukai'
                  : 'Belum Ada Profil yang Disukai'}
              </h3>
              <p className="text-xs text-neutral-400 max-w-[260px] mx-auto mt-1">
                {tab === 'received'
                  ? 'Profil pengguna yang menyukai Anda saat swipe akan muncul di sini.'
                  : 'Profil pengguna yang telah Anda beri Like saat swipe akan tersimpan di sini.'}
              </p>
            </div>
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
              <p>{selectedProfile.bio || 'Katakan halo dan saling mengenal lebih dekat.'}</p>
            </div>
            <div className="liked-profile-actions">
              {tab === 'received' ? (
                <button
                  type="button"
                  className="w-full py-3 rounded-full bg-gradient-to-r from-pink-600 to-rose-600 text-white font-extrabold text-sm shadow-lg shadow-pink-600/30 flex items-center justify-center gap-2"
                  onClick={() => handleLikeBack(selectedProfile)}
                >
                  <Icon icon="solar:heart-bold" className="text-lg" /> Suka Balik & Cocokkan
                </button>
              ) : (
                <div className="w-full py-2.5 rounded-full bg-neutral-800 text-neutral-400 font-bold text-xs text-center border border-white/5">
                  ⏳ Menunggu Respon dari {selectedProfile.name}
                </div>
              )}
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
