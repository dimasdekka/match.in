import { Icon } from '@iconify/react';
import { MenuCard } from '@/modules/app-shell/components/MenuCard';
import { useCurrentProfile } from '@/modules/app-shell/hooks/useCurrentProfile';

const actions = [
  ['solar:user-bold', 'Edit Profile'],
  ['solar:link-circle-bold', 'Copy Link'],
  ['solar:upload-bold', 'Share Profile'],
] as const;

export function ProfilePage({
  onBack,
  onSettings,
}: {
  onBack: () => void;
  onSettings: () => void;
}) {
  const profile = useCurrentProfile();
  return (
    <section className="app-page profile-page">
      <button type="button" className="profile-back" onClick={onBack} aria-label="Close profile">
        <Icon icon="mingcute:close-line" />
      </button>
      <button type="button" className="profile-settings" onClick={onSettings} aria-label="Settings">
        <Icon icon="solar:settings-bold" />
      </button>
      <div className="profile-avatar">
        {profile.mainPhoto ? <img src={profile.mainPhoto} alt={profile.name} /> : profile.initials}
      </div>
      <h1>
        {profile.name}, {profile.age}
      </h1>
      <p className="profile-link">
        match.in/{profile.username} <Icon icon="solar:link-linear" />
      </p>
      <div className="profile-facts">
        {profile.location && (
          <span>
            <Icon icon="solar:map-point-bold" />
            {profile.location}
          </span>
        )}
        {profile.interests.slice(0, 3).map((interest) => (
          <span key={interest}>{interest}</span>
        ))}
      </div>
      {profile.bio && <p className="profile-bio">{profile.bio}</p>}
      <div className="profile-actions">
        {actions.map(([icon, label]) => (
          <button type="button" key={label}>
            <span>
              <Icon icon={icon} />
            </span>
            <b>{label}</b>
          </button>
        ))}
      </div>
      <button type="button" className="plus-card">
        <span>
          <Icon icon="solar:heart-bold" />
        </span>
        <div>
          <b>match.in Plus</b>
          <small>Unlock premium features</small>
        </div>
        <Icon icon="solar:alt-arrow-right-linear" />
      </button>
      <div className="profile-section-title">
        <h2>My Tools</h2>
        <span>
          New <Icon icon="solar:add-square-bold" />
        </span>
      </div>
      <div className="profile-tools">
        <button type="button" className="create-tool">
          <span>
            <Icon icon="solar:heart-bold" />
          </span>
          <div>
            <b>Create</b>
            <small>Build your perfect date</small>
          </div>
          <Icon icon="solar:alt-arrow-right-linear" className="tool-arrow" />
        </button>
      </div>
      <h2 className="profile-section-title">Account</h2>
      <MenuCard
        items={[
          { icon: 'solar:palette-bold', label: 'Change app icon' },
          { icon: 'solar:smartphone-bold', label: 'App theme' },
        ]}
      />
    </section>
  );
}
