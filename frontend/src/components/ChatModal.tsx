import React, { useState } from 'react';
import { ArrowLeft, MoreHorizontal, Paperclip, Mic, Send, CheckCheck } from 'lucide-react';
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
  const matchedAvatar = photos[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80';

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col max-w-md mx-auto animate-fade-in">
      {/* Screen 4 Header */}
      <header className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-white/95 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="relative">
              <img
                src={matchedAvatar}
                alt={matchedProfile.name}
                className="w-10 h-10 rounded-full object-cover border border-pink-100"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900">{matchedProfile.name}</h3>
              <p className="text-[10px] text-emerald-500 font-semibold">Online</p>
            </div>
          </div>
        </div>

        <button className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-700">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </header>

      {/* Screen 4 Message History */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              {msg.image ? (
                <div className="max-w-[75%] rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                  <img src={msg.image} alt="Attachment" className="w-full h-44 object-cover" />
                  <div className="p-1.5 bg-slate-900/60 text-right text-[10px] text-slate-300">
                    {msg.time}
                  </div>
                </div>
              ) : (
                <div
                  className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-xs font-normal leading-relaxed shadow-xs ${
                    isUser
                      ? 'bg-pink-100 text-slate-900 border border-pink-200/80 rounded-br-none'
                      : 'bg-white text-slate-900 border border-slate-200/80 rounded-bl-none'
                  }`}
                >
                  <p>{msg.text}</p>
                  <div className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${isUser ? 'text-pink-600' : 'text-slate-400'}`}>
                    <span>{msg.time}</span>
                    {isUser && <CheckCheck className="w-3 h-3 text-pink-600" />}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Screen 4 Input Bar */}
      <div className="p-3 border-t border-slate-100 bg-white flex items-center gap-2">
        <button className="p-2 text-slate-400 hover:text-slate-600 transition">
          <Paperclip className="w-5 h-5" />
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2.5 rounded-full bg-slate-100 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-300"
        />

        {inputText.trim() ? (
          <button
            onClick={handleSendMessage}
            className="w-10 h-10 rounded-full match-gradient text-white flex items-center justify-center match-shadow-btn active:scale-95 transition"
          >
            <Send className="w-4 h-4 fill-white" />
          </button>
        ) : (
          <button className="w-10 h-10 rounded-full match-gradient text-white flex items-center justify-center match-shadow-btn active:scale-95 transition">
            <Mic className="w-5 h-5 fill-white" />
          </button>
        )}
      </div>
    </div>
  );
};
