import React, { useState, useEffect } from 'react';
import { Settings, Camera, CheckCircle2, ChevronRight, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import type { Profile } from '../types';

interface ProfilePageProps {
  onProfileUpdated?: (profile: Profile) => void; // eslint-disable-line @typescript-eslint/no-unused-vars
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
        <RefreshCw className="w-8 h-8 animate-spin text-[#FF3366]" />
        <p className="text-xs font-semibold">Loading Profile...</p>
      </div>
    );
  }

  // Parse photo
  let photos: string[] = [];
  if (profile?.photos) {
    try {
      photos = typeof profile.photos === 'string' ? JSON.parse(profile.photos) : profile.photos;
    } catch {
      photos = [profile.photos];
    }
  }
  const avatar = photos[0] || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80';

  // Parse interests
  let interests: string[] = [];
  if (profile?.interests) {
    try {
      interests = typeof profile.interests === 'string' ? JSON.parse(profile.interests) : profile.interests;
    } catch {
      interests = ['Design', 'Coffee', 'Travel', 'Music'];
    }
  }
  if (interests.length === 0) {
    interests = ['Design', 'Coffee', 'Travel', 'Music'];
  }

  return (
    <div className="w-full max-w-md mx-auto px-4 py-3 space-y-6 pb-28 animate-fade-in">
      {/* Top Header with Gear Icon */}
      <div className="flex items-center justify-end pt-1">
        <button className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-700 hover:bg-slate-100">
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Large Avatar & Edit Camera Button */}
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="relative">
          <img
            src={avatar}
            alt={profile?.name || 'You'}
            className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-xl shadow-pink-500/10"
          />
          <button className="absolute bottom-0 right-0 p-2.5 rounded-full bg-white text-slate-700 border border-slate-200 shadow-md hover:bg-slate-50 transition active:scale-95">
            <Camera className="w-4 h-4" />
          </button>
        </div>

        <div>
          <div className="flex items-center justify-center gap-1.5">
            <h2 className="text-xl font-extrabold text-slate-900">
              {profile?.name || 'You'}
            </h2>
            <CheckCircle2 className="w-5 h-5 text-sky-400 fill-sky-400 text-white" />
          </div>

          <p className="text-xs font-semibold text-slate-400 mt-0.5">
            {profile?.age || 28} • {profile?.city || 'Jakarta'}, {profile?.country || 'Indonesia'}
          </p>

          <p className="text-xs text-slate-600 font-normal max-w-xs mx-auto mt-2 leading-relaxed">
            {profile?.bio || 'Product Designer who loves good coffee and adventures.'}
          </p>
        </div>

        {/* Soft Translucent Pink Interest Pills */}
        <div className="flex flex-wrap justify-center gap-2 pt-1">
          {interests.map((interest, idx) => (
            <span
              key={idx}
              className="px-4 py-1.5 rounded-full bg-pink-50 text-[#FF3366] border border-pink-100 text-xs font-bold"
            >
              {interest}
            </span>
          ))}
        </div>
      </div>

      {/* Preferences List (Screen 6 format) */}
      <div className="space-y-3">
        {/* Looking For Card */}
        <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/60 flex items-center justify-between cursor-pointer hover:bg-slate-100/80 transition">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Looking for</span>
            <p className="text-sm font-bold text-slate-900 mt-0.5">Long-term relationship</p>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </div>

        {/* Show Me On match.in Toggle */}
        <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/60 flex items-center justify-between">
          <span className="text-sm font-bold text-slate-900">Show me on match.in</span>

          <button
            onClick={() => setShowOnMatchin(!showOnMatchin)}
            className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 flex items-center ${
              showOnMatchin ? 'bg-[#FF3366] justify-end' : 'bg-slate-300 justify-start'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-white shadow-md" />
          </button>
        </div>
      </div>
    </div>
  );
};
