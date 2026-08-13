import heartSuit from '@/assets/reactions/heart-suit.svg';
import twoHearts from '@/assets/reactions/two-hearts.svg';
import smilingHearts from '@/assets/reactions/smiling-face-with-hearts.svg';
import heartArrow from '@/assets/reactions/heart-with-arrow.svg';
import loveLetter from '@/assets/reactions/love-letter.svg';
import sparklingHeart from '@/assets/reactions/sparkling-heart.svg';
import type { MessageReaction, MockSticker } from '../@types';

export const MOCK_BOT_STICKERS: MockSticker[] = [
  [heartSuit, 'heart'],
  [twoHearts, 'love'],
  [smilingHearts, 'smile'],
  [heartArrow, 'arrow'],
  [loveLetter, 'letter'],
  [sparklingHeart, 'sparkle'],
].map(([previewUrl, emoji], index) => ({
  fileId: `mock_bot_sticker_${index + 1}`,
  emoji,
  previewUrl,
}));
export const MESSAGE_REACTIONS: MessageReaction[] = ['heart', 'laugh', 'fire', 'like'];
export const MOCK_GIFS = [sparklingHeart, smilingHearts, twoHearts];
