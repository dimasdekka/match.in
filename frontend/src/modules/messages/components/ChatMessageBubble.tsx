import { useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import { MESSAGE_REACTIONS } from '../constants/media';
import type { MessageReaction, ConversationMessage } from '../@types';
const LABEL: Record<MessageReaction, string> = { heart: '❤️', laugh: '😂', fire: '🔥', like: '👍' };
const formatDuration = (seconds = 0) => `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, '0')}`;
const formatMessageTime = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export function ChatMessageBubble({
  message,
  onReact,
}: {
  message: ConversationMessage;
  onReact: (value: MessageReaction) => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [reactionOpen, setReactionOpen] = useState(false);
  const toggleAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) void audio.play(); else audio.pause();
  };

  return (
    <div className={`chat-message ${message.direction}${message.reaction ? ' has-reaction' : ''}`}>
      <div
        className={`bubble bubble-${message.type}`}
        onClick={() => setReactionOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') setReactionOpen(true);
        }}
      >
        {message.type === 'text' && message.content}
        {(message.type === 'image' || message.type === 'gif' || message.type === 'sticker') && (
          <img
            className={message.type === 'sticker' ? 'telegram-sticker' : ''}
            src={message.mediaUrl}
            alt={message.stickerEmoji ?? message.type}
          />
        )}
        {message.type === 'voice' && (
          <div className="voice-note">
            <button type="button" onClick={toggleAudio} aria-label={playing ? 'Pause voice note' : 'Play voice note'}>
              <Icon icon={playing ? 'solar:pause-bold' : 'solar:play-bold'} />
            </button>
            <span className="voice-wave" />
            <time>{formatDuration(message.duration)}</time>
            <audio ref={audioRef} src={message.mediaUrl} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} />
          </div>
        )}
        <span className="message-meta">
          {formatMessageTime(message.createdAt)}
          {message.direction === 'outgoing' && <Icon icon="solar:check-read-linear" />}
        </span>
      </div>
      {reactionOpen && <div className="message-reaction-picker is-open" role="toolbar" aria-label="Message reactions">
        {MESSAGE_REACTIONS.map((item) => (
          <button type="button" key={item} aria-label={`React with ${item}`} onClick={() => { onReact(item); setReactionOpen(false); }}>
            {LABEL[item]}
          </button>
        ))}
        <button className="reaction-close" type="button" aria-label="Close reactions" onClick={() => setReactionOpen(false)}>
          <Icon icon="solar:close-circle-bold" />
        </button>
      </div>}
      {message.reaction && <span className="message-reaction">{LABEL[message.reaction]}</span>}
    </div>
  );
}
