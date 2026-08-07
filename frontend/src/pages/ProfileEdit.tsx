import React, { useEffect, useState } from 'react';
import type { ProfileFormData, Gender } from '../types';
import { api } from '../services/api';
import { User, MapPin, Mic, Tag, Save, CheckCircle, Camera, Plus, X } from 'lucide-react';

export const ProfileEdit: React.FC = () => {
  const [photoInput, setPhotoInput] = useState('');
  const [interestInput, setInterestInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  const [formData, setFormData] = useState<ProfileFormData>({
    name: 'Alex',
    age: 24,
    gender: 'male',
    target_gender: 'female',
    bio: 'Menyukai hal-hal baru, musik, dan menjelajahi tempat seru! ✨',
    voice_bio_url: '',
    country: 'Indonesia',
    city: 'Jakarta',
    target_location_mode: 'same_city',
    min_age_pref: 18,
    max_age_pref: 35,
    photos: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80'],
    interests: ['Kopi', 'Musik', 'Travel', 'Coding'],
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await api.getMyProfile();
        if (data.profile) {
          const p = data.profile;
          let parsedPhotos: string[] = [];
          let parsedInterests: string[] = [];
          try {
            parsedPhotos = typeof p.photos === 'string' ? JSON.parse(p.photos) : p.photos || [];
            parsedInterests = typeof p.interests === 'string' ? JSON.parse(p.interests) : p.interests || [];
          } catch {}

          setFormData({
            name: p.name || 'Alex',
            age: p.age || 24,
            gender: p.gender || 'male',
            target_gender: p.target_gender || 'female',
            bio: p.bio || '',
            voice_bio_url: p.voice_bio_url || '',
            country: p.country || 'Indonesia',
            city: p.city || 'Jakarta',
            target_location_mode: p.target_location_mode || 'same_city',
            min_age_pref: p.min_age_pref || 18,
            max_age_pref: p.max_age_pref || 35,
            photos: parsedPhotos.length > 0 ? parsedPhotos : ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80'],
            interests: parsedInterests.length > 0 ? parsedInterests : ['Kopi', 'Musik', 'Travel'],
          });
        }
      } catch (err) {
        console.error('Failed to load my profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.photos.length === 0) {
      alert('Wajib memasukkan minimal 1 foto atau video!');
      return;
    }
    setSaving(true);
    setSavedMsg(false);
    try {
      await api.saveProfile(formData);
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 3000);
    } catch (err) {
      alert('Gagal menyimpan profil');
    } finally {
      setSaving(false);
    }
  };

  const addPhotoUrl = () => {
    if (!photoInput.trim()) return;
    if (formData.photos.length >= 3) {
      alert('Maksimal 3 foto atau video!');
      return;
    }
    setFormData({ ...formData, photos: [...formData.photos, photoInput.trim()] });
    setPhotoInput('');
  };

  const removePhoto = (idx: number) => {
    setFormData({ ...formData, photos: formData.photos.filter((_, i) => i !== idx) });
  };

  const addInterest = () => {
    if (!interestInput.trim()) return;
    if (!formData.interests.includes(interestInput.trim())) {
      setFormData({ ...formData, interests: [...formData.interests, interestInput.trim()] });
    }
    setInterestInput('');
  };

  const removeInterest = (item: string) => {
    setFormData({ ...formData, interests: formData.interests.filter((i) => i !== item) });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-8 h-8 rounded-full border-2 border-pink-500/20 border-t-pink-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 max-w-md mx-auto w-full pb-24 animate-fade-in">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-pink-400" />
            <span>Pengaturan Profil</span>
          </h2>

          {savedMsg && (
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Tersimpan!
            </span>
          )}
        </div>

        {/* Photo/Video Gallery Manager */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-pink-400" />
              <span>Foto & Video Profil (Wajib 1-3)</span>
            </span>
            <span className="text-[11px] text-pink-400 font-bold">{formData.photos.length}/3</span>
          </label>

          <div className="flex gap-2">
            <input
              type="url"
              value={photoInput}
              onChange={(e) => setPhotoInput(e.target.value)}
              placeholder="URL Foto / Video (https://...)"
              className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-pink-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={addPhotoUrl}
              disabled={formData.photos.length >= 3}
              className="px-3 py-2 rounded-xl bg-pink-500 text-white font-bold text-xs hover:bg-pink-600 disabled:opacity-50 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            {formData.photos.map((item, idx) => (
              <div key={idx} className="relative w-full h-20 rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
                {item.endsWith('.mp4') || item.endsWith('.webm') ? (
                  <video src={item} className="w-full h-full object-cover" muted loop />
                ) : (
                  <img src={item} alt={`Photo ${idx}`} className="w-full h-full object-cover" />
                )}
                <button
                  type="button"
                  onClick={() => removePhoto(idx)}
                  className="absolute top-1 right-1 p-1 rounded-full bg-slate-950/80 text-rose-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Name & Age */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2 space-y-1">
            <label className="text-xs font-semibold text-slate-400">Nama Lengkap</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:border-pink-500 focus:outline-none"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Usia</label>
            <input
              type="number"
              min={18}
              max={100}
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 18 })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:border-pink-500 focus:outline-none text-center font-bold"
              required
            />
          </div>
        </div>

        {/* Gender & Target Gender */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Jenis Kelamin Saya</label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:border-pink-500 focus:outline-none"
            >
              <option value="male">👨 Pria</option>
              <option value="female">👩 Wanita</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Mencari Pasangan</label>
            <select
              value={formData.target_gender}
              onChange={(e) => setFormData({ ...formData, target_gender: e.target.value as Gender })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:border-pink-500 focus:outline-none"
            >
              <option value="female">👩 Wanita</option>
              <option value="male">👨 Pria</option>
              <option value="all">✨ Semua</option>
            </select>
          </div>
        </div>

        {/* Country & City Location */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              <span>Negara</span>
            </label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:border-pink-500 focus:outline-none"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-pink-400" />
              <span>Kota (Asal)</span>
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:border-pink-500 focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400">Deskripsi Singkat (Bio)</label>
          <textarea
            rows={3}
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:border-pink-500 focus:outline-none"
            placeholder="Ceritakan sedikit tentang dirimu..."
          />
        </div>

        {/* Voice Bio URL */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 flex items-center gap-1">
            <Mic className="w-3.5 h-3.5 text-purple-400" />
            <span>Voice Bio Audio URL (Opsional)</span>
          </label>
          <input
            type="url"
            value={formData.voice_bio_url}
            onChange={(e) => setFormData({ ...formData, voice_bio_url: e.target.value })}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:border-pink-500 focus:outline-none"
            placeholder="https://... URL audio .mp3 / .ogg"
          />
        </div>

        {/* Interests */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-400 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-amber-400" />
            <span>Minat / Hobi</span>
          </label>

          <div className="flex gap-2">
            <input
              type="text"
              value={interestInput}
              onChange={(e) => setInterestInput(e.target.value)}
              placeholder="Tambah hobi (misal: Kopi, Gaming)"
              className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:border-pink-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={addInterest}
              className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-700"
            >
              +
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {formData.interests.map((item) => (
              <span
                key={item}
                onClick={() => removeInterest(item)}
                className="px-2.5 py-1 rounded-lg bg-pink-500/20 border border-pink-500/30 text-pink-300 text-xs font-medium cursor-pointer hover:bg-pink-500/30"
              >
                #{item} &times;
              </span>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20 hover:opacity-95 active:scale-98 transition disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan Profil'}</span>
        </button>
      </form>
    </div>
  );
};
