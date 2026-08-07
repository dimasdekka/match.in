package service

import (
	"context"
	"fmt"

	"matchin-backend/internal/domain"
	"matchin-backend/internal/repository"
)

type MatchmakingService interface {
	ProcessSwipe(ctx context.Context, swiperID uint, req *domain.SwipeRequest) (*domain.SwipeResponse, error)
	GetMatches(ctx context.Context, userID uint) ([]*domain.MatchDetail, error)
}

type matchmakingService struct {
	swipeRepo   repository.SwipeRepository
	matchRepo   repository.MatchRepository
	profileRepo repository.ProfileRepository
	userRepo    repository.UserRepository
	botService  BotService
}

func NewMatchmakingService(
	swipeRepo repository.SwipeRepository,
	matchRepo repository.MatchRepository,
	profileRepo repository.ProfileRepository,
	userRepo repository.UserRepository,
	botService BotService,
) MatchmakingService {
	return &matchmakingService{
		swipeRepo:   swipeRepo,
		matchRepo:   matchRepo,
		profileRepo: profileRepo,
		userRepo:    userRepo,
		botService:  botService,
	}
}

func (s *matchmakingService) ProcessSwipe(ctx context.Context, swiperID uint, req *domain.SwipeRequest) (*domain.SwipeResponse, error) {
	if swiperID == req.TargetID {
		return nil, fmt.Errorf("cannot swipe on yourself")
	}

	swipe := &domain.Swipe{
		SwiperID: swiperID,
		TargetID: req.TargetID,
		Action:   req.Action,
	}

	if err := s.swipeRepo.RecordSwipe(ctx, swipe); err != nil {
		return nil, fmt.Errorf("failed to record swipe: %w", err)
	}

	// Check if this is a Like/Superlike and if target already liked swiper
	if req.Action == domain.ActionLike || req.Action == domain.ActionSuperlike {
		likedBack, err := s.swipeRepo.HasLikedBack(ctx, req.TargetID, swiperID)
		if err != nil {
			return nil, fmt.Errorf("failed to check like back status: %w", err)
		}

		if likedBack {
			// MUTUAL MATCH! Create match entry
			match, err := s.matchRepo.CreateMatch(ctx, swiperID, req.TargetID)
			if err != nil {
				return nil, fmt.Errorf("failed to create match: %w", err)
			}

			// Get profiles for notifications
			swiperUser, _ := s.userRepo.GetByID(ctx, swiperID)
			targetUser, _ := s.userRepo.GetByID(ctx, req.TargetID)
			targetProfile, _ := s.profileRepo.GetByUserID(ctx, req.TargetID)

			if swiperUser != nil && targetUser != nil {
				// Send notification to Swiper
				_ = s.botService.SendMatchNotification(swiperUser.TelegramID, targetProfile.Name, targetUser.Username, swiperUser.LanguageCode)

				// Send notification to Target
				swiperProfile, _ := s.profileRepo.GetByUserID(ctx, swiperID)
				if swiperProfile != nil {
					_ = s.botService.SendMatchNotification(targetUser.TelegramID, swiperProfile.Name, swiperUser.Username, targetUser.LanguageCode)
				}
			}

			return &domain.SwipeResponse{
				IsMatch: true,
				Match:   match,
				Profile: targetProfile,
			}, nil
		}
	}

	return &domain.SwipeResponse{
		IsMatch: false,
	}, nil
}

func (s *matchmakingService) GetMatches(ctx context.Context, userID uint) ([]*domain.MatchDetail, error) {
	matches, err := s.matchRepo.GetMatchesForUser(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get matches: %w", err)
	}

	var details []*domain.MatchDetail
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
			continue
		}

		directLink := ""
		if matchedUser.Username != "" {
			directLink = "https://t.me/" + matchedUser.Username
		}

		details = append(details, &domain.MatchDetail{
			MatchID:            m.ID,
			MatchedUser:        matchedUser,
			MatchedProfile:     matchedProfile,
			TelegramUsername:   matchedUser.Username,
			DirectTelegramLink: directLink,
			MatchedAt:          m.CreatedAt,
		})
	}

	return details, nil
}
