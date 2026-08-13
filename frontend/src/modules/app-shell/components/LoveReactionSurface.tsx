import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from 'react';
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
  y: number;
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

    const burst = Array.from({ length: 5 }, () => ({
      id: nextId.current++,
      icon: LOVE_EMOJIS[Math.floor(Math.random() * LOVE_EMOJIS.length)],
      x: Math.max(24, Math.min(window.innerWidth - 24, event.clientX + (Math.random() - 0.5) * 72)),
      y: Math.max(
        24,
        Math.min(window.innerHeight - 24, event.clientY + (Math.random() - 0.5) * 44),
      ),
      drift: (Math.random() - 0.5) * 110,
      size: 25 + Math.random() * 19,
      rotate: (Math.random() - 0.5) * 38,
      rise: Math.min(event.clientY * (0.55 + Math.random() * 0.2), 420),
      duration: 1.35 + Math.random() * 0.25,
    }));

    setReactions((current) => [...current.slice(-10), ...burst]);
    const burstIds = new Set(burst.map((reaction) => reaction.id));
    cleanupTimers.current.push(
      window.setTimeout(() => {
        setReactions((current) => current.filter((reaction) => !burstIds.has(reaction.id)));
      }, 1750),
    );
  };

  return (
    <div className="love-reaction-surface" onPointerDown={createReactions}>
      {children}
      <div className="love-reaction-layer" aria-hidden="true">
        {reactions.map((reaction) => (
          <span
            key={reaction.id}
            className="love-reaction"
            style={
              {
                left: reaction.x,
                top: reaction.y,
                marginLeft: -reaction.size / 2,
                marginTop: -reaction.size / 2,
                width: reaction.size,
                height: reaction.size,
                '--reaction-drift': `${reaction.drift}px`,
                '--reaction-rise': `${reaction.rise}px`,
                '--reaction-rotate': `${reaction.rotate}deg`,
                '--reaction-duration': `${reaction.duration}s`,
              } as CSSProperties
            }
          >
            <img src={reaction.icon} alt="" draggable={false} />
          </span>
        ))}
      </div>
    </div>
  );
}
