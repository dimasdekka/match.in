import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ageFromBirthDate } from '../utils/profile';

const today = new Date();
const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate())
  .toISOString()
  .slice(0, 10);
const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate())
  .toISOString()
  .slice(0, 10);

export function BirthDatePickerSheet({
  open,
  value,
  onOpenChange,
  onChange,
}: {
  open: boolean;
  value: string;
  onOpenChange: (open: boolean) => void;
  onChange: (date: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);
  const age = ageFromBirthDate(draft);
  const valid = draft !== '' && age >= 18 && age <= 100;
  return (
    <BottomSheet
      className="birth-date-sheet"
      open={open}
      onOpenChange={onOpenChange}
      title="Date of birth"
      description="You must be at least 18 years old to use Match.in."
    >
      <div className="birth-date-picker">
        <div className="birth-date-field">
          <Icon icon="solar:calendar-date-bold" />
          <Input
            type="date"
            min={minDate}
            max={maxDate}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
        </div>
        {draft && <p>{valid ? `${age} years old` : 'Choose a valid age between 18 and 100.'}</p>}
        <Button
          className="pink-cta"
          disabled={!valid}
          onClick={() => {
            onChange(draft);
            onOpenChange(false);
          }}
        >
          Confirm date
        </Button>
      </div>
    </BottomSheet>
  );
}
