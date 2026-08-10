import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, MoreHorizontal, Paperclip, Mic, Send } from 'lucide-react';
import type { Profile } from '../types';

interface ChatModalProps {
  matchedProfile: Profile;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'match';
  text?: string;
  image?: string;
  time: string;
}

export const ChatModal: React.FC<ChatModalProps> = ({ matchedProfile, onClose }) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'match',
      text: 'Hey! Your travel photos are amazing 😍',
      time: '10:30',
    },
    {
      id: '2',
      sender: 'user',
      text: 'Thank you! I love exploring new places ✈️',
      time: '10:31',
    },
    {
      id: '3',
      sender: 'match',
      text: "Where's your favorite place you've visited?",
      time: '10:32',
    },
    {
      id: '4',
      sender: 'match',
      image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80',
      time: '10:33',
    },
    {
      id: '5',
      sender: 'user',
      text: 'Cappadocia! It was absolutely stunning 😍',
      time: '10:34',
    },
  ]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
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
            className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 active:scale-95 transition"
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
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-white">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              {/* Image Message */}
              {msg.image && (
                <div className="max-w-[70%]">
                  <div className="rounded-2xl overflow-hidden shadow-sm">
                    <img
                      src={msg.image}
                      alt="Shared photo"
                      className="w-full h-auto object-cover"
                      style={{ maxHeight: '200px' }}
                    />
                  </div>
                  <p className={`text-[10px] mt-1 ${isUser ? 'text-right text-slate-400' : 'text-left text-slate-400'}`}>
                    {msg.time}
                  </p>
                </div>
              )}

              {/* Text Message */}
              {msg.text && (
                <div className="max-w-[75%]">
                  <div
                    className={`px-4 py-2.5 text-[13px] leading-relaxed ${
                      isUser
                        ? 'bg-pink-100 text-slate-900 rounded-2xl rounded-br-md'
                        : 'bg-slate-100 text-slate-900 rounded-2xl rounded-bl-md'
                    }`}
                  >
                    {msg.text}
                  </div>
                  {/* Timestamp below bubble */}
                  <div className={`flex items-center gap-1 mt-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-[10px] text-slate-400">{msg.time}</span>
                    {isUser && (
                      <svg className="w-3.5 h-3.5 text-pink-400" viewBox="0 0 16 16" fill="none">
                        <path d="M1.5 8.5L5 12L10.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M5.5 8.5L9 12L14.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
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
          placeholder="Type a message..."
          className="flex-1 px-4 py-2.5 rounded-full bg-slate-100 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-slate-50 focus:ring-1 focus:ring-pink-200 transition"
        />

        {/* Send / Mic Button */}
        {inputText.trim() ? (
          <button
            onClick={handleSendMessage}
            className="w-10 h-10 rounded-full match-gradient text-white flex items-center justify-center match-shadow-btn active:scale-90 transition"
          >
            <Send className="w-4.5 h-4.5 fill-white" />
          </button>
        ) : (
          <button className="w-10 h-10 rounded-full match-gradient text-white flex items-center justify-center match-shadow-btn active:scale-90 transition">
            <Mic className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};
