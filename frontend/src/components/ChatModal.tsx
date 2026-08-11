import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, MoreHorizontal, Paperclip, Send, Eye, Image as ImageIcon, X } from 'lucide-react';
import type { Profile, ChatMessage } from '../types';
import { api } from '../services/api';
import { compressImageFile } from '../utils/imageCompressor';

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

  // Photo attachment & View Once states
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [isViewOnce, setIsViewOnce] = useState<boolean>(false);
  const [viewOnceOpenedIds, setViewOnceOpenedIds] = useState<Record<number, boolean>>({});
  const [previewModalImage, setPreviewModalImage] = useState<string | null>(null);

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
  }, [messages, pendingImage]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, 800, 800, 0.7);
        setPendingImage(compressed);
      } catch (err) {
        alert('Gagal memuat gambar');
      }
    }
  };

  const handleSendMessage = async () => {
    if ((!inputText.trim() && !pendingImage) || !matchID) return;
    const textToSend = inputText.trim();
    const imageToSend = pendingImage;
    const viewOnceFlag = isViewOnce;

    setInputText('');
    setPendingImage(null);
    setIsViewOnce(false);

    try {
      // Send message via API
      let contentToSend = textToSend;
      if (viewOnceFlag) {
        contentToSend = contentToSend ? `[VIEW_ONCE] ${contentToSend}` : '[VIEW_ONCE] 👁️ Foto Sekali Lihat';
      }

      const res = await api.sendChatMessage(matchID, contentToSend || (imageToSend ? '📷 Foto' : ''));
      if (res.message) {
        // If image was attached, append local image data
        const msgWithImg = {
          ...res.message,
          image_url: imageToSend || res.message.image_url,
          is_view_once: viewOnceFlag,
        };
        setMessages((prev) => [...prev, msgWithImg]);
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
    <div className="fixed inset-0 z-50 bg-white flex flex-col max-w-md mx-auto overflow-hidden">

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
                className="w-10 h-10 rounded-full object-cover border border-slate-100 shadow-xs"
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
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50/50">
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

            const isViewOnceMsg = (msg as any).is_view_once || msg.content?.includes('[VIEW_ONCE]');
            const isOpened = viewOnceOpenedIds[msg.id];
            const cleanContent = msg.content?.replace('[VIEW_ONCE]', '').trim();

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full`}
              >
                {/* View Once Photo Message */}
                {isViewOnceMsg ? (
                  <div className="max-w-[80%] mb-1">
                    {isOpened ? (
                      <div className="px-3.5 py-2.5 rounded-2xl bg-slate-200 text-slate-600 text-xs font-semibold flex items-center gap-2 border border-slate-300">
                        <Eye className="w-4 h-4 text-slate-400" />
                        <span>Foto telah dilihat</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          if (msg.image_url) {
                            setPreviewModalImage(msg.image_url);
                          } else {
                            alert('Foto sekali lihat');
                          }
                          setViewOnceOpenedIds((prev) => ({ ...prev, [msg.id]: true }));
                        }}
                        className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold flex items-center gap-2 shadow-md active:scale-95 transition"
                      >
                        <Eye className="w-4 h-4 text-white animate-pulse" />
                        <span>👁️ Foto Sekali Lihat (Ketuk untuk membuka)</span>
                      </button>
                    )}
                  </div>
                ) : (
                  /* Standard Image Attachment */
                  msg.image_url && (
                    <div className="max-w-[80%] mb-1">
                      <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-100">
                        <img
                          src={msg.image_url}
                          alt="Attachment"
                          className="w-full h-auto object-cover max-h-56"
                        />
                      </div>
                    </div>
                  )
                )}

                {/* Text Message Bubble (Wrap text cleanly, no horizontal scroll) */}
                {cleanContent && cleanContent !== '📷 Foto' && (
                  <div className="max-w-[80%]">
                    <div
                      className={`px-4 py-2.5 text-[13px] leading-relaxed break-words whitespace-pre-wrap overflow-hidden ${
                        isUser
                          ? 'match-gradient text-white rounded-2xl rounded-br-md shadow-sm'
                          : 'bg-white text-slate-900 border border-slate-200/80 rounded-2xl rounded-bl-md shadow-2xs'
                      }`}
                    >
                      {cleanContent}
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

      {/* ── Pending Attachment Preview Bar ── */}
      {pendingImage && (
        <div className="px-4 py-2 bg-pink-50 border-t border-pink-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={pendingImage} alt="Preview" className="w-10 h-10 rounded-lg object-cover border border-pink-200" />
            <div>
              <p className="text-xs font-bold text-slate-900">Gambar Terlampir</p>
              <button
                type="button"
                onClick={() => setIsViewOnce(!isViewOnce)}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition ${
                  isViewOnce ? 'bg-pink-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {isViewOnce ? '👁️ Sekali Lihat (Aktif)' : '👁️ Ketuk utk Sekali Lihat'}
              </button>
            </div>
          </div>
          <button
            onClick={() => setPendingImage(null)}
            className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center hover:bg-red-500 hover:text-white transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Input Bar ── */}
      <div className="px-3 py-3 border-t border-slate-100 bg-white flex items-center gap-2 shrink-0">
        {/* Attachment Button */}
        <label className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-[#FF3366] hover:bg-pink-50 transition cursor-pointer active:scale-95">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Paperclip className="w-5 h-5" />
        </label>

        {/* Text Input */}
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Ketik pesan..."
          className="flex-1 px-4 py-2.5 rounded-full bg-slate-100 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-slate-50 focus:ring-1 focus:ring-pink-300 transition"
        />

        {/* Send Button */}
        <button
          onClick={handleSendMessage}
          disabled={!inputText.trim() && !pendingImage}
          className="w-10 h-10 rounded-full match-gradient text-white flex items-center justify-center match-shadow-btn active:scale-90 disabled:opacity-40 transition cursor-pointer"
        >
          <Send className="w-4 h-4 fill-white" />
        </button>
      </div>

      {/* ── View Once Image Modal Overlay ── */}
      {previewModalImage && (
        <div className="fixed inset-0 z-60 bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="relative max-w-sm w-full bg-black rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center">
            <div className="absolute top-3 right-3 z-10">
              <button
                onClick={() => setPreviewModalImage(null)}
                className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/40 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img src={previewModalImage} alt="View once" className="w-full h-auto max-h-[70vh] object-contain" />
            <div className="p-4 bg-slate-900 w-full text-center text-xs text-slate-300 font-semibold flex items-center justify-center gap-1.5">
              <Eye className="w-4 h-4 text-pink-500" />
              <span>Foto Sekali Lihat — Akan hilang setelah ditutup</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
