import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { compressImageFile } from '@/utils/imageCompressor';
import type { ProfileFormData } from '@/types';
import { INTERESTS, MAX_PHOTOS, TARGETS } from '../constants/options';
import { OnboardingProvider, useOnboarding } from '../context/OnboardingContext';
import { useLocation } from '../hooks/useLocation';
import { OnboardingHeader } from './OnboardingHeader';
import { ChoiceGroup } from './ChoiceGroup';
import { ageFromBirthDate, profileStepError } from '../utils/profile';
import { CityPickerSheet } from './CityPickerSheet';
import { GenderPickerSheet } from './GenderPickerSheet';
import { BirthDatePickerSheet } from './BirthDatePickerSheet';
import { BrandedRangeSlider, BrandedSlider } from './BrandedSlider';
import { RelationshipGoalSheet, relationshipGoalLabel } from './RelationshipGoalSheet';

function Shell({ onComplete }: { onComplete: (data: ProfileFormData) => void }) {
  const { step, setStep, draft, patch } = useOnboarding();
  const [busy, setBusy] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [cityOpen, setCityOpen] = useState(false);
  const [genderOpen, setGenderOpen] = useState(false);
  const [birthDateOpen, setBirthDateOpen] = useState(false);
  const [relationshipOpen, setRelationshipOpen] = useState(false);
  const [replacePhotoIndex, setReplacePhotoIndex] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const username = window.Telegram?.WebApp?.initDataUnsafe?.user?.username || 'telegram_user';
  const location = useLocation((v) => patch(v));
  const firstStepError = profileStepError({
    name: draft.name,
    birthDate: draft.birth_date,
    city: draft.city,
  });
  const errors = [
    firstStepError,
    !draft.target_gender || draft.min_age_pref > draft.max_age_pref
      ? 'Check your match preferences.'
      : '',
    draft.bio.trim().length === 0
      ? 'Write a short bio to continue.'
      : draft.interests.length < 3
        ? 'Choose at least 3 interests.'
        : '',
    draft.photos.length < 1 ? 'Add at least one photo.' : '',
  ];
  const currentError = errors[step - 1];
  const valid = currentError === '';
  const next = () => {
    if (!valid) {
      setAttempted(true);
      if (step === 1 && draft.name.trim().length >= 2) {
        if (ageFromBirthDate(draft.birth_date) < 18 || ageFromBirthDate(draft.birth_date) > 100)
          setBirthDateOpen(true);
        else if (!draft.city) setCityOpen(true);
      }
      return;
    }
    setAttempted(false);
    setStep(Math.min(4, step + 1));
  };
  const submit = () => {
    if (!valid || busy) {
      setAttempted(true);
      return;
    }
    setBusy(true);
    onComplete({ ...draft, age: ageFromBirthDate(draft.birth_date) });
    setTimeout(() => setBusy(false), 900);
  };
  const upload = async (files: FileList | null) => {
    if (!files) return;
    setPhotoError('');
    setBusy(true);
    try {
      const room = replacePhotoIndex === null ? MAX_PHOTOS - draft.photos.length : 1;
      const encoded = await Promise.all(
        Array.from(files)
          .slice(0, room)
          .map((f) => compressImageFile(f)),
      );
      if (replacePhotoIndex === null) {
        patch({ photos: [...draft.photos, ...encoded] });
      } else if (encoded[0]) {
        patch({
          photos: draft.photos.map((photo, index) =>
            index === replacePhotoIndex ? encoded[0] : photo,
          ),
        });
      }
    } catch {
      setPhotoError('Photo could not be processed. Try another image.');
    } finally {
      setBusy(false);
      setReplacePhotoIndex(null);
      if (fileRef.current) fileRef.current.value = '';
    }
  };
  const openPhotoPicker = (index: number | null = null) => {
    setReplacePhotoIndex(index);
    fileRef.current?.click();
  };
  const movePhoto = (from: number, offsetX: number, offsetY: number, width: number) => {
    const height = width / 0.72;
    const currentColumn = from % 3;
    const currentRow = Math.floor(from / 3);
    const targetColumn = Math.max(
      0,
      Math.min(2, currentColumn + Math.round(offsetX / (width + 9))),
    );
    const targetRow = Math.max(0, currentRow + Math.round(offsetY / (height + 9)));
    const target = Math.min(draft.photos.length - 1, targetRow * 3 + targetColumn);
    if (target === from) return;
    const photos = [...draft.photos];
    const [moved] = photos.splice(from, 1);
    photos.splice(target, 0, moved);
    patch({ photos });
  };
  return (
    <main className="match-shell">
      <div className={`match-phone onboarding onboarding-step-${step}`}>
        <OnboardingHeader step={step} onBack={step > 1 ? () => setStep(step - 1) : undefined} />
        <AnimatePresence mode="wait">
          <motion.section
            key={step}
            className="step"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.22 }}
          >
            {step === 1 && (
              <>
                <div className="step-title">
                  <h1>Create your profile</h1>
                  <p>Tell us who you are so we can find your best matches.</p>
                </div>
                <button
                  className="avatar-upload"
                  type="button"
                  onClick={() => fileRef.current?.click()}
                >
                  {draft.photos[0] ? (
                    <img src={draft.photos[0]} alt="Profile" />
                  ) : (
                    <span>{draft.name.slice(0, 2).toUpperCase() || 'ME'}</span>
                  )}
                  <i>
                    <Icon icon="solar:camera-add-bold" />
                  </i>
                </button>
                <p className="avatar-caption">Add a profile photo</p>
                <Card className="form-card">
                  <Label>Full name</Label>
                  <Input
                    value={draft.name}
                    onChange={(e) => patch({ name: e.target.value })}
                    placeholder="Alex Leonard"
                  />
                </Card>
                <Card className="form-card">
                  <Label>Username</Label>
                  <Input value={`@${username}`} readOnly />
                  <small>
                    <Icon icon="solar:check-circle-bold" /> Telegram username connected
                  </small>
                </Card>
                <div className="two-col">
                  <Card className="form-card picker-card">
                    <Label>Date of birth</Label>
                    <button type="button" onClick={() => setBirthDateOpen(true)}>
                      <span>
                        {draft.birth_date
                          ? new Intl.DateTimeFormat('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            }).format(new Date(`${draft.birth_date}T00:00:00`))
                          : 'Choose date'}
                      </span>
                      <Icon icon="solar:calendar-date-linear" />
                    </button>
                  </Card>
                  <Card className="form-card picker-card">
                    <Label>Gender</Label>
                    <button type="button" onClick={() => setGenderOpen(true)}>
                      <span>{draft.gender === 'female' ? 'Woman' : 'Man'}</span>
                      <Icon icon="solar:alt-arrow-down-linear" />
                    </button>
                  </Card>
                </div>
                <Card className="form-card location-card">
                  <Label>Location</Label>
                  <div>
                    <Icon icon="solar:map-point-bold" />
                    <button
                      className="location-value"
                      type="button"
                      onClick={() => setCityOpen(true)}
                    >
                      <span>{draft.city || 'Choose city'}</span>
                      <Icon icon="solar:alt-arrow-down-linear" />
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={location.locate}
                      type="button"
                      aria-label="Use current location"
                    >
                      <Icon
                        icon={
                          location.status === 'loading'
                            ? 'svg-spinners:ring-resize'
                            : 'solar:radar-2-bold'
                        }
                      />
                    </Button>
                  </div>
                  {location.status === 'error' && (
                    <small>Location unavailable. Choose your city manually.</small>
                  )}
                </Card>
                <CityPickerSheet
                  open={cityOpen}
                  value={draft.city}
                  onOpenChange={setCityOpen}
                  onChange={(city) => patch({ city })}
                />
                <GenderPickerSheet
                  open={genderOpen}
                  value={draft.gender}
                  onOpenChange={setGenderOpen}
                  onChange={(gender) => patch({ gender })}
                />
                <BirthDatePickerSheet
                  open={birthDateOpen}
                  value={draft.birth_date}
                  onOpenChange={setBirthDateOpen}
                  onChange={(birth_date) => patch({ birth_date })}
                />
              </>
            )}
            {step === 2 && (
              <>
                <div className="step-title">
                  <h1>Who are you looking for?</h1>
                  <p>Set your preferences to discover people who feel right for you.</p>
                </div>
                <Card className="form-card preference-card">
                  <Label>I'm interested in</Label>
                  <ChoiceGroup
                    value={draft.target_gender}
                    options={TARGETS}
                    onChange={(v) => patch({ target_gender: v })}
                  />
                </Card>
                <Card className="form-card preference-card relationship-card picker-card">
                  <Label>Relationship goal</Label>
                  <button type="button" onClick={() => setRelationshipOpen(true)}>
                    <span>{relationshipGoalLabel(draft.relationship_goal)}</span>
                    <Icon icon="solar:alt-arrow-right-linear" />
                  </button>
                </Card>
                <RelationshipGoalSheet
                  open={relationshipOpen}
                  value={draft.relationship_goal}
                  onOpenChange={setRelationshipOpen}
                  onChange={(relationship_goal) => patch({ relationship_goal })}
                />
                <Card className="form-card range-card preference-card">
                  <Label>Preferred age range</Label>
                  <strong>
                    {draft.min_age_pref} – {draft.max_age_pref}
                  </strong>
                  <BrandedRangeSlider
                    min={18}
                    max={70}
                    value={[draft.min_age_pref, draft.max_age_pref]}
                    onChange={(v) => patch({ min_age_pref: v[0], max_age_pref: v[1] })}
                    ariaLabel="Preferred age range"
                  />
                </Card>
                <Card className="form-card range-card preference-card">
                  <Label>Maximum distance</Label>
                  <strong>{draft.max_distance_km} km</strong>
                  <BrandedSlider
                    min={1}
                    max={100}
                    value={draft.max_distance_km}
                    onChange={(max_distance_km) => patch({ max_distance_km })}
                    ariaLabel="Maximum distance"
                  />
                </Card>
                <p className="preference-note">
                  <Icon icon="solar:shield-check-linear" />
                  You can change these preferences anytime.
                </p>
              </>
            )}
            {step === 3 && (
              <>
                <div className="step-title">
                  <h1>Show your personality</h1>
                  <p>A little about you makes starting a conversation easier.</p>
                </div>
                <Card className="form-card bio-card">
                  <Label>About me</Label>
                  <Textarea
                    maxLength={160}
                    value={draft.bio}
                    onChange={(e) => patch({ bio: e.target.value })}
                    placeholder="Coffee lover, weekend explorer..."
                  />
                  <span>{draft.bio.length}/160</span>
                </Card>
                <Card className="form-card intention-card">
                  <Label>Dating intention</Label>
                  <ChoiceGroup
                    value={draft.dating_intention}
                    options={[
                      { value: 'serious', label: 'Something serious' },
                      { value: 'explore', label: 'Open to explore' },
                      { value: 'friends', label: 'New friends' },
                    ]}
                    onChange={(v) => patch({ dating_intention: v })}
                  />
                </Card>
                <div className="interests">
                  <h2>Choose your interests</h2>
                  {INTERESTS.map((item) => {
                    const selected = draft.interests.includes(item.id);
                    return (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        className={selected ? 'selected' : ''}
                        onClick={() =>
                          patch({
                            interests: selected
                              ? draft.interests.filter((x) => x !== item.id)
                              : [...draft.interests, item.id],
                          })
                        }
                        key={item.id}
                      >
                        <Icon icon={item.icon} />
                        {item.id}
                      </motion.button>
                    );
                  })}
                  <p>Choose at least 3 interests ({draft.interests.length}/3)</p>
                </div>
              </>
            )}
            {step === 4 && (
              <>
                <div className="step-title">
                  <h1>Add your best photos</h1>
                  <p>Profiles with clear photos get more meaningful matches.</p>
                </div>
                <Card className="photo-card">
                  <div className="photo-grid">
                    {Array.from({ length: MAX_PHOTOS }).map((_, i) =>
                      draft.photos[i] ? (
                        <motion.div
                          className="photo"
                          key={draft.photos[i]}
                          layout
                          drag
                          dragSnapToOrigin
                          dragMomentum={false}
                          whileDrag={{ scale: 1.04, zIndex: 8 }}
                          onDragEnd={(event, info) =>
                            movePhoto(
                              i,
                              info.offset.x,
                              info.offset.y,
                              (event.currentTarget as HTMLElement).offsetWidth,
                            )
                          }
                        >
                          <img src={draft.photos[i]} alt={`Profile ${i + 1}`} />
                          {i === 0 && <b>Main</b>}
                          <span className="photo-drag-hint">
                            <Icon icon="solar:hamburger-menu-linear" />
                          </span>
                          <div className="photo-actions">
                            <button
                              type="button"
                              onClick={() => openPhotoPicker(i)}
                              aria-label="Replace photo"
                            >
                              <Icon icon="solar:pen-bold" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                patch({ photos: draft.photos.filter((_, n) => n !== i) })
                              }
                              aria-label="Remove photo"
                            >
                              <Icon icon="solar:trash-bin-trash-bold" />
                            </button>
                          </div>
                        </motion.div>
                      ) : (
                        <button className="photo-empty" key={i} onClick={() => openPhotoPicker()}>
                          <Icon icon="solar:add-circle-linear" />
                        </button>
                      ),
                    )}
                  </div>
                </Card>
                {photoError && <p className="error-text">{photoError}</p>}
                <Card className="photo-tip">
                  <Icon icon="solar:stars-bold" />
                  Use recent photos that clearly show your face.
                </Card>
              </>
            )}
          </motion.section>
        </AnimatePresence>
        <input
          ref={fileRef}
          hidden
          multiple={replacePhotoIndex === null}
          accept="image/*"
          type="file"
          onChange={(e) => upload(e.target.files)}
        />
        <footer className="onboarding-footer">
          <span
            className={
              attempted && currentError ? 'validation-message visible' : 'validation-message'
            }
          >
            {attempted && currentError ? currentError : ' '}
          </span>
          <Button className="pink-cta" disabled={busy} onClick={step === 4 ? submit : next}>
            {busy ? (
              <Icon icon="svg-spinners:ring-resize" />
            ) : step === 4 ? (
              'Complete profile'
            ) : (
              'Continue'
            )}
          </Button>
        </footer>
      </div>
    </main>
  );
}
export function OnboardingWizard({
  initialName,
  onComplete,
}: {
  initialName?: string;
  onComplete: (data: ProfileFormData) => void;
}) {
  return (
    <OnboardingProvider initialName={initialName}>
      <Shell onComplete={onComplete} />
    </OnboardingProvider>
  );
}
