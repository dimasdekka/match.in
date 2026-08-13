import { Icon } from '@iconify/react';
import { BottomSheet } from '@/components/ui/bottom-sheet';

export type RelationshipGoal = 'long_term' | 'casual' | 'friendship';
export const RELATIONSHIP_GOALS: Array<{
  value: RelationshipGoal;
  label: string;
  description: string;
  icon: string;
}> = [
  {
    value: 'long_term',
    label: 'Long-term relationship',
    description: 'Build something meaningful and lasting.',
    icon: 'solar:heart-angle-bold',
  },
  {
    value: 'casual',
    label: 'Open to explore',
    description: 'Meet naturally and see where it goes.',
    icon: 'solar:compass-big-bold',
  },
  {
    value: 'friendship',
    label: 'New friends',
    description: 'Find people with shared interests.',
    icon: 'solar:users-group-rounded-bold',
  },
];

export function relationshipGoalLabel(value: RelationshipGoal) {
  return RELATIONSHIP_GOALS.find((option) => option.value === value)?.label ?? 'Choose a goal';
}

export function RelationshipGoalSheet({
  open,
  value,
  onOpenChange,
  onChange,
}: {
  open: boolean;
  value: RelationshipGoal;
  onOpenChange: (open: boolean) => void;
  onChange: (goal: RelationshipGoal) => void;
}) {
  const select = (goal: RelationshipGoal) => {
    onChange(goal);
    onOpenChange(false);
  };
  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Relationship goal"
      description="Choose what you hope to find on Match.in."
    >
      <div className="sheet-option-list relationship-options">
        {RELATIONSHIP_GOALS.map((option) => (
          <button
            type="button"
            className={value === option.value ? 'selected' : ''}
            onClick={() => select(option.value)}
            key={option.value}
          >
            <span className="sheet-option-icon">
              <Icon icon={option.icon} />
            </span>
            <span className="sheet-option-copy">
              <strong>{option.label}</strong>
              <small>{option.description}</small>
            </span>
            {value === option.value && (
              <Icon className="sheet-option-check" icon="solar:check-circle-bold" />
            )}
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}
