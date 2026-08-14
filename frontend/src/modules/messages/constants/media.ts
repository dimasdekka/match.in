import heartSuit from '@/assets/reactions/heart-suit.svg';
import twoHearts from '@/assets/reactions/two-hearts.svg';
import smilingHearts from '@/assets/reactions/smiling-face-with-hearts.svg';
import heartArrow from '@/assets/reactions/heart-with-arrow.svg';
import loveLetter from '@/assets/reactions/love-letter.svg';
import sparklingHeart from '@/assets/reactions/sparkling-heart.svg';
import type { MessageReaction, ChatSticker } from '../@types';

export const BOT_STICKERS: ChatSticker[] = [
  [heartSuit, 'heart'],
  [twoHearts, 'love'],
  [smilingHearts, 'smile'],
  [heartArrow, 'arrow'],
  [loveLetter, 'letter'],
  [sparklingHeart, 'sparkle'],
].map(([previewUrl, emoji], index) => ({
  fileId: `bot_sticker_${index + 1}`,
  emoji,
  previewUrl,
}));

export const MESSAGE_REACTIONS: MessageReaction[] = ['heart', 'laugh', 'fire', 'like'];
export const CHAT_GIFS = [sparklingHeart, smilingHearts, twoHearts];
