import { useEffect, useState, useCallback, useRef } from 'react';
import type { MessageReaction, ConversationMessage, ChatSticker, MessageType } from '../@types';
import { api, getTelegramInitData } from '@/utils/api';
import type { ChatMessage } from '@/@types';

export function useChat(conversationId: string) {
  const matchId = Number(conversationId) || 0;
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const currentUserIdRef = useRef<number>(0);
  const wsRef = useRef<WebSocket | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const mapBackendMessage = useCallback((msg: ChatMessage): ConversationMessage => {
    const isOutgoing = msg.sender_id === currentUserIdRef.current || (currentUserIdRef.current === 0 && msg.sender_id !== 0);
    const msgType: MessageType = (msg.message_type as MessageType) || (msg.image_url ? 'image' : 'text');

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

  // Initial load message history
  useEffect(() => {
    void fetchRealMessages();
  }, [fetchRealMessages]);

  // Establish persistent Realtime WebSocket connection
  useEffect(() => {
    if (!matchId) return;

    let isMounted = true;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let pingInterval: ReturnType<typeof setInterval> | null = null;

    const connectWS = () => {
      const initData = getTelegramInitData();
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws/chat?init_data=${encodeURIComponent(initData)}`;

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          // Send heartbeat ping every 25 seconds
          pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ event: 'ping' }));
            }
          }, 25000);
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            if (data.event === 'chat_message' && data.message && data.match_id === matchId) {
              const incomingMsg = mapBackendMessage(data.message);
              setMessages((prev) => {
                // Deduplicate if already present
                const exists = prev.some((m) => m.id === incomingMsg.id);
                if (exists) return prev;
                return [...prev, incomingMsg];
              });
            } else if (data.event === 'reaction' && data.match_id === matchId) {
              setMessages((prev) =>
                prev.map((m) => (m.id === String(data.message_id) ? { ...m, reaction: data.reaction } : m)),
              );
            } else if (data.event === 'typing' && data.match_id === matchId) {
              setIsTyping(true);
              if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
              typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
            }
          } catch {}
        };

        ws.onclose = () => {
          if (pingInterval) clearInterval(pingInterval);
          if (isMounted) {
            reconnectTimer = setTimeout(connectWS, 3000);
          }
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch {
        if (isMounted) {
          reconnectTimer = setTimeout(connectWS, 4000);
        }
      }
    };

    connectWS();

    return () => {
      isMounted = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (pingInterval) clearInterval(pingInterval);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [matchId, mapBackendMessage]);

  const sendText = async (content: string) => {
    const optimisticMsg: ConversationMessage = {
      id: `temp-${Date.now()}`,
      type: 'text',
      direction: 'outgoing',
      content,
      createdAt: new Date().toISOString(),
      status: 'sent',
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        event: 'chat_message',
        match_id: matchId,
        content,
        message_type: 'text',
      }));
    } else {
      try {
        const { message } = await api.sendChatMessage(matchId, content, undefined, 'text');
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticMsg.id ? mapBackendMessage(message) : m)),
        );
      } catch (err) {
        console.error('Failed to send text message', err);
      }
    }
  };

  const sendImage = async (mediaUrl: string) => {
    const optimisticMsg: ConversationMessage = {
      id: `temp-${Date.now()}`,
      type: 'image',
      direction: 'outgoing',
      mediaUrl,
      createdAt: new Date().toISOString(),
      status: 'sent',
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        event: 'chat_message',
        match_id: matchId,
        content: '[Foto]',
        image_url: mediaUrl,
        message_type: 'image',
      }));
    } else {
      try {
        const { message } = await api.sendChatMessage(matchId, '[Foto]', mediaUrl, 'image');
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticMsg.id ? mapBackendMessage(message) : m)),
        );
      } catch (err) {
        console.error('Failed to send image message', err);
      }
    }
  };

  const sendGif = async (mediaUrl: string) => {
    const optimisticMsg: ConversationMessage = {
      id: `temp-${Date.now()}`,
      type: 'gif',
      direction: 'outgoing',
      mediaUrl,
      createdAt: new Date().toISOString(),
      status: 'sent',
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        event: 'chat_message',
        match_id: matchId,
        content: '[GIF]',
        image_url: mediaUrl,
        message_type: 'gif',
      }));
    } else {
      try {
        const { message } = await api.sendChatMessage(matchId, '[GIF]', mediaUrl, 'gif');
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticMsg.id ? mapBackendMessage(message) : m)),
        );
      } catch (err) {
        console.error('Failed to send gif message', err);
      }
    }
  };

  const sendVoice = async (mediaUrl: string, duration: number) => {
    const optimisticMsg: ConversationMessage = {
      id: `temp-${Date.now()}`,
      type: 'voice',
      direction: 'outgoing',
      mediaUrl,
      duration,
      createdAt: new Date().toISOString(),
      status: 'sent',
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        event: 'chat_message',
        match_id: matchId,
        content: '[Voice Note]',
        image_url: mediaUrl,
        message_type: 'voice',
      }));
    } else {
      try {
        const { message } = await api.sendChatMessage(matchId, '[Voice Note]', mediaUrl, 'voice');
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticMsg.id ? mapBackendMessage(message) : m)),
        );
      } catch (err) {
        console.error('Failed to send voice message', err);
      }
    }
  };

  const sendSticker = async (sticker: ChatSticker) => {
    const optimisticMsg: ConversationMessage = {
      id: `temp-${Date.now()}`,
      type: 'sticker',
      direction: 'outgoing',
      mediaUrl: sticker.previewUrl,
      stickerEmoji: sticker.emoji,
      createdAt: new Date().toISOString(),
      status: 'sent',
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        event: 'chat_message',
        match_id: matchId,
        content: sticker.emoji,
        image_url: sticker.previewUrl,
        message_type: 'sticker',
      }));
    } else {
      try {
        const { message } = await api.sendChatMessage(matchId, sticker.emoji, sticker.previewUrl, 'sticker');
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticMsg.id ? mapBackendMessage(message) : m)),
        );
      } catch (err) {
        console.error('Failed to send sticker message', err);
      }
    }
  };

  const react = async (id: string, reaction: MessageReaction) => {
    setMessages((items) =>
      items.map((item) => (item.id === id ? { ...item, reaction } : item)),
    );
    const numId = Number(id);
    if (numId) {
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          event: 'reaction',
          match_id: matchId,
          message_id: numId,
          reaction,
        }));
      } else {
        try {
          await api.reactMessage(numId, reaction);
        } catch (err) {
          console.error('Failed to save message reaction', err);
        }
      }
    }
  };

  const sendTyping = () => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        event: 'typing',
        match_id: matchId,
      }));
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
    isTyping,
    sendTyping,
    clear,
    sendText,
    sendImage,
    sendGif,
    sendVoice,
    sendSticker,
    react,
  };
}
