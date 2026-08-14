import { useState } from 'react';
import { Icon } from '@iconify/react';
import { IconButton } from './IconButton';
import { useCurrentProfile } from '@/modules/app-shell/hooks/useCurrentProfile';
import { AppHeader } from '@/modules/app-shell/components/AppHeader';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { FEED_OPTIONS, type FeedMode } from '../hooks/useDiscoverDeck';

interface Props {
  onProfile?: () => void;
  feedMode?: FeedMode;
  onFeedModeChange?: (mode: FeedMode) => void;
  onFilterClick?: () => void;
}

export function DiscoverHeader({
  onProfile,
  feedMode = 'for_you',
  onFeedModeChange,
  onFilterClick,
}: Props) {
  const profile = useCurrentProfile();
  const [sheetOpen, setSheetOpen] = useState(false);

  const currentOption = FEED_OPTIONS.find((opt) => opt.id === feedMode) || FEED_OPTIONS[0];

  return (
    <>
      <AppHeader
        left={<IconButton icon="solar:tuning-2-bold" label="Filters" onClick={onFilterClick} />}
        center={
          <button
            className="feed-selector flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-900/90 border border-white/10 text-xs font-black text-white hover:bg-neutral-800 transition shadow-sm"
            type="button"
            onClick={() => setSheetOpen(true)}
          >
            <Icon icon={currentOption.icon} className="text-pink-500 text-sm" />
            <span>{currentOption.label}</span>
            <Icon icon="solar:alt-arrow-down-linear" className="text-neutral-400 text-xs" />
          </button>
        }
        right={
          <button
            className="profile-monogram"
            type="button"
            aria-label="My profile"
            onClick={onProfile}
          >
            {profile.mainPhoto ? <img src={profile.mainPhoto} alt={profile.name} /> : profile.initials}
          </button>
        }
      />

      <BottomSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title="Pilih Mode Feed"
        description="Sesuaikan tipe rekomendasi pasangan yang ingin Anda temukan"
      >
        <div className="flex flex-col gap-2 p-1">
          {FEED_OPTIONS.map((opt) => {
            const isSelected = opt.id === feedMode;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onFeedModeChange?.(opt.id);
                  setSheetOpen(false);
                }}
                className={`flex items-center gap-3 p-3 rounded-2xl text-left transition border ${
                  isSelected
                    ? 'bg-pink-600/15 border-pink-500/50 text-white'
                    : 'bg-neutral-900/60 border-white/5 text-neutral-300 hover:bg-neutral-800/80 hover:text-white'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                    isSelected ? 'bg-pink-600 text-white shadow-md' : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  <Icon icon={opt.icon} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <strong className="text-sm font-bold text-white">{opt.label}</strong>
                    {isSelected && (
                      <span className="text-[10px] bg-pink-500/20 text-pink-400 font-extrabold px-2 py-0.5 rounded-full border border-pink-500/30">
                        Aktif
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 truncate mt-0.5">{opt.desc}</p>
                </div>
                {isSelected && <Icon icon="solar:check-circle-bold" className="text-pink-500 text-xl" />}
              </button>
            );
          })}
        </div>
      </BottomSheet>
    </>
  );
}
