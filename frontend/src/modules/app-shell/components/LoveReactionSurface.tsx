import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { motion } from 'motion/react';
import heartSuit from '@/assets/reactions/heart-suit.svg';
import twoHearts from '@/assets/reactions/two-hearts.svg';
import smilingHearts from '@/assets/reactions/smiling-face-with-hearts.svg';
import heartArrow from '@/assets/reactions/heart-with-arrow.svg';
import loveLetter from '@/assets/reactions/love-letter.svg';
import sparklingHeart from '@/assets/reactions/sparkling-heart.svg';

const LOVE_EMOJIS = [
  heartSuit,
  twoHearts,
  smilingHearts,
  heartArrow,
  loveLetter,
  sparklingHeart,
] as const;

interface Reaction {
  id: number;
  icon: (typeof LOVE_EMOJIS)[number];
  x: number;
  drift: number;
  size: number;
  rotate: number;
  rise: number;
  duration: number;
}

export function LoveReactionSurface({ children }: { children: ReactNode }) {
  const nextId = useRef(0);
  const cleanupTimers = useRef<number[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);

  useEffect(() => () => cleanupTimers.current.forEach(window.clearTimeout), []);

  const createReactions = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('button, a, input, textarea')) return;

    const burst = Array.from({ length: 9 }, () => ({
      id: nextId.current++,
      icon: LOVE_EMOJIS[Math.floor(Math.random() * LOVE_EMOJIS.length)],
      x: Math.max(
        24,
        Math.min(window.innerWidth - 24, event.clientX + (Math.random() - 0.5) * 120),
      ),
      drift: (Math.random() - 0.5) * 150,
      size: 25 + Math.random() * 19,
      rotate: (Math.random() - 0.5) * 38,
      rise: window.innerHeight * (0.72 + Math.random() * 0.2),
      duration: 1.75 + Math.random() * 0.35,
    }));

    setReactions((current) => [...current, ...burst]);
    const burstIds = new Set(burst.map((reaction) => reaction.id));
    cleanupTimers.current.push(
      window.setTimeout(() => {
        setReactions((current) => current.filter((reaction) => !burstIds.has(reaction.id)));
      }, 2250),
    );
  };

  return (
    <div className="love-reaction-surface" onPointerDown={createReactions}>
      {children}
      <div className="love-reaction-layer" aria-hidden="true">
        {reactions.map((reaction) => (
          <motion.span
            key={reaction.id}
            className="love-reaction"
            style={{
              left: reaction.x,
              marginLeft: -reaction.size / 2,
              width: reaction.size,
              height: reaction.size,
            }}
            initial={{ y: 12, x: 0, opacity: 0.6, scale: 0.78, rotate: 0 }}
            animate={{
              y: -reaction.rise,
              x: reaction.drift,
              opacity: [0, 1, 1, 0],
              scale: [0.45, 1.08, 0.9],
              rotate: reaction.rotate,
            }}
            transition={{ duration: reaction.duration, ease: 'easeOut' }}
          >
            <img src={reaction.icon} alt="" draggable={false} />
          </motion.span>
        ))}
      </div>
    </div>
  );
}
