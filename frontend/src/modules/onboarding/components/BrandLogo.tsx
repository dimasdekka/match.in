import { Icon } from '@iconify/react';
export function BrandLogo() {
  return (
    <div className="brand-lockup">
      <div className="brand-mark">
        <Icon icon="ph:cards-three-fill" />
        <Icon className="brand-heart" icon="solar:heart-bold" />
      </div>
      <div className="brand-word">
        match<span>.in</span>
      </div>
    </div>
  );
}
