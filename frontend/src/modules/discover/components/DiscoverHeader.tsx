import { Icon } from '@iconify/react';
import { IconButton } from './IconButton';
import { useCurrentProfile } from '@/modules/app-shell/hooks/useCurrentProfile';
export function DiscoverHeader({ onProfile }: { onProfile?: () => void }) {
  const profile = useCurrentProfile();
  return (
    <header className="discover-header">
      <IconButton icon="solar:tuning-2-bold" label="Filters" />
      <button className="feed-selector" type="button">
        For You
        <Icon icon="solar:alt-arrow-down-linear" />
      </button>
      <button
        className="profile-monogram"
        type="button"
        aria-label="My profile"
        onClick={onProfile}
      >
        {profile.mainPhoto ? <img src={profile.mainPhoto} alt={profile.name} /> : profile.initials}
      </button>
    </header>
  );
}
