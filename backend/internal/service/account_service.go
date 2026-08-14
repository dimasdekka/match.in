package service

import (
	"context"
	"fmt"

	"matchin-backend/internal/repository"
)

type AccountService interface {
	DeleteAccount(ctx context.Context, userID uint) error
}

type accountService struct {
	userRepo    repository.UserRepository
	profileRepo repository.ProfileRepository
	swipeRepo   repository.SwipeRepository
	matchRepo   repository.MatchRepository
	chatRepo    repository.ChatRepository
}

func NewAccountService(
	userRepo repository.UserRepository,
	profileRepo repository.ProfileRepository,
	swipeRepo repository.SwipeRepository,
	matchRepo repository.MatchRepository,
	chatRepo repository.ChatRepository,
) AccountService {
	return &accountService{
		userRepo:    userRepo,
		profileRepo: profileRepo,
		swipeRepo:   swipeRepo,
		matchRepo:   matchRepo,
		chatRepo:    chatRepo,
	}
}

func (s *accountService) DeleteAccount(ctx context.Context, userID uint) error {
	// 1. Delete all chat messages where user was sender or receiver
	if s.chatRepo != nil {
		_ = s.chatRepo.DeleteAllMessagesForUser(ctx, userID)
	}

	// 2. Delete all matches involving user
	if s.matchRepo != nil {
		_ = s.matchRepo.DeleteAllMatchesForUser(ctx, userID)
	}

	// 3. Delete all swipes sent or received by user
	if s.swipeRepo != nil {
		_ = s.swipeRepo.DeleteAllSwipesForUser(ctx, userID)
	}

	// 4. Delete user profile
	if s.profileRepo != nil {
		if err := s.profileRepo.DeleteByUserID(ctx, userID); err != nil {
			return fmt.Errorf("failed to delete profile during account deletion: %w", err)
		}
	}

	// 5. Delete user record
	if s.userRepo != nil {
		if err := s.userRepo.DeleteByID(ctx, userID); err != nil {
			return fmt.Errorf("failed to delete user during account deletion: %w", err)
		}
	}

	return nil
}
