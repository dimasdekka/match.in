package service

import (
	"context"
	"encoding/json"
	"fmt"

	"matchin-backend/internal/domain"
	"matchin-backend/internal/repository"
)

type ProfileService interface {
	GetProfileByUserID(ctx context.Context, userID uint) (*domain.Profile, error)
	SaveProfile(ctx context.Context, userID uint, req *domain.ProfileRequest) (*domain.Profile, error)
	GetRecommendations(ctx context.Context, userID uint, limit int, feedType string) ([]*domain.Profile, error)
}

type profileService struct {
	profileRepo repository.ProfileRepository
}

func NewProfileService(profileRepo repository.ProfileRepository) ProfileService {
	return &profileService{profileRepo: profileRepo}
}

func (s *profileService) GetProfileByUserID(ctx context.Context, userID uint) (*domain.Profile, error) {
	profile, err := s.profileRepo.GetByUserID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get profile for user %d: %w", userID, err)
	}
	return profile, nil
}

func (s *profileService) SaveProfile(ctx context.Context, userID uint, req *domain.ProfileRequest) (*domain.Profile, error) {
	photosJSON, err := json.Marshal(req.Photos)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal profile photos: %w", err)
	}

	interestsJSON, err := json.Marshal(req.Interests)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal profile interests: %w", err)
	}

	locMode := req.TargetLocationMode
	if locMode == "" {
		locMode = domain.FilterCity
	}

	profile := &domain.Profile{
		UserID:             userID,
		Name:               req.Name,
		Age:                req.Age,
		BirthDate:          req.BirthDate,
		Gender:             req.Gender,
		TargetGender:       req.TargetGender,
		Bio:                req.Bio,
		VoiceBioURL:        req.VoiceBioURL,
		Country:            req.Country,
		City:               req.City,
		Latitude:           req.Latitude,
		Longitude:          req.Longitude,
		TargetLocationMode: locMode,
		MinAgePref:         req.MinAgePref,
		MaxAgePref:         req.MaxAgePref,
		MaxDistanceKm:      req.MaxDistanceKm,
		RelationshipGoal:   req.RelationshipGoal,
		DatingIntention:    req.DatingIntention,
		Photos:             string(photosJSON),
		Interests:          string(interestsJSON),
	}

	if profile.MinAgePref == 0 {
		profile.MinAgePref = 18
	}
	if profile.MaxAgePref == 0 {
		profile.MaxAgePref = 50
	}
	if profile.MaxDistanceKm == 0 {
		profile.MaxDistanceKm = 50
	}

	if err := s.profileRepo.Upsert(ctx, profile); err != nil {
		return nil, fmt.Errorf("failed to upsert profile: %w", err)
	}

	return s.profileRepo.GetByUserID(ctx, userID)
}

func (s *profileService) GetRecommendations(ctx context.Context, userID uint, limit int, feedType string) ([]*domain.Profile, error) {
	profile, err := s.profileRepo.GetByUserID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user profile for recommendations: %w", err)
	}

	if profile == nil {
		return []*domain.Profile{}, nil
	}

	if limit <= 0 {
		limit = 10
	}
	if limit > 50 {
		limit = 50
	}

	if feedType == "" {
		feedType = "for_you"
	}

	return s.profileRepo.GetRecommendations(ctx, userID, profile, limit, feedType)
}
