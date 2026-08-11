import React, { useState } from 'react';
import { Heart, ChevronRight, Camera, CheckCircle } from 'lucide-react';
import type { ProfileFormData, Gender } from '../types';
import { compressImageFile } from '../utils/imageCompressor';

interface OnboardingWizardProps {
  initialName?: string;
  onComplete: (formData: ProfileFormData) => void;
}

const POPULAR_CITIES = [
  'Jakarta', 'Bandung', 'Surabaya', 'Yogyakarta', 'Semarang',
  'Medan', 'Makassar', 'Palembang', 'Denpasar', 'Malang',
  'Bogor', 'Tangerang', 'Bekasi', 'Depok', 'Solo',
];

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ initialName = '', onComplete }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState(initialName);
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [targetGender, setTargetGender] = useState<Gender>('female');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [photoInput, setPhotoInput] = useState('');
  const [interests, setInterests] = useState<string[]>([]);

  const totalSteps = 6;

  const canProceed = () => {
    switch (step) {
      case 1: return name.trim().length >= 2;
      case 2: return Number(age) >= 18 && Number(age) <= 99;
      case 3: return true;
      case 4: return city.trim().length >= 2;
      case 5: return true;
      case 6: return photoUrls.length >= 1;
      default: return false;
    }
  };

  const handleFinish = () => {
    const formData: ProfileFormData = {
      name: name.trim(),
      age: Number(age),
      gender,
      target_gender: targetGender,
      bio: bio.trim(),
      voice_bio_url: '',
      country: 'Indonesia',
      city: city.trim(),
      target_location_mode: 'same_city',
      min_age_pref: 18,
      max_age_pref: 35,
      photos: photoUrls,
      interests: interests,
    };
    onComplete(formData);
  };

  const addPhoto = () => {
    if (photoInput.trim() && photoUrls.length < 3) {
      setPhotoUrls((prev) => [...prev, photoInput.trim()]);
      setPhotoInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gradient-to-b from-pink-50 to-white">
      <div className="w-full max-w-sm bg-white rounded-[32px] p-6 shadow-2xl border border-pink-100 space-y-6 animate-fade-in">
        {/* Brand + Progress */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-1.5">
            <div className="w-8 h-8 rounded-full match-gradient flex items-center justify-center shadow-md shadow-pink-500/20">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="text-xl font-black text-slate-900">
              match<span className="text-[#FF3366]">.in</span>
            </span>
          </div>

          {/* Step Progress Bar */}
          <div className="flex gap-1.5 px-4">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  i < step ? 'match-gradient' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
          <p className="text-[11px] text-slate-400 font-semibold">
            Langkah {step} dari {totalSteps}
          </p>
        </div>

        {/* Step 1: Name */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-lg font-extrabold text-slate-900">Siapa nama kamu? 👋</h2>
              <p className="text-xs text-slate-500 mt-1">Nama ini akan ditampilkan di profilmu</p>
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masukkan nama lengkap"
              className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 transition"
              autoFocus
            />
          </div>
        )}

        {/* Step 2: Age */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-lg font-extrabold text-slate-900">Berapa usiamu? 🎂</h2>
              <p className="text-xs text-slate-500 mt-1">Minimal 18 tahun</p>
            </div>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Contoh: 24"
              min={18}
              max={99}
              className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 transition text-center text-2xl font-bold"
              autoFocus
            />
          </div>
        )}

        {/* Step 3: Gender & Target */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="text-center">
              <h2 className="text-lg font-extrabold text-slate-900">Jenis Kelamin & Preferensi 👫</h2>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Kamu adalah</label>
              <div className="grid grid-cols-2 gap-2">
                {(['male', 'female'] as Gender[]).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGender(g)}
                    className={`py-3 rounded-2xl text-xs font-bold transition border ${
                      gender === g
                        ? 'match-gradient text-white border-transparent match-shadow-btn'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {g === 'male' ? '👨 Laki-laki' : '👩 Perempuan'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Ingin mencari</label>
              <div className="grid grid-cols-3 gap-2">
                {(['male', 'female', 'all'] as Gender[]).map((g) => (
                  <button
                    key={g}
                    onClick={() => setTargetGender(g)}
                    className={`py-3 rounded-2xl text-xs font-bold transition border ${
                      targetGender === g
                        ? 'match-gradient text-white border-transparent match-shadow-btn'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {g === 'male' ? '👨 Laki-laki' : g === 'female' ? '👩 Perempuan' : '👫 Semua'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: City Selection */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-lg font-extrabold text-slate-900">Kota tempat tinggal 🏙️</h2>
              <p className="text-xs text-slate-500 mt-1">Pilih kota atau ketik manual</p>
            </div>

            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ketik nama kota..."
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 transition"
            />

            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
              {POPULAR_CITIES.filter((c) => !city || c.toLowerCase().includes(city.toLowerCase())).map((c) => (
                <button
                  key={c}
                  onClick={() => setCity(c)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition border ${
                    city === c
                      ? 'match-gradient text-white border-transparent'
                      : 'bg-pink-50 text-[#FF3366] border-pink-100 hover:bg-pink-100'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Bio & Minat */}
        {step === 5 && (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-lg font-extrabold text-slate-900">Bio & Minat Kamu ✍️</h2>
              <p className="text-xs text-slate-500 mt-1">Ceritakan tentang dirimu dan pilih minatmu</p>
            </div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={200}
              placeholder="Suka ngobrol santai & kopi..."
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-300 transition resize-none leading-relaxed"
            />

            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Pilih Minat (Opsional)</label>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                {['Kopi', 'Musik', 'Travel', 'Design', 'Coding', 'Kuliner', 'Fotografi', 'Olahraga', 'Film', 'Gaming'].map((tag) => {
                  const selected = interests.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        if (selected) {
                          setInterests((prev) => prev.filter((t) => t !== tag));
                        } else if (interests.length < 5) {
                          setInterests((prev) => [...prev, tag]);
                        }
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition border ${
                        selected
                          ? 'match-gradient text-white border-transparent'
                          : 'bg-pink-50 text-[#FF3366] border-pink-100 hover:bg-pink-100'
                      }`}
                    >
                      {selected ? `✓ ${tag}` : tag}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Photos */}
        {step === 6 && (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-lg font-extrabold text-slate-900">Upload Foto Profil 📸</h2>
              <p className="text-xs text-slate-500 mt-1">Pilih dari galeri HP atau masukkan URL foto (1-3 foto)</p>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {photoUrls.map((url, idx) => (
                <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-pink-200 shadow-sm group">
                  <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => setPhotoUrls((prev) => prev.filter((_, i) => i !== idx))}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-slate-900/70 text-white text-xs flex items-center justify-center shadow hover:bg-red-600 transition"
                  >
                    ✕
                  </button>
                  {idx === 0 && (
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-pink-600 text-white text-[9px] font-bold">
                      Utama
                    </span>
                  )}
                </div>
              ))}

              {photoUrls.length < 3 && (
                <label className="aspect-square rounded-2xl border-2 border-dashed border-pink-300 bg-pink-50/60 hover:bg-pink-100/60 flex flex-col items-center justify-center gap-1 cursor-pointer transition active:scale-95">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const compressedBase64 = await compressImageFile(file);
                          setPhotoUrls((prev) => [...prev, compressedBase64]);
                        } catch (err) {
                          console.error('Failed to compress image', err);
                        }
                      }
                    }}
                  />
                  <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-xs">
                    <Camera className="w-5 h-5 text-[#FF3366]" />
                  </div>
                  <span className="text-[10px] font-bold text-pink-600">Pilih Foto</span>
                </label>
              )}
            </div>

            {photoUrls.length < 3 && (
              <div className="space-y-1.5 pt-2">
                <div className="relative flex items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-2 text-[10px] text-slate-400 font-semibold uppercase">atau tempel URL</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={photoInput}
                    onChange={(e) => setPhotoInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addPhoto()}
                    placeholder="https://..."
                    className="flex-1 px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-300 transition"
                  />
                  <button
                    onClick={addPhoto}
                    disabled={!photoInput.trim()}
                    className="px-4 py-2.5 rounded-2xl match-gradient text-white text-xs font-bold match-shadow-btn disabled:opacity-40 active:scale-95 transition cursor-pointer"
                  >
                    Tambah
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 pt-2">
          {step > 1 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex-1 py-3.5 rounded-full bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 active:scale-98 transition"
            >
              Kembali
            </button>
          )}

          {step < totalSteps ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed()}
              className="flex-1 py-3.5 rounded-full match-gradient text-white font-bold text-xs flex items-center justify-center gap-2 match-shadow-btn disabled:opacity-40 active:scale-98 transition"
            >
              <span>Lanjut</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={!canProceed()}
              className="flex-1 py-3.5 rounded-full match-gradient text-white font-bold text-xs flex items-center justify-center gap-2 match-shadow-btn disabled:opacity-40 active:scale-98 transition"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Mulai Match!</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
