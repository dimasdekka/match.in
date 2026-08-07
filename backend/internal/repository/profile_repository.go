package repository

import (
	"context"
	"fmt"

	"matchin-backend/internal/domain"
	"gorm.io/gorm"
)

type ProfileRepository interface {
	GetByUserID(ctx context.Context, userID uint) (*domain.Profile, error)
	Upsert(ctx context.Context, profile *domain.Profile) error
	GetRecommendations(ctx context.Context, currentUserID uint, currentProfile *domain.Profile, limit int) ([]*domain.Profile, error)
}

type profileRepository struct {
	db *gorm.DB
}

func NewProfileRepository(db *gorm.DB) ProfileRepository {
	return &profileRepository{db: db}
}

func (r *profileRepository) GetByUserID(ctx context.Context, userID uint) (*domain.Profile, error) {
	var profile domain.Profile
	err := r.db.WithContext(ctx).Preload("User").Where("user_id = ?", userID).First(&profile).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get profile for user %d: %w", userID, err)
	}
	return &profile, nil
}

func (r *profileRepository) Upsert(ctx context.Context, profile *domain.Profile) error {
	var existing domain.Profile
	err := r.db.WithContext(ctx).Where("user_id = ?", profile.UserID).First(&existing).Error
	if err == gorm.ErrRecordNotFound {
		if createErr := r.db.WithContext(ctx).Create(profile).Error; createErr != nil {
			return fmt.Errorf("failed to create profile: %w", createErr)
		}
		return nil
	} else if err != nil {
		return fmt.Errorf("failed to query profile: %w", err)
	}

	profile.ID = existing.ID
	if err := r.db.WithContext(ctx).Model(&existing).Updates(profile).Error; err != nil {
		return fmt.Errorf("failed to update profile: %w", err)
	}
	return nil
}

func (r *profileRepository) GetRecommendations(ctx context.Context, currentUserID uint, currentProfile *domain.Profile, limit int) ([]*domain.Profile, error) {
	// Exclude already swiped profiles
	var swipedTargetIDs []uint
	r.db.WithContext(ctx).Model(&domain.Swipe{}).Where("swiper_id = ?", currentUserID).Pluck("target_id", &swipedTargetIDs)

	query := r.db.WithContext(ctx).Preload("User").Where("user_id != ?", currentUserID)

	if len(swipedTargetIDs) > 0 {
		query = query.Where("user_id NOT IN ?", swipedTargetIDs)
	}

	// Filter by Target Gender
	if currentProfile.TargetGender != domain.GenderAll {
		query = query.Where("gender = ?", currentProfile.TargetGender)
	}

	// Filter by Age Range
	if currentProfile.MinAgePref > 0 && currentProfile.MaxAgePref > 0 {
		query = query.Where("age >= ? AND age <= ?", currentProfile.MinAgePref, currentProfile.MaxAgePref)
	}

	// Filter by Location Mode
	switch currentProfile.TargetLocationMode {
	case domain.FilterCity:
		if currentProfile.City != "" {
			query = query.Where("LOWER(city) = LOWER(?) AND LOWER(country) = LOWER(?)", currentProfile.City, currentProfile.Country)
		}
	case domain.FilterCountry:
		if currentProfile.Country != "" {
			query = query.Where("LOWER(country) = LOWER(?)", currentProfile.Country)
		}
	case domain.FilterGlobal:
		// No location filter applied
	}

	var profiles []*domain.Profile
	err := query.Order("is_boosted DESC, updated_at DESC").Limit(limit).Find(&profiles).Error
	if err != nil {
		return nil, fmt.Errorf("failed to query profile recommendations: %w", err)
	}

	// Fallback if no specific city/country match found: show other candidates globally so app is never empty!
	if len(profiles) == 0 && currentProfile.TargetLocationMode != domain.FilterGlobal {
		fallbackQuery := r.db.WithContext(ctx).Preload("User").Where("user_id != ?", currentUserID)
		if len(swipedTargetIDs) > 0 {
			fallbackQuery = fallbackQuery.Where("user_id NOT IN ?", swipedTargetIDs)
		}
		if currentProfile.TargetGender != domain.GenderAll {
			fallbackQuery = fallbackQuery.Where("gender = ?", currentProfile.TargetGender)
		}
		_ = fallbackQuery.Order("is_boosted DESC, updated_at DESC").Limit(limit).Find(&profiles).Error
	}

	return profiles, nil
}
