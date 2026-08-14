import { useState, useEffect, type ReactNode } from 'react';
import { Icon } from '@iconify/react';
import { AppPageHeader } from '@/modules/app-shell/components/AppPageHeader';
import { MenuCard } from '@/modules/app-shell/components/MenuCard';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import {
  BrandedRangeSlider,
  BrandedSlider,
} from '@/modules/onboarding/components/BrandedSlider';
import { api } from '@/utils/api';
import type { Profile, Gender, LocationFilterMode } from '@/@types';

function PreferenceHeading({
  icon,
  label,
  children,
}: {
  icon: string;
  label: string;
  children?: ReactNode;
}) {
  return (
    <div className="preferences-slider-heading">
      <div className="preferences-section-heading">
        <Icon icon={icon} />
        <span>{label}</span>
      </div>
      {children}
    </div>
  );
}

function PreferenceOptions<T extends string>({
  icon,
  label,
  value,
  options,
  onChange,
}: {
  icon: string;
  label: string;
  value: T;
  options: ReadonlyArray<readonly [T, string, string]>;
  onChange: (value: T) => void;
}) {
  return (
    <section className="preferences-sheet-section">
      <PreferenceHeading icon={icon} label={label} />
      <div className="preferences-options">
        {options.map(([optionValue, optionIcon, optionLabel]) => (
          <button
            key={optionValue}
            type="button"
            className={value === optionValue ? 'selected' : ''}
            onClick={() => onChange(optionValue)}
          >
            <Icon icon={optionIcon} />
            <span>{optionLabel}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export function SettingsPage({ onBack }: { onBack: () => void }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showPreferencesSheet, setShowPreferencesSheet] = useState(false);

  // Discovery Preferences state
  const [targetGender, setTargetGender] = useState<Gender>('all');
  const [locationMode, setLocationMode] = useState<LocationFilterMode>('same_city');
  const [minAge, setMinAge] = useState(18);
  const [maxAge, setMaxAge] = useState(35);
  const [maxDistance, setMaxDistance] = useState(50);
  const [relationshipGoal, setRelationshipGoal] = useState('long_term');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.getMyProfile();
        if (res.profile) {
          setProfile(res.profile);
          setTargetGender(res.profile.target_gender || 'all');
          setLocationMode(res.profile.target_location_mode || 'same_city');
          setMinAge(res.profile.min_age_pref || 18);
          setMaxAge(res.profile.max_age_pref || 35);
          setMaxDistance(res.profile.max_distance_km || 50);
          setRelationshipGoal(res.profile.relationship_goal || 'long_term');
        }
      } catch (err) {
        console.error('Failed to load profile in settings', err);
      }
    };
    fetchProfile();
  }, []);

  const handleSavePreferences = async () => {
    if (!profile) return;
    setSaving(true);
    let existingPhotos: string[] = [];
    try {
      existingPhotos = typeof profile.photos === 'string' ? JSON.parse(profile.photos) : profile.photos || [];
    } catch {
      existingPhotos = [];
    }

    let existingInterests: string[] = [];
    try {
      existingInterests = typeof profile.interests === 'string' ? JSON.parse(profile.interests) : profile.interests || [];
    } catch {
      existingInterests = [];
    }

    try {
      const updated = await api.saveProfile({
        name: profile.name,
        age: profile.age,
        gender: profile.gender,
        target_gender: targetGender,
        bio: profile.bio || '',
        voice_bio_url: profile.voice_bio_url || '',
        country: profile.country || 'Indonesia',
        city: profile.city || 'Jakarta',
        target_location_mode: locationMode,
        min_age_pref: minAge,
        max_age_pref: maxAge,
        max_distance_km: maxDistance,
        relationship_goal: relationshipGoal as any,
        photos: existingPhotos,
        interests: existingInterests,
      });

      setProfile(updated.profile);
      setShowPreferencesSheet(false);
    } catch (err) {
      alert('Gagal menyimpan pengaturan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="app-page settings-page">
      <AppPageHeader title="Settings" onBack={onBack} />

      <h2>Discovery Preferences</h2>
      <MenuCard
        items={[
          {
            icon: 'solar:tuning-2-bold',
            label: 'Discovery Preferences',
            onClick: () => setShowPreferencesSheet(true),
          },
        ]}
      />

      <h2>About</h2>
      <MenuCard
        items={[
          { icon: 'solar:heart-bold', label: 'match.in v2.0' },
          { icon: 'mdi:instagram', label: 'Instagram @matchin.app', onClick: () => window.open('https://instagram.com/matchin.app', '_blank') },
          { icon: 'solar:share-bold', label: 'Share match.in', onClick: () => navigator.share?.({ title: 'match.in', text: 'Find your match!', url: 'https://matchin.app' }).catch(() => {}) },
          { icon: 'solar:star-bold', label: 'Rate match.in', onClick: () => window.open('https://t.me/matchin_app', '_blank') },
          { icon: 'solar:document-text-bold', label: 'Terms of Service', onClick: () => window.open('https://matchin.app/terms', '_blank') },
          { icon: 'solar:lock-keyhole-bold', label: 'Privacy Policy', onClick: () => window.open('https://matchin.app/privacy', '_blank') },
        ]}
      />

      <h2>Danger Zone</h2>
      <MenuCard
        items={[
          {
            icon: 'solar:trash-bin-trash-bold',
            label: 'Delete account',
            tone: 'danger',
            onClick: async () => {
              if (confirm('Apakah Anda yakin ingin menghapus akun? Semua data match & chat akan dihapus permanen.')) {
                try {
                  await api.deleteAccount();
                } catch (e) {
                  console.error('Failed to delete account on server', e);
                }
                window.localStorage.clear();
                window.location.reload();
              }
            },
          },
        ]}
      />

      {/* ── Discovery Preferences BottomSheet Modal ── */}
      <BottomSheet
        open={showPreferencesSheet}
        onOpenChange={setShowPreferencesSheet}
        title="Discovery Preferences"
        description="Atur siapa dan seberapa jauh profil yang ingin kamu temukan."
        className="discovery-preferences-sheet"
      >
        <div className="preferences-sheet-form">
          <PreferenceOptions<Gender>
            icon="solar:users-group-rounded-bold"
            label="Mencari target"
            value={targetGender}
            onChange={setTargetGender}
            options={[
              ['male', 'solar:men-bold', 'Pria'],
              ['female', 'solar:women-bold', 'Wanita'],
              ['all', 'solar:users-group-rounded-bold', 'Semua'],
            ]}
          />
          <PreferenceOptions<LocationFilterMode>
            icon="solar:map-point-bold"
            label="Jangkauan lokasi"
            value={locationMode}
            onChange={setLocationMode}
            options={[
              ['same_city', 'solar:city-bold', 'Kota sama'],
              ['same_country', 'solar:map-bold', 'Indonesia'],
              ['global', 'solar:global-bold', 'Global'],
            ]}
          />
          <section className="preferences-sheet-section slider-section">
            <PreferenceHeading icon="solar:calendar-date-bold" label="Rentang usia">
              <strong>{minAge}–{maxAge} tahun</strong>
            </PreferenceHeading>
            <BrandedRangeSlider
              min={18}
              max={70}
              value={[minAge, maxAge]}
              onChange={([minimum, maximum]) => {
                setMinAge(minimum);
                setMaxAge(maximum);
              }}
              ariaLabel="Rentang usia"
            />
            <div className="preferences-scale"><span>18</span><span>70+</span></div>
          </section>
          <section className="preferences-sheet-section slider-section">
            <PreferenceHeading icon="solar:routing-2-bold" label="Jarak maksimum">
              <strong>{maxDistance} km</strong>
            </PreferenceHeading>
            <BrandedSlider min={1} max={100} value={maxDistance} onChange={setMaxDistance} ariaLabel="Jarak maksimum" />
            <div className="preferences-scale"><span>1 km</span><span>100 km</span></div>
          </section>
          <button type="button" className="pink-cta preferences-save" onClick={handleSavePreferences} disabled={saving || !profile}>
            {saving ? <Icon icon="svg-spinners:ring-resize" /> : 'Simpan pengaturan'}
          </button>
        </div>
      </BottomSheet>
    </section>
  );
}
