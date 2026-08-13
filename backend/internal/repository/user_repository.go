package repository

import (
	"context"
	"fmt"

	"matchin-backend/internal/domain"
	"gorm.io/gorm"
)

type UserRepository interface {
	GetByTelegramID(ctx context.Context, telegramID int64) (*domain.User, error)
	GetByID(ctx context.Context, id uint) (*domain.User, error)
	CreateOrUpdate(ctx context.Context, user *domain.User) error
	UpdateLanguage(ctx context.Context, userID uint, lang string) error
	DeleteByID(ctx context.Context, userID uint) error
}

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) GetByTelegramID(ctx context.Context, telegramID int64) (*domain.User, error) {
	var user domain.User
	err := r.db.WithContext(ctx).Where("telegram_id = ?", telegramID).First(&user).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get user by telegram id %d: %w", telegramID, err)
	}
	return &user, nil
}

func (r *userRepository) GetByID(ctx context.Context, id uint) (*domain.User, error) {
	var user domain.User
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&user).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get user by id %d: %w", id, err)
	}
	return &user, nil
}

func (r *userRepository) CreateOrUpdate(ctx context.Context, user *domain.User) error {
	var existing domain.User
	err := r.db.WithContext(ctx).Where("telegram_id = ?", user.TelegramID).First(&existing).Error
	if err == gorm.ErrRecordNotFound {
		if createErr := r.db.WithContext(ctx).Create(user).Error; createErr != nil {
			return fmt.Errorf("failed to create user: %w", createErr)
		}
		return nil
	} else if err != nil {
		return fmt.Errorf("failed to query existing user: %w", err)
	}

	user.ID = existing.ID
	if user.Username != "" {
		existing.Username = user.Username
	}
	if user.FirstName != "" {
		existing.FirstName = user.FirstName
	}
	if user.LastName != "" {
		existing.LastName = user.LastName
	}

	if updateErr := r.db.WithContext(ctx).Save(&existing).Error; updateErr != nil {
		return fmt.Errorf("failed to update user: %w", updateErr)
	}

	*user = existing
	return nil
}

func (r *userRepository) UpdateLanguage(ctx context.Context, userID uint, lang string) error {
	if err := r.db.WithContext(ctx).Model(&domain.User{}).Where("id = ?", userID).Update("language_code", lang).Error; err != nil {
		return fmt.Errorf("failed to update language for user %d: %w", userID, err)
	}
	return nil
}

func (r *userRepository) DeleteByID(ctx context.Context, userID uint) error {
	if err := r.db.WithContext(ctx).Delete(&domain.User{}, userID).Error; err != nil {
		return fmt.Errorf("failed to delete user %d: %w", userID, err)
	}
	return nil
}
