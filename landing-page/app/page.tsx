"use client";

import { useEffect, useState, type PointerEvent as ReactPointerEvent } from "react";
import Image from "next/image";
import Lenis from "lenis";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";

import { Button } from "@/components/ui/button";
import { LoveReactionSurface } from "@/components/LoveReactionSurface";

function MatchinLogo({ hero = false }: { hero?: boolean }) {
  return (
    <div className={`logo${hero ? " logo--hero" : ""}`}>
      <Image
        className="logo-image"
        src="/matchin-brand.png"
        alt="matchin"
        width={1086}
        height={362}
        priority={hero}
      />
    </div>
  );
}

function PhotoTile({
  src,
  className,
  alt,
  badge,
  ready,
  delay,
  reducedMotion,
}: {
  src: string;
  className: string;
  alt: string;
  badge?: string;
  ready: boolean;
  delay: number;
  reducedMotion: boolean | null;
}) {
  const hidden = reducedMotion
    ? { opacity: 0, scale: 0.9 }
    : {
        opacity: 0,
        scale: 0.18,
        x: "var(--photo-origin-x)",
        y: "var(--photo-origin-y)",
        rotate: "var(--photo-origin-rotate)",
      };

  return (
    <motion.div
      className={`photo-tile ${className}`}
      initial={hidden}
      animate={ready ? { opacity: 1, scale: 1, x: 0, y: 0, rotate: 0 } : hidden}
      transition={
        reducedMotion
          ? { duration: 0.15 }
          : { type: "spring", stiffness: 68, damping: 13, mass: 0.82, delay }
      }
    >
      <Image src={src} alt={alt} fill sizes="(max-width: 700px) 80px, 170px" />
      {badge && <span className="photo-badge">{badge}</span>}
    </motion.div>
  );
}

function PinkAppIcon({ type }: { type: "heart" | "podcast" | "music" }) {
  return (
    <span className={`app-icon app-icon--${type}`}>
      {type === "heart" && <span className="tiny-heart">♥</span>}
      {type === "podcast" && (
        <svg viewBox="0 0 40 40" aria-hidden="true">
          <circle cx="20" cy="14" r="5" />
          <path d="M13 16a8 8 0 0 0 4 7m10-7a8 8 0 0 1-4 7M9 15a12 12 0 0 0 7 11m15-11a12 12 0 0 1-7 11" />
          <path d="m20 21 4 5-2 10h-4l-2-10 4-5Z" />
        </svg>
      )}
      {type === "music" && <span className="music-note">♫</span>}
    </span>
  );
}

function PhoneMockup({ ready, reducedMotion }: { ready: boolean; reducedMotion: boolean | null }) {
  return (
    <motion.div
      className="phone"
      aria-hidden="true"
      initial={{ opacity: 0, filter: reducedMotion ? "blur(0px)" : "blur(12px)" }}
      animate={
        ready
          ? { opacity: 0.72, filter: "blur(0px)" }
          : { opacity: 0, filter: reducedMotion ? "blur(0px)" : "blur(12px)" }
      }
      transition={{ duration: reducedMotion ? 0.15 : 0.72, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="phone-status">
        <span>9:41</span>
        <span className="status-icons">▮▮▮ ◔ ▰</span>
      </div>
      <div className="phone-grid">
        <div className="phone-profile">
          <Image src="/women.png" alt="" fill sizes="170px" priority />
          <span>matchin</span>
        </div>
        <PinkAppIcon type="heart" />
        <span className="app-icon app-icon--book">▯</span>
        <span className="calendar"><small>Tue</small><strong>1</strong></span>
        <PinkAppIcon type="music" />
        <span className="app-icon app-icon--orb">◉</span>
        <span className="app-icon app-icon--store">A</span>
        <PinkAppIcon type="podcast" />
        <span className="app-icon app-icon--notes"><i /><i /><i /></span>
        <span className="app-icon app-icon--rings">◉</span>
        <span className="app-icon app-icon--mail">✉</span>
        <span className="app-icon app-icon--flower">✿</span>
      </div>
    </motion.div>
  );
}

function Sticker({
  src,
  className,
  alt = "",
  ready,
  delay,
  reducedMotion,
}: {
  src: string;
  className: string;
  alt?: string;
  ready: boolean;
  delay: number;
  reducedMotion: boolean | null;
}) {
  const hidden = reducedMotion
    ? { opacity: 0, scale: 0.9 }
    : {
        opacity: 0,
        scale: 0.16,
        x: "var(--sticker-origin-x)",
        y: "var(--sticker-origin-y)",
        rotate: "var(--sticker-origin-rotate)",
      };

  return (
    <div className={`sticker ${className}`}>
      <motion.div
        className="sticker-motion"
        initial={hidden}
        animate={ready ? { opacity: 1, scale: 1, x: 0, y: 0, rotate: 0 } : hidden}
        transition={
          reducedMotion
            ? { duration: 0.15 }
            : { type: "spring", stiffness: 74, damping: 13, mass: 0.78, delay }
        }
      >
        <Image src={src} alt={alt} width={320} height={240} />
      </motion.div>
    </div>
  );
}

const INTRO_WORDS = ["FIND", "YOUR", "MATCH"] as const;

function IntroSplash({ onComplete, reducedMotion }: { onComplete: () => void; reducedMotion: boolean | null }) {
  useEffect(() => {
    const timeout = window.setTimeout(onComplete, reducedMotion ? 650 : 3200);
    return () => window.clearTimeout(timeout);
  }, [onComplete, reducedMotion]);

  const stopReaction = (event: ReactPointerEvent<HTMLDivElement>) => event.stopPropagation();

  return (
    <motion.div
      className="intro-splash"
      role="presentation"
      onPointerDown={stopReaction}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reducedMotion ? 0.08 : 0.2, ease: "easeOut" }}
    >
      <motion.div
        className="intro-copy"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: reducedMotion ? 0 : 0.48, delayChildren: 0.18 } },
        }}
      >
        {INTRO_WORDS.map((word, index) => (
          <span className="intro-word-mask" key={word}>
            <motion.span
              className={`intro-word intro-word--${index + 1}`}
              variants={{
                hidden: {
                  y: "115%",
                  opacity: 0,
                  filter: reducedMotion ? "blur(0px)" : "blur(14px)",
                  rotate: index % 2 === 0 ? 4 : -3,
                },
                visible: {
                  y: "0%",
                  opacity: 1,
                  filter: "blur(0px)",
                  rotate: index === 0 ? -2 : index === 2 ? 1.5 : 0,
                  transition: reducedMotion
                    ? { duration: 0.01 }
                    : { type: "spring", damping: 14, stiffness: 105, mass: 0.9 },
                },
              }}
            >
              {word}
            </motion.span>
          </span>
        ))}
      </motion.div>
      <motion.span
        className="intro-heart"
        aria-hidden="true"
        initial={{ opacity: 0, scale: 0, rotate: -18 }}
        animate={{ opacity: 1, scale: 1, rotate: 8 }}
        transition={{ delay: reducedMotion ? 0 : 1.72, type: "spring", stiffness: 180, damping: 12 }}
      >
        ♥
      </motion.span>
    </motion.div>
  );
}

const INFO_CARDS = [
  { id: "help", image: "/section/helpcenter.png", title: "Help Center", description: "Get support and answers to your questions" },
  { id: "safety", image: "/section/setting&trust.png", title: "Safety & Trust", description: "Date confidently with privacy and safety tools" },
  { id: "tips", image: "/section/dating-time.png", title: "Dating Tips", description: "Discover tips for better chats and meaningful dates" },
  { id: "stories", image: "/section/matching-stories.png", title: "Matchin Stories", description: "Real connections and stories from our community" },
] as const;

function SocialIcon({ type }: { type: "instagram" | "x" | "tiktok" }) {
  if (type === "instagram") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle className="social-dot" cx="17.5" cy="6.5" r="1" />
      </svg>
    );
  }
  if (type === "x") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 3 20 21M20 3 4 21" /></svg>;
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14 4v10.5a4.5 4.5 0 1 1-4-4.47" />
      <path d="M14 4c.8 2.7 2.5 4.1 5 4.4" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg className="telegram-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21.5 3.5 18.4 19c-.23 1.1-.84 1.37-1.7.85l-4.73-3.5-2.28 2.2c-.25.25-.46.46-.95.46l.34-4.82 8.77-7.93c.38-.34-.08-.53-.59-.19L6.42 12.9l-4.67-1.46c-1.02-.32-1.03-1.02.21-1.5L20.2 2.9c.85-.31 1.59.2 1.3.6Z" />
    </svg>
  );
}

function InfoSection({ reducedMotion }: { reducedMotion: boolean | null }) {
  return (
    <section className="info-section" aria-label="Matchin resources">
      <div className="info-grid">
        {INFO_CARDS.map((card, index) => (
          <motion.article
            className="info-card"
            id={card.id}
            key={card.title}
            initial={reducedMotion ? false : { opacity: 0, y: 42 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.58, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className={`info-card__visual info-card__visual--${index + 1}`}>
              <Image src={card.image} alt="" width={280} height={210} />
            </div>
            <h2>{card.title}</h2>
            <p>{card.description}</p>
          </motion.article>
        ))}
      </div>

      <footer className="site-footer" id="about">
        <div className="footer-brand">
          <MatchinLogo />
          <div className="social-links" aria-label="Matchin social media">
            <a href="#instagram" aria-label="Instagram"><SocialIcon type="instagram" /></a>
            <a href="#x" aria-label="X"><SocialIcon type="x" /></a>
            <a href="#tiktok" aria-label="TikTok"><SocialIcon type="tiktok" /></a>
          </div>
          <p>© 2026 matchin Labs, Inc.</p>
        </div>
        <div className="footer-column">
          <h3>Download</h3>
          <span className="footer-coming-soon"><span>iOS</span><small>Coming soon</small></span>
          <span className="footer-coming-soon"><span>Android</span><small>Coming soon</small></span>
        </div>
        <div className="footer-column">
          <h3>About</h3>
          <a href="#privacy">Privacy Policy</a>
          <a href="#terms">Terms &amp; Conditions</a>
          <a href="#cookies">Cookie Policy</a>
        </div>
        <div className="footer-column" id="careers">
          <h3>Get in Touch</h3>
          <a href="#help">Help Center</a>
          <a href="#safety">Safety</a>
          <a href="#stories">Stories</a>
        </div>
      </footer>
    </section>
  );
}

export default function Home() {
  const shouldReduceMotion = useReducedMotion();
  const [showIntro, setShowIntro] = useState(true);
  const [heroReady, setHeroReady] = useState(false);
  const [navbarScrolled, setNavbarScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setNavbarScrolled(latest > 24);
  });

  useEffect(() => {
    document.body.style.overflow = showIntro ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showIntro]);

  useEffect(() => {
    if (shouldReduceMotion) return;

    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    let frame = 0;
    const tick = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, [shouldReduceMotion]);

  return (
    <LoveReactionSurface>
    <AnimatePresence onExitComplete={() => setHeroReady(true)}>
      {showIntro && (
        <IntroSplash reducedMotion={shouldReduceMotion} onComplete={() => setShowIntro(false)} />
      )}
    </AnimatePresence>
    <main id="home">
      <header className={`navbar-shell${navbarScrolled ? " navbar-shell--scrolled" : ""}`}>
      <div className="navbar">
        <a href="#home" aria-label="matchin home"><MatchinLogo /></a>
        <nav aria-label="Main navigation">
          <a href="#help">Help</a>
          <a href="#safety">Safety</a>
          <a href="#stories">Stories</a>
          <a href="#about">About</a>
        </nav>
        <Button asChild variant="download" size="download">
          <a href="https://t.me/MatchInDating_bot" target="_blank" rel="noreferrer" aria-label="Open MatchInDating bot on Telegram">
            <TelegramIcon />
            <span>Telegram</span>
          </a>
        </Button>
      </div>
      </header>

    <section className="hero">

      <motion.section
        className="hero-stage"
        aria-label="Meet someone who matches your vibe"
        initial={shouldReduceMotion ? false : { opacity: 0, scale: 1.015 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="ambient ambient--one" />
        <div className="ambient ambient--two" />

        <PhoneMockup ready={heroReady} reducedMotion={shouldReduceMotion} />
        <motion.div
          className="qr-code"
          initial={{
            opacity: 0,
            scale: shouldReduceMotion ? 1 : 0.88,
            filter: shouldReduceMotion
              ? "blur(0px) drop-shadow(0 24px 22px rgba(99,73,82,.18))"
              : "blur(14px) drop-shadow(0 24px 22px rgba(99,73,82,.18))",
          }}
          animate={
            heroReady
              ? {
                  opacity: 1,
                  scale: 1,
                  filter: "blur(0px) drop-shadow(0 24px 22px rgba(99,73,82,.18))",
                }
              : {
                  opacity: 0,
                  scale: shouldReduceMotion ? 1 : 0.88,
                  filter: shouldReduceMotion
                    ? "blur(0px) drop-shadow(0 24px 22px rgba(99,73,82,.18))"
                    : "blur(14px) drop-shadow(0 24px 22px rgba(99,73,82,.18))",
                }
          }
          transition={{ duration: shouldReduceMotion ? 0.15 : 0.78, delay: shouldReduceMotion ? 0 : 0.06, ease: [0.22, 1, 0.36, 1] }}
        >
          <a
            className="qr-code__link"
            href="https://t.me/MatchInDating_bot"
            target="_blank"
            rel="noreferrer"
            aria-label="Open MatchInDating bot on Telegram"
            aria-describedby="telegram-qr-tooltip"
          >
            <Image src="/barcode.png" alt="Scan the matchin QR code" width={280} height={280} priority />
          </a>
          <div className="qr-tooltip" id="telegram-qr-tooltip" role="tooltip">
            <span className="qr-tooltip__phone" aria-hidden="true">
              <span><TelegramIcon /></span>
            </span>
            <p>
              <strong>Scan with your phone</strong>
              <span>to open Telegram</span>
            </p>
          </div>
        </motion.div>

        <PhotoTile src="/couple.png" className="photo-top-left" alt="A happy couple" badge="♥ 297" ready={heroReady} delay={0.06} reducedMotion={shouldReduceMotion} />
        <PhotoTile src="/women.png" className="photo-top-right" alt="A matchin member" badge="hehe" ready={heroReady} delay={0.13} reducedMotion={shouldReduceMotion} />
        <PhotoTile src="/couple.png" className="photo-bottom-left" alt="A happy couple" badge="you + me?" ready={heroReady} delay={0.25} reducedMotion={shouldReduceMotion} />
        <PhotoTile src="/women2.png" className="photo-bottom-right" alt="A matchin member" ready={heroReady} delay={0.31} reducedMotion={shouldReduceMotion} />

        <Sticker src="/hearth-red.png" className="heart-red-left" ready={heroReady} delay={0.03} reducedMotion={shouldReduceMotion} />
        <Sticker src="/hearth-pink-glow.png" className="heart-pink" ready={heroReady} delay={0.19} reducedMotion={shouldReduceMotion} />
        <Sticker src="/2hearth.png" className="heart-chat" ready={heroReady} delay={0.29} reducedMotion={shouldReduceMotion} />
        <Sticker src="/2hearth-border.png" className="heart-outline" ready={heroReady} delay={0.34} reducedMotion={shouldReduceMotion} />
        <Sticker src="/findyourmatch.png" className="find-match" alt="Find your match" ready={heroReady} delay={0.11} reducedMotion={shouldReduceMotion} />
        <Sticker src="/swipematch.png" className="swipe-match" alt="Swipe match" ready={heroReady} delay={0.08} reducedMotion={shouldReduceMotion} />
        <Sticker src="/perfectmatch.png" className="perfect-match" alt="Perfect match" ready={heroReady} delay={0.23} reducedMotion={shouldReduceMotion} />
        <Sticker src="/itsamatch.png" className="its-a-match" alt="It's a match" ready={heroReady} delay={0.15} reducedMotion={shouldReduceMotion} />

        <motion.div
          className="hero-message"
          id="download"
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20, x: "-50%", filter: shouldReduceMotion ? "blur(0px)" : "blur(16px)" }}
          animate={
            heroReady
              ? { opacity: 1, y: 0, x: "-50%", filter: "blur(0px)" }
              : { opacity: 0, y: shouldReduceMotion ? 0 : 20, x: "-50%", filter: shouldReduceMotion ? "blur(0px)" : "blur(16px)" }
          }
          transition={{ duration: shouldReduceMotion ? 0.15 : 0.85, delay: shouldReduceMotion ? 0 : 0.16, ease: [0.22, 1, 0.36, 1] }}
        >
          <MatchinLogo hero />
          <h1>Meet someone who matches your vibe</h1>
          <a className="scroll-cue" href="#help" aria-label="Discover more">
            <svg viewBox="0 0 48 24" aria-hidden="true"><path d="m5 7 19 10L43 7" /></svg>
          </a>
        </motion.div>
      </motion.section>
    </section>
      <InfoSection reducedMotion={shouldReduceMotion} />
    </main>
    </LoveReactionSurface>
  );
}
