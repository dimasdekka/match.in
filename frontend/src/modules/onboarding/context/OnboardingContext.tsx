import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Gender } from '@/@types';
import type { OnboardingDraft, ProfileFormData } from '../@types';
export type Draft = ProfileFormData & {
  birth_date: string;
  relationship_goal: 'long_term' | 'casual' | 'friendship';
  dating_intention: 'serious' | 'explore' | 'friends';
  max_distance_km: number;
  latitude?: number;
  longitude?: number;
};
type Value = {
  step: number;
  setStep: (n: number) => void;
  draft: Draft;
  patch: (value: Partial<Draft>) => void;
};
const Context = createContext<Value | null>(null);
export function OnboardingProvider({
  initialName = '',
  initialData,
  children,
}: {
  initialName?: string;
  initialData?: Partial<OnboardingDraft>;
  children: ReactNode;
}) {
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<Draft>(() => ({
    name: initialName,
    age: 18,
    gender: 'male' as Gender,
    target_gender: 'female',
    bio: '',
    voice_bio_url: '',
    country: 'Indonesia',
    city: '',
    target_location_mode: 'same_city',
    min_age_pref: 22,
    max_age_pref: 30,
    photos: [],
    interests: [],
    birth_date: '',
    relationship_goal: 'long_term',
    dating_intention: 'serious',
    max_distance_km: 25,
    ...initialData,
  }));
  return (
    <Context.Provider
      value={{ step, setStep, draft, patch: (v) => setDraft((d) => ({ ...d, ...v })) }}
    >
      {children}
    </Context.Provider>
  );
}
export function useOnboarding() {
  const value = useContext(Context);
  if (!value) throw new Error('useOnboarding must be used inside OnboardingProvider');
  return value;
}
