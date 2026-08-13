import { AppPageHeader } from '@/modules/app-shell/components/AppPageHeader';
import { MenuCard } from '@/modules/app-shell/components/MenuCard';

export function SettingsPage({ onBack }: { onBack: () => void }) {
  return (
    <section className="app-page settings-page">
      <AppPageHeader title="Settings" onBack={onBack} />
      <MenuCard items={[{ icon: 'solar:tuning-2-bold', label: 'Discovery Preferences' }]} />
      <h2>About</h2>
      <MenuCard
        items={[
          { icon: 'solar:heart-bold', label: 'match.in' },
          { icon: 'mdi:instagram', label: 'Instagram' },
          { icon: 'solar:share-bold', label: 'Share match.in' },
          { icon: 'solar:star-bold', label: 'Rate match.in' },
          { icon: 'solar:document-text-bold', label: 'Terms of Service' },
          { icon: 'solar:lock-keyhole-bold', label: 'Privacy Policy' },
        ]}
      />
      <h2>Danger Zone</h2>
      <MenuCard
        items={[
          { icon: 'solar:trash-bin-trash-bold', label: 'Delete account', tone: 'danger' },
          { icon: 'solar:logout-2-bold', label: 'Sign out' },
        ]}
      />
      <p className="health-note">Safety data provided by Apple Health</p>
    </section>
  );
}
