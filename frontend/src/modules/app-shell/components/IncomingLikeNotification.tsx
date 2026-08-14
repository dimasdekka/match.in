import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import type { DiscoverProfile } from '@/modules/discover/@types';
import { api } from '@/utils/api';

interface Props {
  incomingLikes: DiscoverProfile[];
  onOpenConversation?: (profile: DiscoverProfile) => void;
  onDismissLike?: (userId: number) => void;
}

export function IncomingLikeNotification({
  incomingLikes,
  onOpenConversation,
  onDismissLike,
}: Props) {
  const [activeProfile, setActiveProfile] = useState<DiscoverProfile | null>(null);
  const [dismissedIds, setDismissedIds] = useState<number[]>([]);

  const unhandledLikes = incomingLikes.filter((p) => !dismissedIds.includes(p.id));
  const currentNotification = unhandledLikes[0] || null;

  const handleDismiss = (id: number) => {
    setDismissedIds((prev) => [...prev, id]);
    if (onDismissLike) onDismissLike(id);
  };

  const handleLikeBack = async (target: DiscoverProfile) => {
    try {
      const res = await api.swipe(target.id, 'like');
      handleDismiss(target.id);
      setActiveProfile(null);
      if (res.is_match && res.match?.id) {
        alert(`🎉 It's a match! Anda dan ${target.name} saling menyukai.`);
        if (onOpenConversation) {
          onOpenConversation({
            ...target,
            id: res.match.id,
          });
        }
      } else {
        alert(`Anda telah menyukai balik ${target.name}!`);
      }
    } catch {
      alert('Gagal menyukai balik. Silakan coba lagi.');
    }
  };

  const handleSkip = async (target: DiscoverProfile) => {
    try {
      await api.swipe(target.id, 'pass');
    } catch {}
    handleDismiss(target.id);
    setActiveProfile(null);
  };

  return (
    <>
      <AnimatePresence>
        {currentNotification && !activeProfile && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[min(calc(100%-32px),380px)] p-3 rounded-2xl bg-neutral-900/95 backdrop-blur-xl border border-pink-500/30 shadow-[0_8px_30px_rgba(244,63,94,0.35)] flex items-center justify-between gap-3 text-white"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative w-11 h-11 rounded-full overflow-hidden shrink-0 border-2 border-pink-500">
                <img
                  src={currentNotification.image}
                  alt={currentNotification.name}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-pink-500 rounded-full flex items-center justify-center text-[8px] text-white">
                  💖
                </span>
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-black truncate text-pink-300">
                  {currentNotification.name} menyukai profil Anda!
                </h4>
                <p className="text-[11px] text-neutral-400 truncate">
                  Ketuk untuk lihat & cocokkan
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                className="px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-600 to-rose-600 text-white font-black text-xs shadow-md shadow-pink-600/30 hover:scale-105 active:scale-95 transition"
                onClick={() => setActiveProfile(currentNotification)}
              >
                Lihat
              </button>
              <button
                type="button"
                className="w-7 h-7 rounded-full bg-neutral-800/80 text-neutral-400 hover:text-white flex items-center justify-center transition"
                onClick={() => handleDismiss(currentNotification.id)}
                aria-label="Tutup"
              >
                <Icon icon="solar:close-circle-bold" className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {activeProfile && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-sm rounded-3xl overflow-hidden bg-neutral-900 border border-white/10 shadow-2xl flex flex-col max-h-[85vh]"
          >
            <div className="relative aspect-[4/5] w-full bg-neutral-800">
              <img
                src={activeProfile.image}
                alt={activeProfile.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-black/40" />

              <button
                type="button"
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center border border-white/10"
                onClick={() => setActiveProfile(null)}
              >
                <Icon icon="solar:close-circle-bold" className="w-5 h-5" />
              </button>

              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-pink-500/80 backdrop-blur-md text-[11px] font-extrabold mb-2">
                  <Icon icon="solar:heart-bold" /> Menyukai profil Anda
                </span>
                <h2 className="text-2xl font-black flex items-center gap-2">
                  {activeProfile.name}, {activeProfile.age}
                </h2>
                <p className="text-xs text-neutral-300 flex items-center gap-1 mt-0.5">
                  <Icon icon="solar:map-point-bold" className="text-pink-400" /> {activeProfile.city}
                </p>
                {activeProfile.bio && (
                  <p className="text-xs text-neutral-200 mt-2 line-clamp-3 bg-black/40 backdrop-blur-sm p-2 rounded-xl border border-white/5">
                    "{activeProfile.bio}"
                  </p>
                )}
              </div>
            </div>

            <div className="p-4 bg-neutral-950 flex items-center justify-between gap-3">
              <button
                type="button"
                className="flex-1 py-3 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs flex items-center justify-center gap-1.5 transition border border-white/5"
                onClick={() => handleSkip(activeProfile)}
              >
                <Icon icon="solar:close-circle-linear" className="text-base" /> Lewati (Skip)
              </button>
              <button
                type="button"
                className="flex-1 py-3 rounded-full bg-gradient-to-r from-pink-600 to-rose-600 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-pink-600/40 hover:scale-[1.02] active:scale-95 transition"
                onClick={() => handleLikeBack(activeProfile)}
              >
                <Icon icon="solar:heart-bold" className="text-base" /> Suka Balik 💕
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
