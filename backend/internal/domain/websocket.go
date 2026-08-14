package domain

import "time"

type WSEventType string

const (
	WSEventChatMessage   WSEventType = "chat_message"
	WSEventTyping        WSEventType = "typing"
	WSEventReadReceipt   WSEventType = "read_receipt"
	WSEventReaction      WSEventType = "reaction"
	WSEventMatchNotify   WSEventType = "match_notification"
	WSEventPing          WSEventType = "ping"
	WSEventPong          WSEventType = "pong"
)

type WSMessage struct {
	Event       WSEventType  `json:"event"`
	MatchID     uint         `json:"match_id,omitempty"`
	SenderID    uint         `json:"sender_id,omitempty"`
	ReceiverID  uint         `json:"receiver_id,omitempty"`
	Content     string       `json:"content,omitempty"`
	ImageURL    string       `json:"image_url,omitempty"`
	MessageType string       `json:"message_type,omitempty"`
	Reaction    string       `json:"reaction,omitempty"`
	MessageID   uint         `json:"message_id,omitempty"`
	Message     *ChatMessage `json:"message,omitempty"`
	Timestamp   time.Time    `json:"timestamp,omitempty"`
}
