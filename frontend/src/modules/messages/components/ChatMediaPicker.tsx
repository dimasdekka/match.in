import { MOCK_BOT_STICKERS, MOCK_GIFS } from '../constants/media';
import type { MockSticker } from '../@types';

export function ChatMediaPicker({
  mode,
  onSticker,
  onGif,
}: {
  mode: 'sticker' | 'gif';
  onSticker: (item: MockSticker) => void;
  onGif: (url: string) => void;
}) {
  return (
    <div className="chat-media-picker">
      <strong>{mode === 'sticker' ? 'Bot stickers' : 'GIFs'}</strong>
      <div className="chat-media-grid">
        {mode === 'sticker'
          ? MOCK_BOT_STICKERS.map((item) => (
              <button type="button" key={item.fileId} onClick={() => onSticker(item)}>
                <img src={item.previewUrl} alt={item.emoji} />
              </button>
            ))
          : MOCK_GIFS.map((url, index) => (
              <button type="button" key={url} onClick={() => onGif(url)}>
                <img src={url} alt={`GIF ${index + 1}`} />
              </button>
            ))}
      </div>
    </div>
  );
}
