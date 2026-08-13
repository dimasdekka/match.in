import { Icon } from '@iconify/react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
export function OnboardingHeader({ step, onBack }: { step: number; onBack?: () => void }) {
  const safeStep = Math.min(4, Math.max(1, step));
  return (
    <header className="onboarding-header">
      <Button variant="secondary" size="icon" onClick={onBack} disabled={!onBack} aria-label="Back">
        <Icon icon="solar:alt-arrow-left-linear" />
      </Button>
      <div>
        <strong>{safeStep} of 4</strong>
        <div
          className="step-progress"
          role="progressbar"
          aria-label={`Onboarding step ${safeStep} of 4`}
          aria-valuemin={1}
          aria-valuemax={4}
          aria-valuenow={safeStep}
        >
          <motion.span
            initial={false}
            animate={{ width: `${safeStep * 25}%` }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>
      <span />
    </header>
  );
}
