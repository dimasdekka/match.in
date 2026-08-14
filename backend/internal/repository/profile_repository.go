package repository

import (
	"context"
	"fmt"
	"strings"

	"matchin-backend/internal/domain"
	"gorm.io/gorm"
)

type ProfileRepository interface {
	GetByUserID(ctx context.Context, userID uint) (*domain.Profile, error)
	GetByUserIDs(ctx context.Context, userIDs []uint) ([]*domain.Profile, error)
	Upsert(ctx context.Context, profile *domain.Profile) error
	GetRecommendations(ctx context.Context, currentUserID uint, currentProfile *domain.Profile, limit int, feedType string) ([]*domain.Profile, error)
	DeleteByUserID(ctx context.Context, userID uint) error
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

func (r *profileRepository) GetByUserIDs(ctx context.Context, userIDs []uint) ([]*domain.Profile, error) {
	if len(userIDs) == 0 {
		return []*domain.Profile{}, nil
	}
	var profiles []*domain.Profile
	err := r.db.WithContext(ctx).Preload("User").Where("user_id IN (?)", userIDs).Find(&profiles).Error
	if err != nil {
		return nil, fmt.Errorf("failed to get profiles for user ids: %w", err)
	}
	return profiles, nil
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

func (r *profileRepository) GetRecommendations(ctx context.Context, currentUserID uint, currentProfile *domain.Profile, limit int, feedType string) ([]*domain.Profile, error) {
	var swipedTargetIDs []uint
	r.db.WithContext(ctx).Model(&domain.Swipe{}).Where("swiper_id = ?", currentUserID).Pluck("target_id", &swipedTargetIDs)

	query := r.db.WithContext(ctx).Preload("User").Where("user_id != ?", currentUserID)

	if len(swipedTargetIDs) > 0 {
		query = query.Where("user_id NOT IN ?", swipedTargetIDs)
	}

	// 1. Strict Gender Filter
	if currentProfile.TargetGender != domain.GenderAll && currentProfile.TargetGender != "" {
		query = query.Where("LOWER(TRIM(gender)) = LOWER(TRIM(?))", string(currentProfile.TargetGender))
	}

	// 2. Strict Age Range Filter
	if currentProfile.MinAgePref > 0 && currentProfile.MaxAgePref > 0 {
		query = query.Where("age >= ? AND age <= ?", currentProfile.MinAgePref, currentProfile.MaxAgePref)
	}

	// 3. Strict Location Filter based on TargetLocationMode & Feed
	if feedType == "nearby" || currentProfile.TargetLocationMode == domain.FilterCity {
		if strings.TrimSpace(currentProfile.City) != "" {
			query = query.Where("LOWER(TRIM(city)) = LOWER(TRIM(?))", strings.TrimSpace(currentProfile.City))
		}
	} else if currentProfile.TargetLocationMode == domain.FilterCountry {
		if strings.TrimSpace(currentProfile.Country) != "" {
			query = query.Where("LOWER(TRIM(country)) = LOWER(TRIM(?))", strings.TrimSpace(currentProfile.Country))
		}
	}

	// 4. Feed-specific filters
	if feedType == "serious" {
		query = query.Where("relationship_goal IN ('long_term', 'marriage') OR dating_intention IN ('serious', 'marriage', 'long_term')")
	}

	// 5. Order by feed type
	var orderBy string
	switch feedType {
	case "popular":
		orderBy = "is_boosted DESC, total_likes DESC, updated_at DESC"
	case "new":
		orderBy = "is_boosted DESC, created_at DESC"
	case "nearby":
		orderBy = "is_boosted DESC, updated_at DESC"
	default: // for_you, serious
		orderBy = "is_boosted DESC, updated_at DESC"
	}

	var profiles []*domain.Profile
	err := query.Order(orderBy).Limit(limit).Find(&profiles).Error
	if err != nil {
		return nil, fmt.Errorf("failed to query profile recommendations: %w", err)
	}

	return profiles, nil
}

func (r *profileRepository) DeleteByUserID(ctx context.Context, userID uint) error {
	if err := r.db.WithContext(ctx).Where("user_id = ?", userID).Delete(&domain.Profile{}).Error; err != nil {
		return fmt.Errorf("failed to delete profile for user %d: %w", userID, err)
	}
	return nil
}
