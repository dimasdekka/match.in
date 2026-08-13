import { useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Input } from '@/components/ui/input';
import { CITIES } from '../constants/options';

export function CityPickerSheet({
  open,
  value,
  onOpenChange,
  onChange,
}: {
  open: boolean;
  value: string;
  onOpenChange: (open: boolean) => void;
  onChange: (city: string) => void;
}) {
  const [query, setQuery] = useState('');
  const cities = useMemo(
    () => CITIES.filter((city) => city.toLowerCase().includes(query.trim().toLowerCase())),
    [query],
  );
  const select = (city: string) => {
    onChange(city);
    onOpenChange(false);
    setQuery('');
  };
  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Choose your city"
      description="Select the city where you currently live."
    >
      <div className="city-search">
        <Icon icon="solar:magnifer-linear" />
        <Input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search city"
        />
      </div>
      <div className="city-list">
        {cities.map((city) => (
          <button
            type="button"
            className={city === value ? 'selected' : ''}
            onClick={() => select(city)}
            key={city}
          >
            <span>
              <Icon icon="solar:map-point-linear" />
              {city}
            </span>
            {city === value && <Icon icon="solar:check-circle-bold" />}
          </button>
        ))}
        {cities.length === 0 && <p>No city found.</p>}
      </div>
    </BottomSheet>
  );
}
