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
}

func NewAccountService(
	userRepo repository.UserRepository,
	profileRepo repository.ProfileRepository,
) AccountService {
	return &accountService{
		userRepo:    userRepo,
		profileRepo: profileRepo,
	}
}

func (s *accountService) DeleteAccount(ctx context.Context, userID uint) error {
	if err := s.profileRepo.DeleteByUserID(ctx, userID); err != nil {
		return fmt.Errorf("failed to delete profile during account deletion: %w", err)
	}
	if err := s.userRepo.DeleteByID(ctx, userID); err != nil {
		return fmt.Errorf("failed to delete user during account deletion: %w", err)
	}
	return nil
}
