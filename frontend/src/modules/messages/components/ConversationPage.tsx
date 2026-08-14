import { useEffect, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import { motion } from 'motion/react';
import type { DiscoverProfile } from '@/modules/discover/@types';
import { useChat } from '../hooks/useChat';
import { ChatMediaPicker } from './ChatMediaPicker';
import { ChatMessageBubble } from './ChatMessageBubble';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { api } from '@/utils/api';
import { MatchedProfileDetail } from '@/modules/app-shell/components/MatchedProfileDetail';
import { compressImageFile } from '@/utils/imageCompressor';

interface Props { profile: DiscoverProfile; onBack: () => void }

export function ConversationPage({ profile, onBack }: Props) {
  const [draft, setDraft] = useState('');
  const [picker, setPicker] = useState<'sticker' | 'gif' | null>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const chat = useChat(String(profile.id));
  const recorder = useRef<MediaRecorder | null>(null);
  const recordingStartedAt = useRef(0);
  const [isRecording, setIsRecording] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const viewport = window.visualViewport;
    document.documentElement.classList.add('conversation-open');
    document.body.classList.add('conversation-open');
    const sync = () => {
      const height = viewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty('--chat-viewport-height', `${height}px`);
      document.documentElement.style.setProperty('--chat-viewport-offset-top', `${viewport?.offsetTop ?? 0}px`);
      document.documentElement.classList.toggle('chat-keyboard-open', height < window.innerHeight - 120);
      requestAnimationFrame(() => messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight }));
    };
    sync();
    viewport?.addEventListener('resize', sync);
    viewport?.addEventListener('scroll', sync);
    return () => {
      viewport?.removeEventListener('resize', sync);
      viewport?.removeEventListener('scroll', sync);
      document.documentElement.classList.remove('chat-keyboard-open');
      document.documentElement.style.removeProperty('--chat-viewport-height');
      document.documentElement.style.removeProperty('--chat-viewport-offset-top');
      document.documentElement.classList.remove('conversation-open');
      document.body.classList.remove('conversation-open');
    };
  }, []);

  const send = () => {
    if (!draft.trim()) return;
    chat.sendText(draft.trim());
    setDraft('');
  };

  const readAsDataUrl = (blob: Blob) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

  const toggleRecording = async () => {
    if (recorder.current?.state === 'recording') return recorder.current.stop();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: Blob[] = [];
      const mediaRecorder = new MediaRecorder(stream);
      recorder.current = mediaRecorder;
      recordingStartedAt.current = Date.now();
      mediaRecorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      mediaRecorder.onstop = async () => {
        const duration = Math.max(1, (Date.now() - recordingStartedAt.current) / 1000);
        chat.sendVoice(await readAsDataUrl(new Blob(chunks, { type: mediaRecorder.mimeType })), duration);
        stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
        recorder.current = null;
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      window.alert('Izin mikrofon diperlukan untuk mengirim pesan suara.');
    }
  };

  return (
    <motion.section className="chat-screen" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 320 }}>
      <header className="chat-header">
        <button type="button" onClick={onBack} aria-label="Back to messages"><Icon icon="solar:alt-arrow-left-linear" /></button>
        <button type="button" className="chat-profile-avatar" onClick={() => setProfileOpen(true)} aria-label={`View ${profile.name} profile`}><img src={profile.image} alt="" /></button>
        <button type="button" className="chat-profile-copy" onClick={() => setProfileOpen(true)}>
          <strong>{profile.name}</strong>
          <small className={chat.isTyping ? 'text-pink-400 font-bold animate-pulse' : ''}>
            {chat.isTyping ? 'Sedang mengetik...' : 'Online'}
          </small>
        </button>
        <button type="button" aria-label="Conversation menu" onClick={() => setMenuOpen(true)}><Icon icon="solar:menu-dots-bold" /></button>
      </header>
      <div className="chat-messages" ref={messagesRef}>
        <p className="chat-date">You matched today</p>
        {chat.messages.map((message) => <ChatMessageBubble key={message.id} message={message} onReact={(reaction) => chat.react(message.id, reaction)} />)}
      </div>
      {picker && <ChatMediaPicker mode={picker} onSticker={(item) => { chat.sendSticker(item); setPicker(null); }} onGif={(url) => { chat.sendGif(url); setPicker(null); }} />}
      <form className="chat-composer" onSubmit={(event) => { event.preventDefault(); send(); }}>
        <div className="chat-input-shell">
          <button type="button" onClick={() => setPicker(picker === 'sticker' ? null : 'sticker')} aria-label="Emoji and stickers"><Icon icon="solar:emoji-funny-square-linear" /></button>
          <input
            value={draft}
            onFocus={() => setPicker(null)}
            onChange={(event) => {
              setDraft(event.target.value);
              chat.sendTyping();
            }}
            placeholder="Send a message..."
          />
          <button type="button" onClick={() => imageInput.current?.click()} aria-label="Attach image"><Icon icon="solar:paperclip-2-linear" /></button>
          <button type="button" onClick={() => setPicker(picker === 'gif' ? null : 'gif')} aria-label="GIF"><b>GIF</b></button>
        </div>
        <input
          ref={imageInput}
          type="file"
          accept="image/*"
          hidden
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (file) {
              try {
                const compressed = await compressImageFile(file, 800, 0.75);
                chat.sendImage(compressed);
              } catch {
                chat.sendImage(await readAsDataUrl(file));
              }
            }
            event.target.value = '';
          }}
        />
        {draft.trim()
          ? <button className="chat-primary-action" type="submit" aria-label="Send"><Icon icon="solar:plain-2-bold" /></button>
          : <button className={`chat-primary-action ${isRecording ? 'recording' : ''}`} type="button" onClick={toggleRecording} aria-label={isRecording ? 'Stop and send voice note' : 'Record voice note'}><Icon icon={isRecording ? 'solar:stop-bold' : 'solar:microphone-3-bold'} /></button>}
      </form>
      <BottomSheet open={menuOpen} onOpenChange={setMenuOpen} title={profile.name} description="Conversation settings">
        <div className="conversation-menu-list">
          <button type="button" onClick={() => { setMenuOpen(false); setProfileOpen(true); }}><Icon icon="solar:user-circle-linear" /><span><strong>Lihat profil</strong><small>Lihat detail pengguna</small></span></button>
          <button type="button" onClick={() => { setMenuOpen(false); setPicker('gif'); }}><Icon icon="solar:gallery-wide-linear" /><span><strong>Media</strong><small>Lihat dan kirim media</small></span></button>
          <button type="button" onClick={() => { localStorage.setItem(`matchin:muted:${profile.id}`, 'true'); setMenuOpen(false); }}><Icon icon="solar:bell-off-linear" /><span><strong>Bisukan notifikasi</strong><small>Matikan notifikasi percakapan</small></span></button>
          <button type="button" onClick={async () => { if (confirm('Hapus semua isi chat?')) { try { await api.clearChat(profile.id); } catch {} chat.clear(); setMenuOpen(false); } }}><Icon icon="solar:trash-bin-minimalistic-linear" /><span><strong>Hapus isi chat</strong><small>Hapus pesan dari perangkat ini</small></span></button>
          <button type="button" className="danger" onClick={async () => { if (confirm(`Laporkan ${profile.name}?`)) { try { await api.reportUser(profile.id, 0, 'Reported from conversation'); } catch {} setMenuOpen(false); } }}><Icon icon="solar:danger-triangle-linear" /><span><strong>Laporkan</strong><small>Laporkan pengguna ini</small></span></button>
          <button type="button" className="danger" onClick={async () => { if (confirm(`Batalkan match dengan ${profile.name}?`)) { try { await api.unmatch(profile.id); } catch {} setMenuOpen(false); onBack(); } }}><Icon icon="solar:heart-broken-linear" /><span><strong>Batalkan match</strong><small>Akhiri koneksi ini</small></span></button>
        </div>
      </BottomSheet>
      {profileOpen && <MatchedProfileDetail profile={profile} onBack={() => setProfileOpen(false)} />}
    </motion.section>
  );
}
