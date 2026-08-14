package domain

import "time"

type ChatMessage struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	MatchID     uint      `json:"match_id" gorm:"not null;index"`
	SenderID    uint      `json:"sender_id" gorm:"not null"`
	ReceiverID  uint      `json:"receiver_id" gorm:"not null"`
	Content     string    `json:"content" gorm:"type:text;not null"`
	ImageURL    string    `json:"image_url,omitempty" gorm:"type:text"`
	MessageType string    `json:"message_type,omitempty" gorm:"default:'text'"` // text, image, voice, sticker, gif
	Reaction    string    `json:"reaction,omitempty"`                           // heart, laugh, fire, like
	IsRead      bool      `json:"is_read" gorm:"default:false"`
	CreatedAt   time.Time `json:"created_at"`
}

type ChatMessageRequest struct {
	Content     string `json:"content"`
	ImageURL    string `json:"image_url,omitempty"`
	MessageType string `json:"message_type,omitempty"`
	Reaction    string `json:"reaction,omitempty"`
}

type Conversation struct {
	MatchID        uint         `json:"match_id"`
	MatchedUser    *User        `json:"matched_user"`
	MatchedProfile *Profile     `json:"matched_profile"`
	LastMessage    *ChatMessage `json:"last_message"`
	UnreadCount    int64        `json:"unread_count"`
	MatchedAt      time.Time    `json:"matched_at"`
}
