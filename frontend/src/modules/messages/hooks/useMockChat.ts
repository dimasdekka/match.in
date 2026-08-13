import { useEffect, useState } from 'react';
import type { MessageReaction, MockChatMessage, MockSticker } from '../@types';

const INITIAL: MockChatMessage[] = [
  { id: '1', type: 'text', direction: 'incoming', content: 'Hi! Nice to meet you here 👋', createdAt: new Date().toISOString() },
  { id: '2', type: 'text', direction: 'incoming', content: "What's your ideal weekend?", createdAt: new Date().toISOString() },
];

const createMessageId = () =>
  globalThis.crypto?.randomUUID?.() ?? `message-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const normalizeMessages = (value: unknown): MockChatMessage[] => {
  if (!Array.isArray(value)) return INITIAL;
  return value
    .filter((item): item is Partial<MockChatMessage> => Boolean(item && typeof item === 'object'))
    .map((item, index) => ({
      id: item.id ?? `legacy-${index}`,
      type: item.type ?? 'text',
      direction: item.direction ?? 'incoming',
      content: item.content,
      mediaUrl: item.mediaUrl,
      duration: item.duration,
      stickerEmoji: item.stickerEmoji,
      reaction: item.reaction,
      createdAt: item.createdAt && !Number.isNaN(Date.parse(item.createdAt))
        ? item.createdAt
        : new Date().toISOString(),
      status: item.status,
    }));
};

export function useMockChat(conversationId: string) {
  const storageKey = `matchin:mock-chat:${conversationId}`;
  const [messages, setMessages] = useState<MockChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? normalizeMessages(JSON.parse(saved)) : INITIAL;
    }
    catch { return INITIAL; }
  });

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(messages)); } catch { /* quota exceeded */ }
  }, [messages, storageKey]);

  const append = (message: Omit<MockChatMessage, 'id' | 'direction' | 'createdAt' | 'status'>) =>
    setMessages((items) => [...items, { ...message, id: createMessageId(), direction: 'outgoing', createdAt: new Date().toISOString(), status: 'read' }]);

  return {
    messages,
    clear: () => setMessages([]),
    sendText: (content: string) => append({ type: 'text', content }),
    sendImage: (mediaUrl: string) => append({ type: 'image', mediaUrl }),
    sendGif: (mediaUrl: string) => append({ type: 'gif', mediaUrl }),
    sendVoice: (mediaUrl: string, duration: number) => append({ type: 'voice', mediaUrl, duration }),
    sendSticker: (sticker: MockSticker) => append({ type: 'sticker', mediaUrl: sticker.previewUrl, stickerEmoji: sticker.emoji }),
    react: (id: string, reaction: MessageReaction) => setMessages((items) => items.map((item) => item.id === id ? { ...item, reaction } : item)),
  };
}
