import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, MoreHorizontal, Paperclip, Send } from 'lucide-react';
import type { Profile, ChatMessage } from '../types';
import { api } from '../services/api';

interface ChatModalProps {
  matchedProfile: Profile;
  onClose: () => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({ matchedProfile, onClose }) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserID, setCurrentUserID] = useState<number | null>(null);

  const matchID = matchedProfile.match_id || 0;

  // Load User & Chat Messages
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const meRes = await api.getMe();
        setCurrentUserID(meRes.user.id);

        if (matchID) {
          const res = await api.getChatMessages(matchID);
          setMessages(res.messages || []);
        }
      } catch (e) {
        console.error('Failed to load chat messages', e);
      } finally {
        setLoading(false);
      }
    };

    fetchInitial();

    // Poll every 3 seconds for new messages
    const interval = setInterval(async () => {
      if (matchID) {
        try {
          const res = await api.getChatMessages(matchID);
          setMessages(res.messages || []);
        } catch (e) {
          // silent fail on background poll
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [matchID]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !matchID) return;
    const textToSend = inputText.trim();
    setInputText('');

    try {
      const res = await api.sendChatMessage(matchID, textToSend);
      if (res.message) {
        setMessages((prev) => [...prev, res.message]);
      }
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  // Parse matched photo
  let photos: string[] = [];
  try {
    photos = typeof matchedProfile.photos === 'string' ? JSON.parse(matchedProfile.photos) : matchedProfile.photos || [];
  } catch {
    photos = [];
  }
  const matchedAvatar = photos[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=128&h=128&q=80';

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col max-w-md mx-auto">

      {/* ── Header ── */}
      <header className="px-3 py-3 flex items-center justify-between bg-white border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-3">
          {/* Back Arrow */}
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 active:scale-95 transition cursor-pointer"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Avatar + Name + Online */}
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <img
                src={matchedAvatar}
                alt={matchedProfile.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">{matchedProfile.name}</h3>
              <p className="text-[11px] text-emerald-500 font-medium leading-tight">Online</p>
            </div>
          </div>
        </div>

        {/* More Options */}
        <button className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 active:scale-95 transition">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </header>

      {/* ── Messages Area ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-white">
        {loading ? (
          <div className="flex items-center justify-center h-full text-xs text-slate-400">
            Memuat obrolan...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-2 text-slate-400">
            <div className="w-12 h-12 rounded-full bg-pink-50 flex items-center justify-center text-[#FF3366] font-bold text-lg">
              💬
            </div>
            <p className="text-xs font-semibold text-slate-600">Belum ada pesan</p>
            <p className="text-[11px]">Kirim pesan pertama untuk memulai obrolan dengan {matchedProfile.name}!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.sender_id === currentUserID;
            const timeStr = msg.created_at
              ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '';

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                {/* Image Message */}
                {msg.image_url && (
                  <div className="max-w-[70%] mb-1">
                    <div className="rounded-2xl overflow-hidden shadow-sm">
                      <img
                        src={msg.image_url}
                        alt="Shared attachment"
                        className="w-full h-auto object-cover"
                        style={{ maxHeight: '200px' }}
                      />
                    </div>
                  </div>
                )}

                {/* Text Message */}
                {msg.content && (
                  <div className="max-w-[75%]">
                    <div
                      className={`px-4 py-2.5 text-[13px] leading-relaxed ${
                        isUser
                          ? 'bg-[#FF3366] text-white rounded-2xl rounded-br-md shadow-sm'
                          : 'bg-slate-100 text-slate-900 rounded-2xl rounded-bl-md'
                      }`}
                    >
                      {msg.content}
                    </div>
                    {/* Timestamp below bubble */}
                    <div className={`flex items-center gap-1 mt-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-[10px] text-slate-400">{timeStr}</span>
                      {isUser && (
                        <svg className="w-3.5 h-3.5 text-pink-500" viewBox="0 0 16 16" fill="none">
                          <path d="M1.5 8.5L5 12L10.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M5.5 8.5L9 12L14.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input Bar ── */}
      <div className="px-3 py-3 border-t border-slate-100 bg-white flex items-center gap-2 shrink-0">
        {/* Attachment */}
        <button className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
          <Paperclip className="w-5 h-5" />
        </button>

        {/* Text Input */}
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Ketik pesan..."
          className="flex-1 px-4 py-2.5 rounded-full bg-slate-100 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-slate-50 focus:ring-1 focus:ring-pink-200 transition"
        />

        {/* Send Button */}
        <button
          onClick={handleSendMessage}
          disabled={!inputText.trim()}
          className="w-10 h-10 rounded-full match-gradient text-white flex items-center justify-center match-shadow-btn active:scale-90 disabled:opacity-40 transition cursor-pointer"
        >
          <Send className="w-4.5 h-4.5 fill-white" />
        </button>
      </div>
    </div>
  );
};
