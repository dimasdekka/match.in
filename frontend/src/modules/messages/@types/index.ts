export type MessageType = 'text' | 'image' | 'gif' | 'voice' | 'sticker';
export type MessageReaction = 'heart' | 'laugh' | 'fire' | 'like';

export interface ConversationMessage {
  id: string;
  type: MessageType;
  direction: 'incoming' | 'outgoing';
  content?: string;
  mediaUrl?: string;
  duration?: number;
  stickerEmoji?: string;
  reaction?: MessageReaction;
  createdAt: string;
  status?: 'sent' | 'delivered' | 'read';
}

export interface ChatSticker {
  fileId: string;
  emoji: string;
  previewUrl: string;
}
