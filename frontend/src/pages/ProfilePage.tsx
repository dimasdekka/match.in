import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, MapPin, Mic, Save, CheckCircle, RefreshCw } from 'lucide-react';
import { profileFormSchema, type ProfileFormSchemaType } from '../schemas';
import { api } from '../services/api';
import type { Profile } from '../types';

interface ProfilePageProps {
  onProfileUpdated?: (profile: Profile) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onProfileUpdated }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormSchemaType>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: '',
      age: 22,
      gender: 'male',
      target_gender: 'female',
      bio: '',
      voice_bio_url: '',
      country: 'Indonesia',
      city: 'Jakarta',
      target_location_mode: 'same_city',
      min_age_pref: 18,
      max_age_pref: 35,
      photos: [],
      interests: [],
    },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setApiError(null);
      try {
        const res = await api.getMyProfile();
        if (res.profile) {
          const p = res.profile;

          // Parse photos
          let photosArray: string[] = [];
          if (Array.isArray(p.photos)) photosArray = p.photos;
          else if (typeof p.photos === 'string' && p.photos.trim()) {
            try {
              photosArray = JSON.parse(p.photos);
            } catch {
              photosArray = [p.photos];
            }
          }

          // Parse interests
          let interestsArray: string[] = [];
          if (Array.isArray(p.interests)) interestsArray = p.interests;
          else if (typeof p.interests === 'string' && p.interests.trim()) {
            try {
              interestsArray = JSON.parse(p.interests);
            } catch {
              interestsArray = p.interests.split(',').map((s) => s.trim()).filter(Boolean);
            }
          }

          reset({
            name: p.name || '',
            age: p.age || 22,
            gender: p.gender || 'male',
            target_gender: p.target_gender || 'female',
            bio: p.bio || '',
            voice_bio_url: p.voice_bio_url || '',
            country: p.country || 'Indonesia',
            city: p.city || 'Jakarta',
            target_location_mode: p.target_location_mode || 'same_city',
            min_age_pref: p.min_age_pref || 18,
            max_age_pref: p.max_age_pref || 35,
            photos: photosArray,
            interests: interestsArray,
          });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error loading profile';
        setApiError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [reset]);

  const onSubmit = async (data: ProfileFormSchemaType) => {
    setSaving(true);
    setSaveSuccess(false);
    setApiError(null);
    try {
      const res = await api.saveProfile(data as any);
      setSaveSuccess(true);
      if (onProfileUpdated) {
        onProfileUpdated(res.profile);
      }
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save profile';
      setApiError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-3 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-pink-500" />
        <p className="text-sm font-medium">Memuat profil kamu...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto px-4 py-4 pb-28 space-y-4">
      <div className="flex items-center gap-2">
        <User className="w-5 h-5 text-pink-500" />
        <h2 className="text-lg font-bold text-white">{t('profileSetup')}</h2>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>Profil berhasil disimpan!</span>
        </div>
      )}

      {apiError && (
        <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name & Age */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2 space-y-1">
            <label className="text-xs font-semibold text-slate-300">{t('fullName')}</label>
            <input
              type="text"
              {...register('name')}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-pink-500 transition"
              placeholder="Masukkan nama"
            />
            {errors.name && <p className="text-[11px] text-rose-400">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">{t('age')}</label>
            <input
              type="number"
              {...register('age', { valueAsNumber: true })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-pink-500 transition"
            />
            {errors.age && <p className="text-[11px] text-rose-400">{errors.age.message}</p>}
          </div>
        </div>

        {/* Gender & Target Gender */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">{t('gender')}</label>
            <select
              {...register('gender')}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-pink-500 transition"
            >
              <option value="male">{t('male')}</option>
              <option value="female">{t('female')}</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">{t('interestedIn')}</label>
            <select
              {...register('target_gender')}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-pink-500 transition"
            >
              <option value="all">{t('everyone')}</option>
              <option value="female">{t('female')}</option>
              <option value="male">{t('male')}</option>
            </select>
          </div>
        </div>

        {/* City & Country */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-rose-400" /> {t('city')}
            </label>
            <input
              type="text"
              {...register('city')}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-pink-500 transition"
              placeholder="Contoh: Jakarta"
            />
            {errors.city && <p className="text-[11px] text-rose-400">{errors.city.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-rose-400" /> {t('country')}
            </label>
            <input
              type="text"
              {...register('country')}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-pink-500 transition"
              placeholder="Contoh: Indonesia"
            />
            {errors.country && <p className="text-[11px] text-rose-400">{errors.country.message}</p>}
          </div>
        </div>

        {/* Location Filter Mode & Age Range Preference */}
        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Target Mode Lokasi</label>
            <select
              {...register('target_location_mode')}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
            >
              <option value="same_city">{t('filterSameCity')}</option>
              <option value="same_country">{t('filterSameCountry')}</option>
              <option value="global">{t('filterGlobal')}</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">Usia Min Preference</label>
              <input
                type="number"
                {...register('min_age_pref', { valueAsNumber: true })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
              />
              {errors.min_age_pref && <p className="text-[11px] text-rose-400">{errors.min_age_pref.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">Usia Max Preference</label>
              <input
                type="number"
                {...register('max_age_pref', { valueAsNumber: true })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
              />
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-300">{t('bio')}</label>
          <textarea
            rows={3}
            {...register('bio')}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-pink-500 transition leading-relaxed resize-none"
            placeholder="Ceritakan tentang dirimu dan pasangan impianmu..."
          />
          {errors.bio && <p className="text-[11px] text-rose-400">{errors.bio.message}</p>}
        </div>

        {/* Voice Bio URL */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
            <Mic className="w-3.5 h-3.5 text-purple-400" /> {t('voiceBio')}
          </label>
          <input
            type="text"
            {...register('voice_bio_url')}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-pink-500 transition"
            placeholder="https://... (URL file MP3/voice intro)"
          />
          {errors.voice_bio_url && <p className="text-[11px] text-rose-400">{errors.voice_bio_url.message}</p>}
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-pink-500/25 hover:opacity-95 transition active:scale-[0.98] disabled:opacity-50"
        >
          {saving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Menyimpan...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{t('saveProfile')}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
