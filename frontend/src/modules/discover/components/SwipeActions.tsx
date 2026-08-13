import { IconButton } from './IconButton';
import type { SwipeDecision } from '../@types';
export function SwipeActions({ onSwipe }: { onSwipe: (decision: SwipeDecision) => void }) {
  return (
    <div className="swipe-actions">
      <IconButton icon="mingcute:close-line" label="Pass" onClick={() => onSwipe('pass')} />
      <IconButton
        icon="solar:heart-bold"
        label="Like"
        className="like-action"
        onClick={() => onSwipe('like')}
      />
      <IconButton
        icon="solar:stars-bold"
        label="Super like"
        className="super-action"
        onClick={() => onSwipe('superlike')}
      />
    </div>
  );
}
