export type MockMessageType = 'text' | 'image' | 'gif' | 'voice' | 'sticker';
export type MessageReaction = 'heart' | 'laugh' | 'fire' | 'like';

export interface MockChatMessage {
  id: string;
  type: MockMessageType;
  direction: 'incoming' | 'outgoing';
  content?: string;
  mediaUrl?: string;
  duration?: number;
  stickerEmoji?: string;
  reaction?: MessageReaction;
  createdAt: string;
  status?: 'sent' | 'delivered' | 'read';
}

export interface MockSticker {
  fileId: string;
  emoji: string;
  previewUrl: string;
}
