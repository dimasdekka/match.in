package service

import (
	"context"
	"fmt"
	"log"

	"matchin-backend/internal/domain"
	"matchin-backend/internal/repository"
)

type ChatService interface {
	SendMessage(ctx context.Context, senderID uint, matchID uint, content string, imageURL string) (*domain.ChatMessage, error)
	GetMessages(ctx context.Context, userID uint, matchID uint) ([]*domain.ChatMessage, error)
	GetConversations(ctx context.Context, userID uint) ([]*domain.Conversation, error)
	ClearChat(ctx context.Context, userID uint, matchID uint) error
}

type chatService struct {
	chatRepo    repository.ChatRepository
	matchRepo   repository.MatchRepository
	userRepo    repository.UserRepository
	profileRepo repository.ProfileRepository
}

func NewChatService(
	chatRepo repository.ChatRepository,
	matchRepo repository.MatchRepository,
	userRepo repository.UserRepository,
	profileRepo repository.ProfileRepository,
) ChatService {
	return &chatService{
		chatRepo:    chatRepo,
		matchRepo:   matchRepo,
		userRepo:    userRepo,
		profileRepo: profileRepo,
	}
}

func (s *chatService) SendMessage(ctx context.Context, senderID uint, matchID uint, content string, imageURL string) (*domain.ChatMessage, error) {
	match, err := s.matchRepo.GetByID(ctx, matchID)
	if err != nil || match == nil {
		return nil, fmt.Errorf("match not found or access denied")
	}

	var receiverID uint
	if match.User1ID == senderID {
		receiverID = match.User2ID
	} else if match.User2ID == senderID {
		receiverID = match.User1ID
	} else {
		return nil, fmt.Errorf("user is not part of this match")
	}

	msg := &domain.ChatMessage{
		MatchID:    matchID,
		SenderID:   senderID,
		ReceiverID: receiverID,
		Content:    content,
		ImageURL:   imageURL,
		IsRead:     false,
	}

	if err := s.chatRepo.CreateMessage(ctx, msg); err != nil {
		return nil, fmt.Errorf("failed to save message: %w", err)
	}

	return msg, nil
}

func (s *chatService) GetMessages(ctx context.Context, userID uint, matchID uint) ([]*domain.ChatMessage, error) {
	match, err := s.matchRepo.GetByID(ctx, matchID)
	if err != nil || match == nil {
		return nil, fmt.Errorf("match not found")
	}

	if match.User1ID != userID && match.User2ID != userID {
		return nil, fmt.Errorf("access denied to this chat")
	}

	_ = s.chatRepo.MarkAsRead(ctx, matchID, userID)

	messages, err := s.chatRepo.GetMessagesByMatchID(ctx, matchID, 100, 0)
	if err != nil {
		return nil, fmt.Errorf("failed to get messages: %w", err)
	}

	return messages, nil
}

func (s *chatService) GetConversations(ctx context.Context, userID uint) ([]*domain.Conversation, error) {
	matches, err := s.matchRepo.GetMatchesForUser(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch user matches: %w", err)
	}

	var conversations []*domain.Conversation
	for _, m := range matches {
		var matchedUserID uint
		if m.User1ID == userID {
			matchedUserID = m.User2ID
		} else {
			matchedUserID = m.User1ID
		}

		matchedUser, err := s.userRepo.GetByID(ctx, matchedUserID)
		if err != nil || matchedUser == nil {
			continue
		}

		matchedProfile, err := s.profileRepo.GetByUserID(ctx, matchedUserID)
		if err != nil || matchedProfile == nil {
			log.Printf("Warning: profile missing for matched user %d\n", matchedUserID)
		}

		lastMsg, _ := s.chatRepo.GetLastMessageByMatchID(ctx, m.ID)
		unreadCount, _ := s.chatRepo.GetUnreadCount(ctx, m.ID, userID)

		conversations = append(conversations, &domain.Conversation{
			MatchID:        m.ID,
			MatchedUser:    matchedUser,
			MatchedProfile: matchedProfile,
			LastMessage:    lastMsg,
			UnreadCount:    unreadCount,
			MatchedAt:      m.CreatedAt,
		})
	}

	return conversations, nil
}

func (s *chatService) ClearChat(ctx context.Context, userID uint, matchID uint) error {
	match, err := s.matchRepo.GetByID(ctx, matchID)
	if err != nil || match == nil {
		return fmt.Errorf("match not found")
	}
	if match.User1ID != userID && match.User2ID != userID {
		return fmt.Errorf("access denied")
	}
	if err := s.chatRepo.DeleteMessagesByMatchID(ctx, matchID); err != nil {
		return fmt.Errorf("failed to clear chat: %w", err)
	}
	return nil
}

