import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
export function ChoiceGroup<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="choice-group">
      {options.map((o) => (
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          className={cn(value === o.value && 'selected')}
          onClick={() => onChange(o.value)}
          key={o.value}
        >
          {o.label}
        </motion.button>
      ))}
    </div>
  );
}
