import { Icon } from '@iconify/react';
import { motion, useReducedMotion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import man from '@/assets/man.png';
import women from '@/assets/women.png';
import { BrandLogo } from './BrandLogo';
export function WelcomeScreen({ onContinue }: { onContinue: () => void }) {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const reveal = reduced ? {} : { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 } };
  return (
    <main className="match-shell">
      <div className="match-phone match-welcome">
        <motion.div {...reveal}>
          <BrandLogo />
        </motion.div>
        <motion.div className="hero-couples" {...reveal} transition={{ delay: 0.08 }}>
          <div className="hero-photo woman">
            <img src={women} alt="" />
          </div>
          <div className="hero-photo man">
            <img src={man} alt="" />
          </div>
          <Icon className="hero-heart" icon="solar:heart-bold" />
          <Icon className="hero-star" icon="solar:stars-bold" />
        </motion.div>
        <motion.section className="welcome-copy" {...reveal} transition={{ delay: 0.14 }}>
          <h1>{t('welcome.title', 'Meet someone who gets you')}</h1>
          <p>{t('welcome.subtitle', 'Discover meaningful connections, safely and naturally.')}</p>
        </motion.section>
        <Card className="benefit-card">
          {[
            ['solar:shield-check-linear', t('welcome.private', 'Private')],
            ['solar:heart-angle-linear', t('welcome.real', 'Real matches')],
            ['ph:paper-plane-tilt', t('welcome.easy', 'Easy sign in')],
          ].map(([icon, label]) => (
            <div className="benefit" key={label}>
              <Icon icon={icon} />
              <span>{label}</span>
            </div>
          ))}
        </Card>
        <div className="welcome-actions">
          <Button className="pink-cta" onClick={onContinue}>
            <Icon icon="logos:telegram" />
            {t('welcome.continue', 'Continue with Telegram')}
          </Button>
          <p>
            {t('welcome.agree', 'By continuing, you agree to our')}{' '}
            <a href="#terms">{t('welcome.terms', 'Terms')}</a> &amp;{' '}
            <a href="#privacy">{t('welcome.privacy', 'Privacy Policy')}</a>
          </p>
        </div>
      </div>
    </main>
  );
}
