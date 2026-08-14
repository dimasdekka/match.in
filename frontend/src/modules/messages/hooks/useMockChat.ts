import { useEffect, useState, useCallback, useRef } from 'react';
import type { MessageReaction, MockChatMessage, MockSticker, MockMessageType } from '../@types';
import { api } from '@/utils/api';
import type { ChatMessage } from '@/@types';

export function useMockChat(conversationId: string) {
  const matchId = Number(conversationId) || 0;
  const [messages, setMessages] = useState<MockChatMessage[]>([]);
  const currentUserIdRef = useRef<number>(0);

  // Fetch current user ID to accurately determine incoming vs outgoing direction
  useEffect(() => {
    api.getMe()
      .then(({ user }) => {
        if (user && user.id) {
          currentUserIdRef.current = user.id;
        }
      })
      .catch(() => {});
  }, []);

  const mapBackendMessage = useCallback((msg: ChatMessage): MockChatMessage => {
    const isOutgoing = msg.sender_id === currentUserIdRef.current || currentUserIdRef.current === 0;
    const msgType: MockMessageType = (msg.message_type as MockMessageType) || (msg.image_url ? 'image' : 'text');

    return {
      id: String(msg.id),
      type: msgType,
      direction: isOutgoing ? 'outgoing' : 'incoming',
      content: msg.content,
      mediaUrl: msg.image_url,
      reaction: msg.reaction as MessageReaction | undefined,
      createdAt: msg.created_at,
      status: msg.is_read ? 'read' : 'delivered',
    };
  }, []);

  const fetchRealMessages = useCallback(async () => {
    if (!matchId) return;
    try {
      const res = await api.getChatMessages(matchId);
      if (res.messages) {
        setMessages(res.messages.map(mapBackendMessage));
      }
    } catch {
      // Fallback silently if offline
    }
  }, [matchId, mapBackendMessage]);

  // Initial load + Real-time polling every 2.5 seconds
  useEffect(() => {
    void fetchRealMessages();
    const interval = setInterval(fetchRealMessages, 2500);
    return () => clearInterval(interval);
  }, [fetchRealMessages]);

  const sendText = async (content: string) => {
    const optimisticMsg: MockChatMessage = {
      id: `temp-${Date.now()}`,
      type: 'text',
      direction: 'outgoing',
      content,
      createdAt: new Date().toISOString(),
      status: 'sent',
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const { message } = await api.sendChatMessage(matchId, content, undefined, 'text');
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticMsg.id ? mapBackendMessage(message) : m)),
      );
    } catch (err) {
      console.error('Failed to send text message', err);
    }
  };

  const sendImage = async (mediaUrl: string) => {
    const optimisticMsg: MockChatMessage = {
      id: `temp-${Date.now()}`,
      type: 'image',
      direction: 'outgoing',
      mediaUrl,
      createdAt: new Date().toISOString(),
      status: 'sent',
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const { message } = await api.sendChatMessage(matchId, '[Foto]', mediaUrl, 'image');
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticMsg.id ? mapBackendMessage(message) : m)),
      );
    } catch (err) {
      console.error('Failed to send image message', err);
    }
  };

  const sendGif = async (mediaUrl: string) => {
    const optimisticMsg: MockChatMessage = {
      id: `temp-${Date.now()}`,
      type: 'gif',
      direction: 'outgoing',
      mediaUrl,
      createdAt: new Date().toISOString(),
      status: 'sent',
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const { message } = await api.sendChatMessage(matchId, '[GIF]', mediaUrl, 'gif');
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticMsg.id ? mapBackendMessage(message) : m)),
      );
    } catch (err) {
      console.error('Failed to send gif message', err);
    }
  };

  const sendVoice = async (mediaUrl: string, duration: number) => {
    const optimisticMsg: MockChatMessage = {
      id: `temp-${Date.now()}`,
      type: 'voice',
      direction: 'outgoing',
      mediaUrl,
      duration,
      createdAt: new Date().toISOString(),
      status: 'sent',
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const { message } = await api.sendChatMessage(matchId, '[Voice Note]', mediaUrl, 'voice');
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticMsg.id ? mapBackendMessage(message) : m)),
      );
    } catch (err) {
      console.error('Failed to send voice message', err);
    }
  };

  const sendSticker = async (sticker: MockSticker) => {
    const optimisticMsg: MockChatMessage = {
      id: `temp-${Date.now()}`,
      type: 'sticker',
      direction: 'outgoing',
      mediaUrl: sticker.previewUrl,
      stickerEmoji: sticker.emoji,
      createdAt: new Date().toISOString(),
      status: 'sent',
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const { message } = await api.sendChatMessage(matchId, sticker.emoji, sticker.previewUrl, 'sticker');
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticMsg.id ? mapBackendMessage(message) : m)),
      );
    } catch (err) {
      console.error('Failed to send sticker message', err);
    }
  };

  const react = async (id: string, reaction: MessageReaction) => {
    setMessages((items) =>
      items.map((item) => (item.id === id ? { ...item, reaction } : item)),
    );
    const numId = Number(id);
    if (numId) {
      try {
        await api.reactMessage(numId, reaction);
      } catch (err) {
        console.error('Failed to save message reaction', err);
      }
    }
  };

  const clear = async () => {
    setMessages([]);
    if (matchId) {
      try {
        await api.clearChat(matchId);
      } catch (err) {
        console.error('Failed to clear chat on server', err);
      }
    }
  };

  return {
    messages,
    clear,
    sendText,
    sendImage,
    sendGif,
    sendVoice,
    sendSticker,
    react,
  };
}
