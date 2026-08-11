import React, { useState, useEffect } from 'react';
import { Settings, Camera, CheckCircle2, ChevronRight, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import type { Profile } from '../types';

interface ProfilePageProps {
  onProfileUpdated?: (profile: Profile) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onProfileUpdated: _onProfileUpdated }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnMatchin, setShowOnMatchin] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await api.getMyProfile();
        if (res.profile) {
          setProfile(res.profile);
        }
      } catch (err) {
        console.error('Failed to load profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-slate-400">
        <RefreshCw className="w-7 h-7 animate-spin text-[#FF3366]" />
        <p className="text-xs font-semibold">Loading Profile...</p>
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
  if (interests.length === 0) interests = ['Design', 'Coffee', 'Travel', 'Music'];

  return (
    <div className="w-full max-w-md mx-auto bg-white min-h-screen">

      {/* ── Top Bar: Settings Icon ── */}
      <div className="flex items-center justify-end px-4 pt-4 pb-1">
        <button className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 active:scale-95 transition">
          <Settings className="w-5 h-5" />
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
                  const reader = new FileReader();
                  reader.onload = async (event) => {
                    if (event.target?.result) {
                      const newPhotoUrl = event.target.result as string;
                      let existingPhotos: string[] = [];
                      try {
                        existingPhotos = typeof profile.photos === 'string' ? JSON.parse(profile.photos) : profile.photos || [];
                      } catch {
                        existingPhotos = [];
                      }
                      const updatedPhotos = [newPhotoUrl, ...existingPhotos.slice(0, 2)];
                      try {
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
                      }
                    }
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
            <Camera className="w-4.5 h-4.5 text-[#FF3366]" />
          </label>
        </div>
        <p className="text-[11px] text-pink-500 font-semibold mt-2">Ketuk ikon kamera untuk ubah foto</p>
      </div>

      {/* ── Name + Verified ── */}
      <div className="text-center space-y-1">
        <div className="flex items-center justify-center gap-1.5">
          <h2 className="text-xl font-extrabold text-slate-900">
            {profile?.name || 'You'}
          </h2>
          <CheckCircle2 className="w-5 h-5 text-sky-500 fill-sky-500" style={{ color: 'white' }} />
        </div>

        {/* Age • City, Country */}
        <p className="text-sm text-slate-400 font-medium">
          {profile?.age || 28} • {profile?.city || 'Jakarta'}, {profile?.country || 'Indonesia'}
        </p>
      </div>

      {/* ── Bio ── */}
      <div className="px-8 pt-3 pb-4">
        <p className="text-center text-[13px] text-slate-500 leading-relaxed italic">
          {profile?.bio || 'Product Designer who loves good coffee and adventures.'}
        </p>
      </div>

      {/* ── Interest Pills ── */}
      <div className="flex flex-wrap justify-center gap-2 px-6 pb-6">
        {interests.map((interest, idx) => (
          <span
            key={idx}
            className="px-5 py-2 rounded-full bg-pink-50 text-[#FF3366] border border-pink-200 text-xs font-bold"
          >
            {interest}
          </span>
        ))}
      </div>

      {/* ── Divider ── */}
      <div className="mx-6 border-t border-slate-100" />

      {/* ── Looking For ── */}
      <div className="px-6 py-4">
        <button className="w-full flex items-center justify-between py-1 group">
          <div>
            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider text-left">
              Looking for
            </p>
            <p className="text-[15px] font-bold text-slate-900 mt-0.5 text-left">
              Long-term relationship
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition" />
        </button>
      </div>

      {/* ── Divider ── */}
      <div className="mx-6 border-t border-slate-100" />

      {/* ── Show me on match.in Toggle ── */}
      <div className="px-6 py-4 flex items-center justify-between">
        <span className="text-[15px] font-bold text-slate-900">
          Show me on match.in
        </span>

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

      {/* Bottom spacing for navbar */}
      <div className="pb-24" />
    </div>
  );
};
