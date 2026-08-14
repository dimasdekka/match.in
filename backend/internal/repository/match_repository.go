package repository

import (
	"context"
	"fmt"

	"matchin-backend/internal/domain"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type SwipeRepository interface {
	RecordSwipe(ctx context.Context, swipe *domain.Swipe) error
	HasLikedBack(ctx context.Context, targetID uint, swiperID uint) (bool, error)
	ResetSwipes(ctx context.Context, swiperID uint) error
	DeleteAllSwipesForUser(ctx context.Context, userID uint) error
	GetLikesReceived(ctx context.Context, userID uint) ([]uint, error)
	GetLikesSent(ctx context.Context, userID uint) ([]uint, error)
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
	err := r.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "swiper_id"}, {Name: "target_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"action", "created_at"}),
	}).Create(swipe).Error
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

func (r *SwipeRepositoryImpl) ResetSwipes(ctx context.Context, swiperID uint) error {
	err := r.db.WithContext(ctx).Where("swiper_id = ?", swiperID).Delete(&domain.Swipe{}).Error
	if err != nil {
		return fmt.Errorf("failed to reset swipes for user %d: %w", swiperID, err)
	}
	return nil
}

func (r *SwipeRepositoryImpl) DeleteAllSwipesForUser(ctx context.Context, userID uint) error {
	err := r.db.WithContext(ctx).Where("swiper_id = ? OR target_id = ?", userID, userID).Delete(&domain.Swipe{}).Error
	if err != nil {
		return fmt.Errorf("failed to delete all swipes for user %d: %w", userID, err)
	}
	return nil
}

func (r *SwipeRepositoryImpl) GetLikesReceived(ctx context.Context, userID uint) ([]uint, error) {
	// Only return incoming likes from users that the current user has NOT swiped on yet
	var swipedByMeIDs []uint
	_ = r.db.WithContext(ctx).Model(&domain.Swipe{}).
		Where("swiper_id = ?", userID).
		Pluck("target_id", &swipedByMeIDs).Error

	var swiperIDs []uint
	query := r.db.WithContext(ctx).Model(&domain.Swipe{}).
		Where("target_id = ? AND action IN ('like', 'superlike')", userID)

	if len(swipedByMeIDs) > 0 {
		query = query.Where("swiper_id NOT IN ?", swipedByMeIDs)
	}

	err := query.Order("created_at DESC").Pluck("swiper_id", &swiperIDs).Error
	if err != nil {
		return nil, fmt.Errorf("failed to get incoming likes: %w", err)
	}
	return swiperIDs, nil
}

func (r *SwipeRepositoryImpl) GetLikesSent(ctx context.Context, userID uint) ([]uint, error) {
	var targetIDs []uint
	err := r.db.WithContext(ctx).Model(&domain.Swipe{}).
		Where("swiper_id = ? AND action IN ('like', 'superlike')", userID).
		Order("created_at DESC").
		Pluck("target_id", &targetIDs).Error
	if err != nil {
		return nil, fmt.Errorf("failed to get sent likes: %w", err)
	}
	return targetIDs, nil
}

type MatchRepository interface {
	CreateMatch(ctx context.Context, user1ID, user2ID uint) (*domain.Match, error)
	GetMatchesForUser(ctx context.Context, userID uint) ([]*domain.Match, error)
	GetByID(ctx context.Context, matchID uint) (*domain.Match, error)
	UnmatchByID(ctx context.Context, matchID uint, userID uint) error
	DeleteAllMatchesForUser(ctx context.Context, userID uint) error
}

func NewMatchRepository(db *gorm.DB) MatchRepository {
	return &matchRepository{db: db}
}

func (r *matchRepository) CreateMatch(ctx context.Context, user1ID, user2ID uint) (*domain.Match, error) {
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

func (r *matchRepository) GetByID(ctx context.Context, matchID uint) (*domain.Match, error) {
	var match domain.Match
	err := r.db.WithContext(ctx).First(&match, matchID).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to fetch match %d: %w", matchID, err)
	}
	return &match, nil
}

func (r *matchRepository) UnmatchByID(ctx context.Context, matchID uint, userID uint) error {
	result := r.db.WithContext(ctx).Model(&domain.Match{}).Where("id = ? AND (user1_id = ? OR user2_id = ?)", matchID, userID, userID).Update("is_active", false)
	if result.Error != nil {
		return fmt.Errorf("failed to unmatch %d: %w", matchID, result.Error)
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("match %d not found or not authorized", matchID)
	}
	return nil
}

func (r *matchRepository) DeleteAllMatchesForUser(ctx context.Context, userID uint) error {
	if err := r.db.WithContext(ctx).Where("user1_id = ? OR user2_id = ?", userID, userID).Delete(&domain.Match{}).Error; err != nil {
		return fmt.Errorf("failed to delete matches for user %d: %w", userID, err)
	}
	return nil
}
