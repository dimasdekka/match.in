package repository

import (
	"context"
	"fmt"

	"matchin-backend/internal/domain"

	"gorm.io/gorm"
)

type ChatRepository interface {
	CreateMessage(ctx context.Context, msg *domain.ChatMessage) error
	GetMessagesByMatchID(ctx context.Context, matchID uint, limit int, offset int) ([]*domain.ChatMessage, error)
	GetLastMessageByMatchID(ctx context.Context, matchID uint) (*domain.ChatMessage, error)
	GetUnreadCount(ctx context.Context, matchID uint, receiverID uint) (int64, error)
	MarkAsRead(ctx context.Context, matchID uint, receiverID uint) error
	DeleteMessagesByMatchID(ctx context.Context, matchID uint) error
}

type chatRepository struct {
	db *gorm.DB
}

func NewChatRepository(db *gorm.DB) ChatRepository {
	return &chatRepository{db: db}
}

func (r *chatRepository) CreateMessage(ctx context.Context, msg *domain.ChatMessage) error {
	if err := r.db.WithContext(ctx).Create(msg).Error; err != nil {
		return fmt.Errorf("failed to create chat message: %w", err)
	}
	return nil
}

func (r *chatRepository) GetMessagesByMatchID(ctx context.Context, matchID uint, limit int, offset int) ([]*domain.ChatMessage, error) {
	var messages []*domain.ChatMessage
	err := r.db.WithContext(ctx).
		Where("match_id = ?", matchID).
		Order("created_at ASC").
		Limit(limit).
		Offset(offset).
		Find(&messages).Error
	if err != nil {
		return nil, fmt.Errorf("failed to fetch chat messages for match %d: %w", matchID, err)
	}
	return messages, nil
}

func (r *chatRepository) GetLastMessageByMatchID(ctx context.Context, matchID uint) (*domain.ChatMessage, error) {
	var msg domain.ChatMessage
	err := r.db.WithContext(ctx).
		Where("match_id = ?", matchID).
		Order("created_at DESC").
		First(&msg).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to fetch last message for match %d: %w", matchID, err)
	}
	return &msg, nil
}

func (r *chatRepository) GetUnreadCount(ctx context.Context, matchID uint, receiverID uint) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&domain.ChatMessage{}).
		Where("match_id = ? AND receiver_id = ? AND is_read = ?", matchID, receiverID, false).
		Count(&count).Error
	if err != nil {
		return 0, fmt.Errorf("failed to count unread messages: %w", err)
	}
	return count, nil
}

func (r *chatRepository) MarkAsRead(ctx context.Context, matchID uint, receiverID uint) error {
	err := r.db.WithContext(ctx).
		Model(&domain.ChatMessage{}).
		Where("match_id = ? AND receiver_id = ? AND is_read = ?", matchID, receiverID, false).
		Update("is_read", true).Error
	if err != nil {
		return fmt.Errorf("failed to mark messages as read: %w", err)
	}
	return nil
}

func (r *chatRepository) DeleteMessagesByMatchID(ctx context.Context, matchID uint) error {
	if err := r.db.WithContext(ctx).Where("match_id = ?", matchID).Delete(&domain.ChatMessage{}).Error; err != nil {
		return fmt.Errorf("failed to delete messages for match %d: %w", matchID, err)
	}
	return nil
}
