package service

import (
	"context"
	"fmt"
	"log"

	"matchin-backend/internal/domain"
	"matchin-backend/internal/repository"
)

type MatchmakingService interface {
	ProcessSwipe(ctx context.Context, swiperID uint, req *domain.SwipeRequest) (*domain.SwipeResponse, error)
	GetMatches(ctx context.Context, userID uint) ([]*domain.MatchDetail, error)
	GetLikesReceived(ctx context.Context, userID uint) ([]*domain.Profile, error)
	GetLikesSent(ctx context.Context, userID uint) ([]*domain.Profile, error)
	ResetSwipes(ctx context.Context, userID uint) error
	Unmatch(ctx context.Context, userID uint, matchID uint) error
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

	if req.Action == domain.ActionPass {
		return &domain.SwipeResponse{IsMatch: false}, nil
	}

	hasLikedBack, err := s.swipeRepo.HasLikedBack(ctx, req.TargetID, swiperID)
	if err != nil {
		log.Printf("Error checking if target %d liked back %d: %v\n", req.TargetID, swiperID, err)
	}

	if hasLikedBack {
		match, err := s.matchRepo.CreateMatch(ctx, swiperID, req.TargetID)
		if err != nil {
			log.Printf("Error creating match: %v\n", err)
		} else {
			swiperProfile, _ := s.profileRepo.GetByUserID(ctx, swiperID)
			targetProfile, _ := s.profileRepo.GetByUserID(ctx, req.TargetID)
			swiperUser, _ := s.userRepo.GetByID(ctx, swiperID)
			targetUser, _ := s.userRepo.GetByID(ctx, req.TargetID)

			if s.botService != nil && swiperUser != nil && targetUser != nil && swiperProfile != nil && targetProfile != nil {
				go s.botService.SendMatchNotification(context.Background(), swiperUser.TelegramID, targetProfile.Name, targetUser.Username, swiperUser.LanguageCode)
				go s.botService.SendMatchNotification(context.Background(), targetUser.TelegramID, swiperProfile.Name, swiperUser.Username, targetUser.LanguageCode)
			}

			return &domain.SwipeResponse{
				IsMatch: true,
				Match:   match,
				Profile: targetProfile,
			}, nil
		}
	} else {
		if s.botService != nil {
			swiperProfile, _ := s.profileRepo.GetByUserID(ctx, swiperID)
			targetUser, _ := s.userRepo.GetByID(ctx, req.TargetID)
			if targetUser != nil && swiperProfile != nil {
				go s.botService.SendSingleLikeNotification(context.Background(), targetUser.TelegramID, swiperID, swiperProfile.Name, targetUser.LanguageCode)
			}
		}
	}

	return &domain.SwipeResponse{IsMatch: false}, nil
}

func (s *matchmakingService) GetMatches(ctx context.Context, userID uint) ([]*domain.MatchDetail, error) {
	matches, err := s.matchRepo.GetMatchesForUser(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch user matches: %w", err)
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
			if err != nil {
				log.Printf("Warning: failed to fetch matched user %d: %v\n", matchedUserID, err)
			}
			continue
		}

		matchedProfile, err := s.profileRepo.GetByUserID(ctx, matchedUserID)
		if err != nil || matchedProfile == nil {
			if err != nil {
				log.Printf("Warning: failed to fetch matched profile %d: %v\n", matchedUserID, err)
			}
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

func (s *matchmakingService) GetLikesReceived(ctx context.Context, userID uint) ([]*domain.Profile, error) {
	swiperIDs, err := s.swipeRepo.GetLikesReceived(ctx, userID)
	if err != nil {
		return nil, err
	}
	if len(swiperIDs) == 0 {
		return []*domain.Profile{}, nil
	}
	return s.profileRepo.GetByUserIDs(ctx, swiperIDs)
}

func (s *matchmakingService) GetLikesSent(ctx context.Context, userID uint) ([]*domain.Profile, error) {
	targetIDs, err := s.swipeRepo.GetLikesSent(ctx, userID)
	if err != nil {
		return nil, err
	}
	if len(targetIDs) == 0 {
		return []*domain.Profile{}, nil
	}
	return s.profileRepo.GetByUserIDs(ctx, targetIDs)
}

func (s *matchmakingService) ResetSwipes(ctx context.Context, userID uint) error {
	if err := s.swipeRepo.ResetSwipes(ctx, userID); err != nil {
		return fmt.Errorf("failed to reset swipes for user %d: %w", userID, err)
	}
	return nil
}

func (s *matchmakingService) Unmatch(ctx context.Context, userID uint, matchID uint) error {
	if err := s.matchRepo.UnmatchByID(ctx, matchID, userID); err != nil {
		return fmt.Errorf("failed to unmatch: %w", err)
	}
	return nil
}
