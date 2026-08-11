import React, { useState, useEffect } from 'react';
import { Settings, Camera, CheckCircle2, ChevronRight, RefreshCw, X, Edit3 } from 'lucide-react';
import { api } from '../services/api';
import type { Profile, Gender } from '../types';
import { compressImageFile } from '../utils/imageCompressor';

interface ProfilePageProps {
  onProfileUpdated?: (profile: Profile) => void;
}

const INTEREST_OPTIONS = [
  'Kopi', 'Musik', 'Travel', 'Design', 'Coding',
  'Kuliner', 'Fotografi', 'Olahraga', 'Film', 'Gaming',
  'Art', 'Buku', 'Fitness', 'Anime', 'Fashion'
];

const LOOKING_FOR_OPTIONS = [
  '💕 Hubungan Serius',
  '☕ Kencan Santai & Ngobrol',
  '🤝 Teman Baru',
  '✨ Masih Bingung / Santai'
];

export const ProfilePage: React.FC<ProfilePageProps> = ({ onProfileUpdated }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnMatchin, setShowOnMatchin] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  // Edit form states
  const [editName, setEditName] = useState('');
  const [editAge, setEditAge] = useState(18);
  const [editCity, setEditCity] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editTargetGender, setEditTargetGender] = useState<Gender>('all');
  const [editLookingFor, setEditLookingFor] = useState(LOOKING_FOR_OPTIONS[0]);
  const [editInterests, setEditInterests] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await api.getMyProfile();
        if (res.profile) {
          setProfile(res.profile);
          populateForm(res.profile);
        }
      } catch (err) {
        console.error('Failed to load profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const populateForm = (p: Profile) => {
    setEditName(p.name || '');
    setEditAge(p.age || 20);
    setEditCity(p.city || 'Jakarta');
    setEditBio(p.bio || '');
    setEditTargetGender(p.target_gender || 'all');

    let ints: string[] = [];
    if (p.interests) {
      try {
        ints = typeof p.interests === 'string' ? JSON.parse(p.interests) : p.interests;
      } catch {
        ints = [];
      }
    }
    setEditInterests(ints);
  };

  const handleSaveEdit = async () => {
    if (!profile) return;
    setSaving(true);

    let existingPhotos: string[] = [];
    try {
      existingPhotos = typeof profile.photos === 'string' ? JSON.parse(profile.photos) : profile.photos || [];
    } catch {
      existingPhotos = [];
    }

    try {
      const res = await api.saveProfile({
        name: editName.trim() || profile.name,
        age: editAge,
        gender: profile.gender,
        target_gender: editTargetGender,
        bio: editBio.trim(),
        voice_bio_url: profile.voice_bio_url || '',
        country: profile.country || 'Indonesia',
        city: editCity.trim() || 'Jakarta',
        target_location_mode: profile.target_location_mode || 'same_city',
        min_age_pref: profile.min_age_pref || 18,
        max_age_pref: profile.max_age_pref || 99,
        photos: existingPhotos,
        interests: editInterests,
      });

      setProfile(res.profile);
      setShowEditModal(false);
      if (onProfileUpdated) onProfileUpdated(res.profile);
    } catch (err) {
      alert('Gagal memperbarui profil. Periksa koneksi atau input data.');
    } finally {
      setSaving(false);
    }
  };

  const toggleInterest = (tag: string) => {
    if (editInterests.includes(tag)) {
      setEditInterests((prev) => prev.filter((t) => t !== tag));
    } else if (editInterests.length < 5) {
      setEditInterests((prev) => [...prev, tag]);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-slate-400">
        <RefreshCw className="w-7 h-7 animate-spin text-[#FF3366]" />
        <p className="text-xs font-semibold">Memuat Profil...</p>
      </div>
    );
  }

  // Parse photos
  let photos: string[] = [];
  if (profile?.photos) {
    try {
      photos = typeof profile.photos === 'string' ? JSON.parse(profile.photos) : profile.photos;
    } catch {
      if (typeof profile.photos === 'string') photos = [profile.photos];
    }
  }
  const avatar = photos[0] || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80';

  // Parse interests
  let interests: string[] = [];
  if (profile?.interests) {
    try {
      interests = typeof profile.interests === 'string' ? JSON.parse(profile.interests) : profile.interests;
    } catch {
      interests = [];
    }
  }

  const targetGenderLabel =
    profile?.target_gender === 'male'
      ? '👨 Laki-laki'
      : profile?.target_gender === 'female'
      ? '👩 Perempuan'
      : '👫 Semua (Laki-laki & Perempuan)';

  return (
    <div className="w-full max-w-md mx-auto bg-white pb-24 relative">

      {/* ── Top Bar: Settings & Edit Icon ── */}
      <div className="flex items-center justify-between px-5 pt-4 pb-1">
        <h2 className="text-lg font-extrabold text-slate-900">Profil Saya</h2>
        <button
          onClick={() => {
            if (profile) populateForm(profile);
            setShowEditModal(true);
          }}
          className="px-3.5 py-2 rounded-full bg-pink-50 text-[#FF3366] font-bold text-xs flex items-center gap-1.5 hover:bg-pink-100 active:scale-95 transition"
        >
          <Settings className="w-4 h-4" />
          <span>Pengaturan & Edit</span>
        </button>
      </div>

      {/* ── Avatar + Camera Button ── */}
      <div className="flex flex-col items-center pt-2 pb-4">
        <div className="relative group">
          <img
            src={avatar}
            alt={profile?.name || 'You'}
            className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-xl"
          />
          {/* Camera Edit Button */}
          <label className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-md hover:bg-pink-50 active:scale-95 transition cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file && profile) {
                  try {
                    const newPhotoUrl = await compressImageFile(file);
                    let existingPhotos: string[] = [];
                    try {
                      existingPhotos = typeof profile.photos === 'string' ? JSON.parse(profile.photos) : profile.photos || [];
                    } catch {
                      existingPhotos = [];
                    }
                    const updatedPhotos = [newPhotoUrl, ...existingPhotos.slice(0, 2)];
                    const res = await api.saveProfile({
                      name: profile.name,
                      age: profile.age,
                      gender: profile.gender,
                      target_gender: profile.target_gender,
                      bio: profile.bio,
                      voice_bio_url: profile.voice_bio_url || '',
                      country: profile.country || 'Indonesia',
                      city: profile.city || 'Jakarta',
                      target_location_mode: profile.target_location_mode || 'same_city',
                      min_age_pref: profile.min_age_pref || 18,
                      max_age_pref: profile.max_age_pref || 99,
                      photos: updatedPhotos,
                      interests: typeof profile.interests === 'string' ? JSON.parse(profile.interests) : profile.interests || [],
                    });
                    setProfile(res.profile);
                  } catch (err) {
                    console.error('Failed to update photo', err);
                    alert('Gagal mengunggah foto. Coba gunakan foto lain.');
                  }
                }
              }}
            />
            <Camera className="w-4.5 h-4.5 text-[#FF3366]" />
          </label>
        </div>
        <p className="text-[11px] text-pink-500 font-semibold mt-2">Ketuk ikon kamera untuk ubah foto profil</p>
      </div>

      {/* ── Name + Verified ── */}
      <div className="text-center space-y-1">
        <div className="flex items-center justify-center gap-1.5">
          <h2 className="text-xl font-extrabold text-slate-900">
            {profile?.name || 'User'}
          </h2>
          {profile?.is_verified && (
            <CheckCircle2 className="w-5 h-5 text-sky-500 fill-sky-500" style={{ color: 'white' }} />
          )}
        </div>

        {/* Age • City, Country */}
        <p className="text-sm text-slate-400 font-medium">
          {profile?.age || 20} tahun • {profile?.city || 'Jakarta'}, {profile?.country || 'Indonesia'}
        </p>
      </div>

      {/* ── Bio ── */}
      <div className="px-8 pt-3 pb-4">
        <p className="text-center text-[13px] text-slate-600 leading-relaxed italic">
          "{profile?.bio || 'Belum ada bio. Klik tombol edit untuk menambahkan bio!'}"
        </p>
      </div>

      {/* ── Target Gender Preference Pill ── */}
      <div className="px-6 py-2">
        <button
          onClick={() => {
            if (profile) populateForm(profile);
            setShowEditModal(true);
          }}
          className="w-full p-3 rounded-2xl bg-pink-50/70 border border-pink-100 flex items-center justify-between hover:bg-pink-100/70 transition"
        >
          <div className="text-left">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Mencari Preferensi</p>
            <p className="text-xs font-bold text-[#FF3366] mt-0.5">{targetGenderLabel}</p>
          </div>
          <Edit3 className="w-4 h-4 text-[#FF3366]" />
        </button>
      </div>

      {/* ── Interest Pills ── */}
      <div className="px-6 py-3">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">Minat & Hobi</p>
        <div className="flex flex-wrap justify-center gap-2">
          {interests.length > 0 ? (
            interests.map((interest, idx) => (
              <span
                key={idx}
                className="px-4 py-1.5 rounded-full bg-pink-50 text-[#FF3366] border border-pink-200 text-xs font-bold"
              >
                {interest}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-400 italic">Belum ada minat yang dipilih</span>
          )}
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="mx-6 border-t border-slate-100 my-2" />

      {/* ── Looking For ── */}
      <div className="px-6 py-2">
        <button
          onClick={() => {
            if (profile) populateForm(profile);
            setShowEditModal(true);
          }}
          className="w-full flex items-center justify-between py-2 group text-left"
        >
          <div>
            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
              Tujuan Hubungan
            </p>
            <p className="text-[14px] font-bold text-slate-900 mt-0.5">
              {editLookingFor}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition" />
        </button>
      </div>

      {/* ── Divider ── */}
      <div className="mx-6 border-t border-slate-100 my-2" />

      {/* ── Show me on match.in Toggle ── */}
      <div className="px-6 py-3 flex items-center justify-between">
        <div>
          <span className="text-[14px] font-bold text-slate-900 block">
            Tampilkan profil di match.in
          </span>
          <span className="text-[11px] text-slate-400 block">
            Aktifkan agar profil kamu bisa dilihat pengguna lain
          </span>
        </div>

        <button
          onClick={() => setShowOnMatchin(!showOnMatchin)}
          className={`relative w-[52px] h-[30px] rounded-full p-1 transition-colors duration-300 ${
            showOnMatchin ? 'bg-[#FF3366]' : 'bg-slate-300'
          }`}
        >
          <div
            className={`w-[22px] h-[22px] rounded-full bg-white shadow-md transition-transform duration-300 ${
              showOnMatchin ? 'translate-x-[22px]' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* ── EDIT PROFILE MODAL ── */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] p-6 max-h-[90vh] overflow-y-auto space-y-5 animate-slide-up shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900">Edit Profil & Pengaturan</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nama */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Nama Lengkap</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-300"
              />
            </div>

            {/* Usia & Kota */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Usia</label>
                <input
                  type="number"
                  value={editAge}
                  onChange={(e) => setEditAge(Number(e.target.value))}
                  min={18}
                  max={99}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-300"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Kota</label>
                <input
                  type="text"
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-300"
                />
              </div>
            </div>

            {/* Preferensi Mencari (Target Gender) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Ingin Mencari</label>
              <div className="grid grid-cols-3 gap-2">
                {(['male', 'female', 'all'] as Gender[]).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setEditTargetGender(g)}
                    className={`py-3 rounded-2xl text-xs font-bold transition border ${
                      editTargetGender === g
                        ? 'match-gradient text-white border-transparent match-shadow-btn'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {g === 'male' ? '👨 Laki-laki' : g === 'female' ? '👩 Perempuan' : '👫 Semua'}
                  </button>
                ))}
              </div>
            </div>

            {/* Tujuan Hubungan (Looking For) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Tujuan Hubungan</label>
              <div className="space-y-2">
                {LOOKING_FOR_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setEditLookingFor(opt)}
                    className={`w-full p-3 rounded-2xl text-xs font-bold text-left transition border ${
                      editLookingFor === opt
                        ? 'bg-pink-50 border-[#FF3366] text-[#FF3366]'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Bio Singkat</label>
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                rows={3}
                maxLength={200}
                placeholder="Tuliskan cerita singkat tentang dirimu..."
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none leading-relaxed"
              />
            </div>

            {/* Minat & Hobi (Max 5) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Minat & Hobi</label>
                <span className="text-[10px] text-slate-400">{editInterests.length}/5 dipilih</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((tag) => {
                  const selected = editInterests.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleInterest(tag)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition border ${
                        selected
                          ? 'match-gradient text-white border-transparent'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {selected ? `✓ ${tag}` : tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-3">
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="w-full py-4 rounded-full match-gradient text-white font-bold text-sm match-shadow-btn active:scale-98 disabled:opacity-50 transition cursor-pointer"
              >
                {saving ? 'Memproses Simpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom spacing for navbar */}
      <div className="pb-24" />
    </div>
  );
};
