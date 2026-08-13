import { Icon } from '@iconify/react';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import type { Gender } from '@/@types';

const OPTIONS: Array<{ value: Extract<Gender, 'male' | 'female'>; label: string; icon: string }> = [
  { value: 'male', label: 'Man', icon: 'fluent-emoji-flat:man-light' },
  { value: 'female', label: 'Woman', icon: 'streamline-emojis:woman-2' },
];

export function GenderPickerSheet({
  open,
  value,
  onOpenChange,
  onChange,
}: {
  open: boolean;
  value: Gender;
  onOpenChange: (open: boolean) => void;
  onChange: (gender: Gender) => void;
}) {
  const select = (gender: Gender) => {
    onChange(gender);
    onOpenChange(false);
  };
  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Choose your gender"
      description="Select how you want to appear on Match.in."
    >
      <div className="sheet-option-list">
        {OPTIONS.map((option) => (
          <button
            type="button"
            className={value === option.value ? 'selected' : ''}
            onClick={() => select(option.value)}
            key={option.value}
          >
            <span className="sheet-option-icon">
              <Icon icon={option.icon} />
            </span>
            <strong>{option.label}</strong>
            {value === option.value && (
              <Icon className="sheet-option-check" icon="solar:check-circle-bold" />
            )}
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}
