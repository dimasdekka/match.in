"use client";

import { useEffect, useState, type PointerEvent as ReactPointerEvent } from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";
import Lenis from "lenis";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";

import { Button } from "@/components/ui/button";
import { LoveReactionSurface } from "@/components/LoveReactionSurface";
import { MatchinLogo, MatchinLogoIcon, MatchinWordmark } from "@/components/MatchinBrand";

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
      whileHover={ready ? { scale: 1.06 } : undefined}
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

function LegacyPhoneMockup({ ready, reducedMotion }: { ready: boolean; reducedMotion: boolean | null }) {
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

const PHONE_FLOW_LABELS = ["HOME", "BOT", "DISCOVER", "MATCH", "CHAT"] as const;
const PHONE_FLOW_DURATIONS = [4550, 6700, 3800, 3500, 3800] as const;

function PhoneMockup({
  ready,
  flowReady,
  reducedMotion,
}: {
  ready: boolean;
  flowReady: boolean;
  reducedMotion: boolean | null;
}) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!ready || !flowReady) {
      setStep(0);
      return;
    }

    if (reducedMotion) {
      setStep(2);
      return;
    }

    const timeout = window.setTimeout(() => {
      setStep((current) => (current + 1) % PHONE_FLOW_LABELS.length);
    }, PHONE_FLOW_DURATIONS[step]);

    return () => window.clearTimeout(timeout);
  }, [ready, flowReady, reducedMotion, step]);

  const enter = reducedMotion
    ? false
    : { opacity: 0, y: 22, scale: 0.965, rotate: 1.2 };
  const flowTransition = reducedMotion
    ? { duration: 0.01 }
    : { type: "spring" as const, stiffness: 145, damping: 20, mass: 0.78 };

  return (
    <motion.div
      className="phone phone--flow"
      data-flow-step={PHONE_FLOW_LABELS[step].toLowerCase()}
      aria-label="Telegram Bot to Match.in Mini App preview"
      initial={{ opacity: 0, filter: reducedMotion ? "blur(0px)" : "blur(14px)" }}
      animate={{
        opacity: ready ? 1 : 0,
        filter: ready || reducedMotion ? "blur(0px)" : "blur(14px)",
      }}
      transition={{ duration: reducedMotion ? 0.15 : 0.78, ease: [0.22, 1, 0.36, 1] }}
    >
      <span className="phone-shine" aria-hidden="true" />
      <div className="phone-status" aria-hidden="true">
        <span className="telegram-status-pill"><TelegramIcon /> TELEGRAM</span>
      </div>

      <>
        {step === 1 ? (
          <motion.div
            className="telegram-chat-chrome"
            key="telegram-chat-chrome"
            initial={reducedMotion ? false : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <button type="button" tabIndex={-1}><span>‹</span> Chats</button>
            <span className="telegram-chat-person">
              <i><TelegramIcon /></i>
              <span><strong>Match.in Bot</strong><small>bot</small></span>
            </span>
            <b aria-hidden="true">•••</b>
          </motion.div>
        ) : step > 1 ? (
          <motion.div
            className="mini-app-chrome"
            key="mini-app-chrome"
            initial={reducedMotion ? false : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <button type="button" tabIndex={-1}>Close</button>
            <span><strong>Match.in</strong><small>mini app</small></span>
            <i aria-hidden="true">•••</i>
          </motion.div>
        ) : null}
      </>

      <div className={`phone-flow-stage${step === 0 ? " is-home" : ""}`}>
        <>
          {ready && step === 0 && (
            <motion.div
              className="flow-screen phone-home-flow"
              key="home"
              initial={flowReady ? enter : false}
              animate={
                reducedMotion || !flowReady
                  ? { opacity: 1, y: 0, scale: 1, rotate: 0 }
                  : {
                      opacity: 1,
                      y: 0,
                      scale: [1, 1.5, 1],
                      rotate: 0,
                    }
              }
              transition={
                reducedMotion || !flowReady
                  ? flowTransition
                  : {
                      opacity: { duration: .24, ease: "easeOut" },
                      scale: { duration: 3.2, times: [0, .5, 1], ease: [0.76, 0, 0.24, 1] },
                    }
              }
            >
              <div className="phone-home-heading">
                <span><small>Good morning</small><strong>Find your person.</strong></span>
                <i aria-hidden="true">
                  <Image src="/matching-no-text.png" alt="" fill sizes="46px" priority />
                </i>
              </div>
              <div className="phone-home-grid">
                <div className="home-profile-tile">
                  <Image src="/home/witget matchin.png" alt="Match.in profile widget" fill sizes="170px" priority />
                </div>
                <motion.button
                  className="home-app home-app--telegram"
                  type="button"
                  onClick={() => setStep(1)}
                  aria-label="Open Match.in on Telegram"
                  animate={reducedMotion || !flowReady ? undefined : { scale: [1, .86, 1] }}
                  transition={{ duration: .32, delay: 1.52, times: [0, .48, 1], ease: "easeInOut" }}
                >
                  <span className="home-app-icon"><Image src="/home/tele.png" alt="" fill sizes="78px" priority /></span>
                  <small>Telegram</small>
                  <motion.i
                    aria-hidden="true"
                    animate={reducedMotion || !flowReady ? undefined : { opacity: [0, .55, 0], scale: [.65, 1.45, 1.7] }}
                    transition={{ duration: .5, delay: 1.46, ease: "easeOut" }}
                  />
                </motion.button>
                <span className="home-app home-app--photos">
                  <span className="home-app-icon"><Image src="/home/photos.png" alt="" fill sizes="78px" /></span>
                  <small>Photos</small>
                </span>
                <span className="home-app home-app--calendar">
                  <span className="home-app-icon"><Image src="/home/calender.png" alt="" fill sizes="78px" /></span>
                  <small>Calendar</small>
                </span>
                <span className="home-app home-app--music">
                  <span className="home-app-icon"><Image src="/home/music.png" alt="" fill sizes="78px" /></span>
                  <small>Music</small>
                </span>
                <span className="home-app home-app--camera">
                  <span className="home-app-icon"><Image src="/home/camera.png" alt="" fill sizes="78px" /></span>
                  <small>Camera</small>
                </span>
                <span className="home-app home-app--messages">
                  <span className="home-app-icon"><Image src="/home/messages.png" alt="" fill sizes="78px" /></span>
                  <small>Messages</small>
                </span>
              </div>
              <motion.div
                className="phone-home-hint"
                initial={false}
                animate={{ opacity: 1, y: 0 }}
              >
                <TelegramIcon /> Tap Telegram to start
              </motion.div>
            </motion.div>
          )}

          {ready && step === 1 && (
            <motion.div
              className="flow-screen bot-flow"
              key="bot"
              initial={reducedMotion ? false : { opacity: 0, scale: .985, y: 10 }}
              animate={
                reducedMotion
                  ? { opacity: 1, y: 0, scale: 1 }
                  : {
                      opacity: 1,
                      x: [0, 0, 18, 18, 0, 0, 0],
                      y: [0, 0, -72, -72, 0, 0, -18],
                      scale: [1, 1, 1.22, 1.22, 1, 1, 1.12],
                    }
              }
              transition={
                reducedMotion
                  ? flowTransition
                  : {
                      opacity: { duration: .28, ease: "easeOut" },
                      x: { duration: 6.35, times: [0, .11, .2, .46, .58, .82, 1], ease: [0.22, 1, 0.36, 1] },
                      y: { duration: 6.35, times: [0, .11, .2, .46, .58, .82, 1], ease: [0.22, 1, 0.36, 1] },
                      scale: { duration: 6.35, times: [0, .11, .2, .46, .58, .82, 1], ease: [0.22, 1, 0.36, 1] },
                    }
              }
            >
              <span className="telegram-chat-date">Today</span>
              <motion.div
                className="bot-outgoing-message"
                initial={reducedMotion ? false : { opacity: 0, y: 10, scale: .88 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: reducedMotion ? 0 : 3.55, type: "spring", stiffness: 250, damping: 20 }}
              >/start <time>9:41 ✓✓</time></motion.div>
              <motion.div
                className="bot-typing-indicator"
                initial={reducedMotion ? false : { opacity: 0, y: 8, scale: .9 }}
                animate={
                  reducedMotion
                    ? { opacity: 0 }
                    : { opacity: [0, 1, 1, 0], y: [8, 0, 0, 0], scale: [.9, 1, 1, .96] }
                }
                transition={{ duration: .95, delay: 3.82, times: [0, .18, .72, 1] }}
              ><i /><i /><i /></motion.div>
              <motion.div
                className="bot-message"
                initial={reducedMotion ? false : { opacity: 0, y: 12, scale: .94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: reducedMotion ? 0 : 4.48, type: "spring", stiffness: 220, damping: 21 }}
              >
                <small>Match.in Bot</small>
                <strong>Ready to meet your match?</strong>
                <p>Discover real people nearby, safely inside Telegram.</p>
              </motion.div>
              <motion.button
                type="button"
                onClick={() => setStep(2)}
                aria-label="Open Match.in Mini App"
                initial={reducedMotion ? false : { scale: 1, opacity: 0, y: 7 }}
                animate={
                  reducedMotion
                    ? { scale: 1, opacity: 1, y: 0 }
                    : { scale: [1, 1, .93, 1], opacity: 1, y: 0 }
                }
                transition={
                  reducedMotion
                    ? { duration: 0.01 }
                    : {
                        opacity: { duration: .24, delay: 4.82 },
                        y: { duration: .32, delay: 4.82, ease: [0.22, 1, 0.36, 1] },
                        scale: { duration: .48, delay: 5.48, times: [0, .38, .62, 1] },
                      }
                }
              >
                <TelegramIcon /> Open Match.in
              </motion.button>
              <motion.div
                className="telegram-composer-demo"
                initial={reducedMotion ? false : { opacity: 0, y: 18 }}
                animate={
                  reducedMotion
                    ? { opacity: 1, y: 0 }
                    : { opacity: [0, 1, 1, 1, 0], y: [18, 0, 0, 0, 12] }
                }
                transition={{ duration: 3.62, times: [0, .16, .7, .87, 1], ease: [0.22, 1, 0.36, 1] }}
              >
                <span className="telegram-composer-plus">+</span>
                <span className="telegram-composer-field">
                  <motion.span
                    initial={reducedMotion ? false : { width: 0 }}
                    animate={{ width: reducedMotion ? 34 : 34 }}
                    transition={{ duration: reducedMotion ? 0 : .82, delay: reducedMotion ? 0 : 1.18, ease: "linear" }}
                  >/start</motion.span>
                  <i />
                </span>
                <motion.button
                  type="button"
                  tabIndex={-1}
                  aria-label="Send message"
                  animate={reducedMotion ? undefined : { scale: [1, 1, .78, 1], rotate: [0, 0, -8, 0] }}
                  transition={{ duration: .46, delay: 2.43, times: [0, .35, .6, 1] }}
                ><Icon icon="solar:plain-2-bold" /></motion.button>
              </motion.div>
            </motion.div>
          )}

          {ready && step === 2 && (
            <motion.div
              className="flow-screen discover-flow"
              key="discover"
              initial={reducedMotion ? false : { opacity: 0, scale: 1.16, y: 10 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
              transition={reducedMotion ? flowTransition : { duration: .58, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="discover-flow-toolbar">
                <span>⌁</span><strong>For You</strong><i>N</i>
              </div>
              <motion.div
                className="discover-flow-card"
                animate={
                  reducedMotion
                    ? undefined
                    : {
                        x: [0, 0, 8, 150],
                        y: [0, 0, -2, 12],
                        rotate: [0, 0, 1.5, 10],
                        scale: [1, 1, 1.015, .96],
                        opacity: [1, 1, 1, 0],
                      }
                }
                transition={{ duration: 3.45, times: [0, .54, .68, 1], ease: [0.22, 1, 0.36, 1] }}
              >
                <Image src="/women.png" alt="Naya profile preview" fill sizes="310px" priority />
                <motion.span
                  className="discover-like-stamp"
                  initial={reducedMotion ? false : { opacity: 0, scale: .75, rotate: -9 }}
                  animate={reducedMotion ? undefined : { opacity: [0, 0, 1, 1], scale: [.75, .75, 1, 1], rotate: [-9, -9, -5, -5] }}
                  transition={{ duration: 2.5, times: [0, .7, .84, 1], ease: [0.22, 1, 0.36, 1] }}
                >LIKE</motion.span>
                <div>
                  <h3>Naya, 24 <span>✓</span></h3>
                  <small>Jakarta · 3 km away</small>
                  <p>Coffee dates, live music &amp; Sunday walks.</p>
                </div>
              </motion.div>
              <div className="discover-flow-actions" aria-hidden="true">
                <span>×</span>
                <motion.span
                  animate={reducedMotion ? undefined : { scale: [1, 1, .82, 1.17, 1], boxShadow: ["0 0 22px rgba(255,54,117,.28)", "0 0 22px rgba(255,54,117,.28)", "0 0 12px rgba(255,54,117,.2)", "0 0 34px rgba(255,54,117,.52)", "0 0 22px rgba(255,54,117,.28)"] }}
                  transition={{ duration: 2.65, times: [0, .68, .75, .84, 1] }}
                >♥</motion.span>
                <span>✦</span>
              </div>
            </motion.div>
          )}

          {ready && step === 3 && (
            <motion.div
              className="flow-screen match-flow"
              key="match"
              initial={enter}
              animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
              transition={flowTransition}
            >
              <motion.span className="match-spark match-spark--one" animate={reducedMotion ? undefined : { y: [0, -8, 0], rotate: [0, 15, 0], opacity: [.55, 1, .55] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}>✦</motion.span>
              <motion.span className="match-spark match-spark--two" animate={reducedMotion ? undefined : { y: [0, 7, 0], rotate: [0, -12, 0], scale: [1, 1.12, 1] }} transition={{ duration: 2.1, repeat: Infinity, ease: "easeInOut" }}>♥</motion.span>
              <div className="match-avatars">
                <motion.span initial={reducedMotion ? false : { x: 46, rotate: 8, opacity: 0 }} animate={{ x: 0, rotate: -7, opacity: 1 }} transition={{ delay: .08, type: "spring", stiffness: 190, damping: 16 }}><Image src="/women.png" alt="Naya" fill sizes="110px" /></motion.span>
                <motion.i initial={reducedMotion ? false : { scale: 0, rotate: -16 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: .42, type: "spring", stiffness: 360, damping: 15 }}>♥</motion.i>
                <motion.span initial={reducedMotion ? false : { x: -46, rotate: -8, opacity: 0 }} animate={{ x: 0, rotate: 7, opacity: 1 }} transition={{ delay: .16, type: "spring", stiffness: 190, damping: 16 }}><Image src="/man.png" alt="Your profile" fill sizes="110px" /></motion.span>
              </div>
              <motion.h3 initial={reducedMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .5 }}>It&apos;s a match!</motion.h3>
              <motion.p initial={reducedMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .62 }}>You and Naya liked each other.</motion.p>
              <motion.button
                type="button"
                onClick={() => setStep(4)}
                initial={reducedMotion ? false : { opacity: 0, y: 12, scale: 1 }}
                animate={reducedMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: 0, scale: [1, 1, .94, 1] }}
                transition={
                  reducedMotion
                    ? { duration: 0.01 }
                    : {
                        opacity: { duration: .3, delay: .78 },
                        y: { duration: .38, delay: .78, ease: [0.22, 1, 0.36, 1] },
                        scale: { duration: .48, delay: 2.35, times: [0, .35, .62, 1] },
                      }
                }
              >Say hello <span>→</span></motion.button>
            </motion.div>
          )}

          {ready && step === 4 && (
            <motion.div
              className="flow-screen chat-flow"
              key="chat"
              initial={reducedMotion ? false : { opacity: 0, scale: 1.08, y: 8 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
              transition={flowTransition}
            >
              <div className="chat-flow-heading"><strong>Messages</strong><span>3 active</span></div>
              {[
                { name: "Naya", image: "/women.png", message: "You matched! Say hello 💕", delay: 0 },
                { name: "Salsa", image: "/women2.png", message: "Coffee this weekend?", delay: 0.08 },
                { name: "Raka", image: "/man.png", message: "Sent you a message", delay: 0.16 },
              ].map((chat) => (
                <motion.div className="chat-flow-row" key={chat.name} initial={reducedMotion ? false : { opacity: 0, x: 22 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .18 + chat.delay, type: "spring", stiffness: 230, damping: 22 }}>
                  <span><Image src={chat.image} alt="" fill sizes="54px" /><i /></span>
                  <p><strong>{chat.name}</strong><small>{chat.message}</small></p>
                  <time>Now</time>
                </motion.div>
              ))}
              <motion.div className="chat-flow-composer" initial={reducedMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reducedMotion ? 0 : .68 }}><span>Write a message...</span><i>➤</i></motion.div>
            </motion.div>
          )}
        </>
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
        whileHover={ready ? { scale: 1.1 } : undefined}
        transition={
          reducedMotion
            ? { duration: 0.15 }
            : { type: "spring", stiffness: 74, damping: 13, mass: 0.78, delay }
        }
      >
        <motion.div
          className="sticker-float"
          animate={ready && !reducedMotion ? { x: [0, 2, 0, -2, 0], y: [0, -7, 0, 6, 0], rotate: [0, 1.4, 0, -1.1, 0] } : undefined}
          transition={
            ready && !reducedMotion
              ? { duration: 4.8 + delay * 2, delay: delay * 0.7, repeat: Infinity, ease: "easeInOut" }
              : undefined
          }
        >
          <Image src={src} alt={alt} width={320} height={240} />
        </motion.div>
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
  { id: "help", image: "/section/helpcenter.png", title: "Help Center", description: "Get support and answers to your questions", detail: "Find quick guidance, helpful answers, and the support you need to make every Match.in experience feel easy and confident." },
  { id: "safety", image: "/section/setting&trust.png", title: "Safety & Trust", description: "Date confidently with privacy and safety tools", detail: "Your privacy comes first with tools and resources designed to help you connect safely, confidently, and on your own terms." },
  { id: "tips", image: "/section/dating-time.png", title: "Dating Tips", description: "Discover tips for better chats and meaningful dates", detail: "Learn simple ways to start better conversations, show your personality, and turn a good chat into a meaningful connection." },
  { id: "stories", image: "/section/matching-stories.png", title: "Matchin Stories", description: "Real connections and stories from our community", detail: "Read real stories from people finding new sparks, shared moments, and connections that feel genuinely worth remembering." },
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
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const activeCardData = INFO_CARDS.find((card) => card.id === activeCard);

  return (
    <section className="info-section" aria-label="Matchin resources">
      <div className="info-grid">
        {INFO_CARDS.map((card, index) => (
          <motion.article
            className="info-card"
            id={card.id}
            key={card.title}
            tabIndex={0}
            onMouseEnter={() => setActiveCard(card.id)}
            onMouseLeave={() => setActiveCard(null)}
            onClick={() => setActiveCard((current) => (current === card.id ? null : card.id))}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setActiveCard((current) => (current === card.id ? null : card.id));
              }
            }}
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

      <AnimatePresence>
        {activeCardData && (
          <motion.div
            className="info-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`${activeCardData.title} details`}
            initial={{ opacity: 0, filter: reducedMotion ? "blur(0px)" : "blur(16px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, filter: reducedMotion ? "blur(0px)" : "blur(10px)" }}
            transition={{ duration: reducedMotion ? 0.08 : 0.42, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              className="info-modal__panel"
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 28, scale: .94, filter: "blur(14px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 18, scale: .97, filter: "blur(10px)" }}
              transition={{ duration: reducedMotion ? 0.08 : 0.52, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="info-modal__visual">
                <Image src={activeCardData.image} alt="" fill sizes="(max-width: 780px) 80vw, 430px" />
              </div>
              <div className="info-modal__content">
                <h2>{activeCardData.title}</h2>
                <p className="info-modal__lead">{activeCardData.description}</p>
                <p className="info-modal__detail-copy">{activeCardData.detail}</p>
                <MatchinLogo size="md" color="white" className="info-modal__brand" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="site-footer" id="about">
        <div className="footer-brand">
          <MatchinLogo size="lg" />
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

      <div className="footer-watermark" aria-hidden="true">
        <div className="footer-watermark-content">
          <MatchinLogoIcon size={175} />
          <MatchinWordmark size="watermark" color="pink" />
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const shouldReduceMotion = useReducedMotion();
  const [showIntro, setShowIntro] = useState(true);
  const [heroReady, setHeroReady] = useState(false);
  const [phoneFlowReady, setPhoneFlowReady] = useState(false);
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
    if (!heroReady) {
      setPhoneFlowReady(false);
      return;
    }

    if (shouldReduceMotion) {
      setPhoneFlowReady(true);
      return;
    }

    const timeout = window.setTimeout(() => setPhoneFlowReady(true), 900);
    return () => window.clearTimeout(timeout);
  }, [heroReady, shouldReduceMotion]);

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

        <PhoneMockup
          ready={heroReady}
          flowReady={phoneFlowReady}
          reducedMotion={shouldReduceMotion}
        />
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
