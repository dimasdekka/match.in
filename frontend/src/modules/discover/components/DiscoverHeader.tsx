import { Icon } from '@iconify/react';
import { IconButton } from './IconButton';
import { useCurrentProfile } from '@/modules/app-shell/hooks/useCurrentProfile';
import { AppHeader } from '@/modules/app-shell/components/AppHeader';

export function DiscoverHeader({ onProfile }: { onProfile?: () => void }) {
  const profile = useCurrentProfile();

  return (
    <AppHeader
      left={<IconButton icon="solar:tuning-2-bold" label="Filters" />}
      center={
        <button className="feed-selector" type="button">
          For You
          <Icon icon="solar:alt-arrow-down-linear" />
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
  );
}
