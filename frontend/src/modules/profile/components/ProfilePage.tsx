import { Icon } from '@iconify/react';
import { MenuCard } from '@/modules/app-shell/components/MenuCard';
import { useCurrentProfile } from '@/modules/app-shell/hooks/useCurrentProfile';



export function ProfilePage({
  onBack,
  onSettings,
  onEdit,
}: {
  onBack: () => void;
  onSettings: () => void;
  onEdit: () => void;
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
        <button type="button" onClick={onEdit}>
          <span><Icon icon="solar:user-bold" /></span>
          <b>Edit Profile</b>
        </button>
        <button type="button" onClick={() => navigator.clipboard.writeText('https://matchin.app/' + (profile.username || 'user')).then(() => alert('Link berhasil disalin!'))}>
          <span><Icon icon="solar:link-circle-bold" /></span>
          <b>Copy Link</b>
        </button>
        <button type="button" onClick={() => navigator.share?.({ title: profile.name + ' on match.in', url: 'https://matchin.app/' + (profile.username || 'user') }).catch(() => {})}>
          <span><Icon icon="solar:upload-bold" /></span>
          <b>Share Profile</b>
        </button>
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
