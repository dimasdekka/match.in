import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { AppPageHeader } from '@/modules/app-shell/components/AppPageHeader';
import { MenuCard } from '@/modules/app-shell/components/MenuCard';
import { api } from '@/utils/api';
import type { Profile, Gender, LocationFilterMode } from '@/@types';

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
      {showPreferencesSheet && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] p-6 max-h-[85vh] overflow-y-auto space-y-5 animate-slide-up shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900">Discovery Preferences</h3>
              <button
                type="button"
                onClick={() => setShowPreferencesSheet(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition"
              >
                <Icon icon="mingcute:close-line" className="w-5 h-5" />
              </button>
            </div>

            {/* Target Gender */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Mencari Target</label>
              <div className="grid grid-cols-3 gap-2">
                {(['male', 'female', 'all'] as Gender[]).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setTargetGender(g)}
                    className={`py-3 rounded-2xl text-xs font-bold transition border ${
                      targetGender === g
                        ? 'match-gradient text-white border-transparent match-shadow-btn'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {g === 'male' ? '👨 Pria' : g === 'female' ? '👩 Wanita' : '👫 Semua'}
                  </button>
                ))}
              </div>
            </div>

            {/* Location Mode */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Jangkauan Lokasi</label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ['same_city', '🏙️ Kota Sama'],
                    ['same_country', '🇮🇩 Se-Indonesia'],
                    ['global', '🌍 Global'],
                  ] as const
                ).map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setLocationMode(mode as LocationFilterMode)}
                    className={`py-2.5 px-2 rounded-2xl text-xs font-bold transition border ${
                      locationMode === mode
                        ? 'bg-pink-50 border-[#FF3366] text-[#FF3366]'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Age Range Slider */}
            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Rentang Usia</label>
                <span className="text-xs font-bold text-[#FF3366]">
                  {minAge} - {maxAge} tahun
                </span>
              </div>
              <div className="flex gap-3 items-center">
                <input
                  type="range"
                  min={18}
                  max={60}
                  value={minAge}
                  onChange={(e) => setMinAge(Math.min(Number(e.target.value), maxAge - 1))}
                  className="w-full accent-[#FF3366]"
                />
                <input
                  type="range"
                  min={19}
                  max={99}
                  value={maxAge}
                  onChange={(e) => setMaxAge(Math.max(Number(e.target.value), minAge + 1))}
                  className="w-full accent-[#FF3366]"
                />
              </div>
            </div>

            {/* Max Distance Slider */}
            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Jarak Maksimum</label>
                <span className="text-xs font-bold text-[#FF3366]">{maxDistance} km</span>
              </div>
              <input
                type="range"
                min={5}
                max={100}
                value={maxDistance}
                onChange={(e) => setMaxDistance(Number(e.target.value))}
                className="w-full accent-[#FF3366]"
              />
            </div>

            {/* Save Button */}
            <div className="pt-3">
              <button
                type="button"
                onClick={handleSavePreferences}
                disabled={saving}
                className="w-full py-4 rounded-full match-gradient text-white font-bold text-sm match-shadow-btn active:scale-98 disabled:opacity-50 transition cursor-pointer"
              >
                {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
