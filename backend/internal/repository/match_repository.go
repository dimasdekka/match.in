package repository

import (
	"context"
	"fmt"

	"matchin-backend/internal/domain"
	"gorm.io/gorm"
)

type SwipeRepository interface {
	RecordSwipe(ctx context.Context, swipe *domain.Swipe) error
	HasLikedBack(ctx context.Context, targetID uint, swiperID uint) (bool, error)
}

type matchRepository struct {
	db *gorm.DB
}

type SwipeRepositoryImpl struct {
	db *gorm.DB
}

func NewSwipeRepository(db *gorm.DB) SwipeRepository {
	return &SwipeRepositoryImpl{db: db}
}

func (r *SwipeRepositoryImpl) RecordSwipe(ctx context.Context, swipe *domain.Swipe) error {
	err := r.db.WithContext(ctx).Save(swipe).Error
	if err != nil {
		return fmt.Errorf("failed to record swipe: %w", err)
	}
	return nil
}

func (r *SwipeRepositoryImpl) HasLikedBack(ctx context.Context, targetID uint, swiperID uint) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&domain.Swipe{}).
		Where("swiper_id = ? AND target_id = ? AND action IN ('like', 'superlike')", targetID, swiperID).
		Count(&count).Error
	if err != nil {
		return false, fmt.Errorf("failed to check if target liked back: %w", err)
	}
	return count > 0, nil
}

type MatchRepository interface {
	CreateMatch(ctx context.Context, user1ID, user2ID uint) (*domain.Match, error)
	GetMatchesForUser(ctx context.Context, userID uint) ([]*domain.Match, error)
}

func NewMatchRepository(db *gorm.DB) MatchRepository {
	return &matchRepository{db: db}
}

func (r *matchRepository) CreateMatch(ctx context.Context, user1ID, user2ID uint) (*domain.Match, error) {
	// Sort IDs so user1ID < user2ID to maintain uniqueness constraint
	u1, u2 := user1ID, user2ID
	if u1 > u2 {
		u1, u2 = u2, u1
	}

	match := &domain.Match{
		User1ID:  u1,
		User2ID:  u2,
		IsActive: true,
	}

	if err := r.db.WithContext(ctx).Save(match).Error; err != nil {
		return nil, fmt.Errorf("failed to save match: %w", err)
	}

	return match, nil
}

func (r *matchRepository) GetMatchesForUser(ctx context.Context, userID uint) ([]*domain.Match, error) {
	var matches []*domain.Match
	err := r.db.WithContext(ctx).Preload("User1").Preload("User2").
		Where("(user1_id = ? OR user2_id = ?) AND is_active = ?", userID, userID, true).
		Order("created_at DESC").Find(&matches).Error
	if err != nil {
		return nil, fmt.Errorf("failed to get matches for user %d: %w", userID, err)
	}
	return matches, nil
}
