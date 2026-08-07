import React, { useState } from 'react';
import type { ProfileFormData } from '../types';
import { Heart, ArrowRight, ArrowLeft, MapPin, User, Sparkles } from 'lucide-react';

interface OnboardingWizardProps {
  initialName?: string;
  onComplete: (data: ProfileFormData) => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  initialName = '',
  onComplete,
}) => {
  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState<ProfileFormData>({
    name: initialName || 'Alex',
    age: 22,
    gender: 'male',
    target_gender: 'female',
    bio: 'Salam kenal! Suka ngobrol santai & eksplor hal baru ✨',
    voice_bio_url: '',
    country: 'Indonesia',
    city: 'Jakarta',
    target_location_mode: 'same_city',
    min_age_pref: 18,
    max_age_pref: 35,
    photos: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80'],
    interests: ['Kopi', 'Musik', 'Travel'],
  });

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleFinish = () => {
    onComplete(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-pink-500/30 p-6 flex flex-col justify-between min-h-[480px] shadow-2xl shadow-pink-500/10">
        
        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 to-purple-600 flex items-center justify-center">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="text-sm font-bold bg-gradient-to-r from-rose-400 to-purple-400 bg-clip-text text-transparent">
              Registrasi Match.in
            </span>
          </div>

          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30">
            Langkah {step} dari 5
          </span>
        </div>

        {/* Step Content */}
        <div className="py-6 flex-1 flex flex-col justify-center">
          {step === 1 && (
            <div className="space-y-4 text-center animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-pink-500/20 text-pink-400 mx-auto flex items-center justify-center">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Siapa Namamu?</h3>
                <p className="text-xs text-slate-400 mt-1">Nama ini akan tampil pada kartu profil kamu.</p>
              </div>

              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Masukkan nama..."
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-base text-white text-center focus:border-pink-500 focus:outline-none"
                required
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 text-center animate-fade-in">
              <div>
                <h3 className="text-xl font-bold text-white">Berapa Usiamu?</h3>
                <p className="text-xs text-slate-400 mt-1">Kamu harus berusia minimal 18 tahun.</p>
              </div>

              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, age: Math.max(18, formData.age - 1) })}
                  className="w-12 h-12 rounded-full bg-slate-800 text-white font-bold text-xl hover:bg-slate-700"
                >
                  -
                </button>
                <span className="text-4xl font-extrabold text-pink-400">{formData.age}</span>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, age: Math.min(99, formData.age + 1) })}
                  className="w-12 h-12 rounded-full bg-slate-800 text-white font-bold text-xl hover:bg-slate-700"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-fade-in text-center">
              <h3 className="text-xl font-bold text-white">Jenis Kelamin & Preferensi</h3>
              <p className="text-xs text-slate-400">Pilih jenis kelaminmu dan siapa yang ingin kamu cari.</p>

              <div className="space-y-3">
                <div className="text-left space-y-1">
                  <label className="text-xs text-slate-400 font-semibold">Saya seorang:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, gender: 'male' })}
                      className={`p-3 rounded-xl border font-semibold text-xs transition ${
                        formData.gender === 'male'
                          ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      👨 Pria
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, gender: 'female' })}
                      className={`p-3 rounded-xl border font-semibold text-xs transition ${
                        formData.gender === 'female'
                          ? 'bg-pink-500/20 border-pink-500 text-pink-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      👩 Wanita
                    </button>
                  </div>
                </div>

                <div className="text-left space-y-1">
                  <label className="text-xs text-slate-400 font-semibold">Saya mencari pasangan:</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, target_gender: 'female' })}
                      className={`p-2.5 rounded-xl border font-semibold text-xs transition ${
                        formData.target_gender === 'female'
                          ? 'bg-pink-500/20 border-pink-500 text-pink-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      👩 Wanita
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, target_gender: 'male' })}
                      className={`p-2.5 rounded-xl border font-semibold text-xs transition ${
                        formData.target_gender === 'male'
                          ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      👨 Pria
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, target_gender: 'all' })}
                      className={`p-2.5 rounded-xl border font-semibold text-xs transition ${
                        formData.target_gender === 'all'
                          ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      ✨ Semua
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 animate-fade-in text-center">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Dimana Lokasimu?</h3>
                <p className="text-xs text-slate-400 mt-1">Digunakan untuk mencocokkan jodoh di kotamu.</p>
              </div>

              <div className="space-y-2 text-left">
                <div>
                  <label className="text-xs text-slate-400 font-semibold">Negara</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-pink-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-semibold">Kota</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-pink-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4 animate-fade-in text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-rose-500 to-purple-600 mx-auto flex items-center justify-center text-white shadow-lg shadow-pink-500/30">
                <Sparkles className="w-8 h-8 animate-spin" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-white">Profil Siap! 🎉</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Selamat datang di Match.in! Tekan tombol di bawah untuk mulai menemukan jodoh di sekitarmu.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          {step > 1 ? (
            <button
              onClick={prevStep}
              className="p-3 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali</span>
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button
              onClick={nextStep}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-pink-500/20 hover:opacity-95"
            >
              <span>Lanjut</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-pink-500/30 hover:opacity-95"
            >
              <Heart className="w-4 h-4 fill-white" />
              <span>Mulai Cari Jodoh!</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
