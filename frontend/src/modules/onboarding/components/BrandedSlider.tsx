import { cn } from '@/lib/utils';

type Props = {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  className?: string;
  ariaLabel: string;
};
export function BrandedSlider({ min, max, value, onChange, className, ariaLabel }: Props) {
  const progress = ((value - min) / (max - min)) * 100;
  return (
    <div
      className={cn('brand-slider', className)}
      style={{ '--slider-start': '0%', '--slider-end': `${progress}%` } as React.CSSProperties}
    >
      <input
        aria-label={ariaLabel}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}

export function BrandedRangeSlider({
  min,
  max,
  value,
  onChange,
  ariaLabel,
}: {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  ariaLabel: string;
}) {
  const [low, high] = value;
  const lowPercent = ((low - min) / (max - min)) * 100;
  const highPercent = ((high - min) / (max - min)) * 100;
  return (
    <div
      className="brand-slider brand-slider-range"
      style={
        {
          '--slider-start': `${lowPercent}%`,
          '--slider-end': `${highPercent}%`,
        } as React.CSSProperties
      }
    >
      <input
        aria-label={`${ariaLabel} minimum`}
        type="range"
        min={min}
        max={max}
        value={low}
        onChange={(event) => onChange([Math.min(Number(event.target.value), high - 1), high])}
      />
      <input
        aria-label={`${ariaLabel} maximum`}
        type="range"
        min={min}
        max={max}
        value={high}
        onChange={(event) => onChange([low, Math.max(Number(event.target.value), low + 1)])}
      />
    </div>
  );
}
