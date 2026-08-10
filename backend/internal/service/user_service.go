package service

import (
	"context"
	"fmt"

	"matchin-backend/internal/domain"
	"matchin-backend/internal/repository"
)

type UserService interface {
	GetUserByID(ctx context.Context, id uint) (*domain.User, error)
	GetByTelegramID(ctx context.Context, telegramID int64) (*domain.User, error)
	CreateOrUpdate(ctx context.Context, user *domain.User) error
	UpdateLanguage(ctx context.Context, userID uint, lang string) error
}

type userService struct {
	userRepo repository.UserRepository
}

func NewUserService(userRepo repository.UserRepository) UserService {
	return &userService{userRepo: userRepo}
}

func (s *userService) GetUserByID(ctx context.Context, id uint) (*domain.User, error) {
	user, err := s.userRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get user by id %d: %w", id, err)
	}
	return user, nil
}

func (s *userService) GetByTelegramID(ctx context.Context, telegramID int64) (*domain.User, error) {
	user, err := s.userRepo.GetByTelegramID(ctx, telegramID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user by telegram id %d: %w", telegramID, err)
	}
	return user, nil
}

func (s *userService) CreateOrUpdate(ctx context.Context, user *domain.User) error {
	if err := s.userRepo.CreateOrUpdate(ctx, user); err != nil {
		return fmt.Errorf("failed to create or update user %d: %w", user.TelegramID, err)
	}
	return nil
}

func (s *userService) UpdateLanguage(ctx context.Context, userID uint, lang string) error {
	if err := s.userRepo.UpdateLanguage(ctx, userID, lang); err != nil {
		return fmt.Errorf("failed to update language for user %d: %w", userID, err)
	}
	return nil
}
