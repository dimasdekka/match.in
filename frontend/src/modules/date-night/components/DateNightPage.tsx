import { Icon } from '@iconify/react';
import { motion } from 'motion/react';
import { AppPageHeader } from '@/modules/app-shell/components/AppPageHeader';
import man from '@/assets/man.png';
import women from '@/assets/women.png';

const benefits = [
  ['solar:users-group-rounded-bold', 'Get curated matches picked just for you'],
  ['solar:heart-bold', 'Find people with shared interests'],
  ['solar:shield-check-bold', 'Safe, respectful, and private dating'],
] as const;

export function DateNightPage({ onBack, onStart }: { onBack: () => void; onStart: () => void }) {
  return (
    <section className="app-page date-night-page">
      <AppPageHeader title="" onBack={onBack} />
      <div className="date-collage">
        <img src={women} alt="Date night" />
        <img src={man} alt="Date night" />
      </div>
      <div className="date-night-copy">
        <Icon icon="solar:hearts-bold" />
        <h1>Date Night</h1>
        <p>
          Discover someone
          <br />
          worth meeting
        </p>
      </div>
      <div className="date-benefits">
        {benefits.map(([icon, label]) => (
          <div key={label}>
            <Icon icon={icon} />
            <span>{label}</span>
          </div>
        ))}
      </div>
      <motion.button
        type="button"
        className="date-start"
        onClick={onStart}
        whileTap={{ scale: 0.97 }}
      >
        Let&apos;s match!
      </motion.button>
    </section>
  );
}
