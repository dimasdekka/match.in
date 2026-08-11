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
	ResetSwipes(ctx context.Context, userID uint) error
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

	if req.Action == domain.ActionLike || req.Action == domain.ActionSuperlike {
		likedBack, err := s.swipeRepo.HasLikedBack(ctx, req.TargetID, swiperID)
		if err != nil {
			return nil, fmt.Errorf("failed to check like back status: %w", err)
		}

		if likedBack {
			match, err := s.matchRepo.CreateMatch(ctx, swiperID, req.TargetID)
			if err != nil {
				return nil, fmt.Errorf("failed to create match: %w", err)
			}

			swiperUser, err := s.userRepo.GetByID(ctx, swiperID)
			if err != nil {
				log.Printf("Warning: failed to fetch swiper user %d for notification: %v\n", swiperID, err)
			}

			targetUser, err := s.userRepo.GetByID(ctx, req.TargetID)
			if err != nil {
				log.Printf("Warning: failed to fetch target user %d for notification: %v\n", req.TargetID, err)
			}

			targetProfile, err := s.profileRepo.GetByUserID(ctx, req.TargetID)
			if err != nil {
				log.Printf("Warning: failed to fetch target profile %d for notification: %v\n", req.TargetID, err)
			}

			if swiperUser != nil && targetUser != nil && targetProfile != nil {
				if notifErr := s.botService.SendMatchNotification(ctx, swiperUser.TelegramID, targetProfile.Name, targetUser.Username, swiperUser.LanguageCode); notifErr != nil {
					log.Printf("Warning: failed to send match notification to swiper %d: %v\n", swiperUser.TelegramID, notifErr)
				}

				swiperProfile, sProfErr := s.profileRepo.GetByUserID(ctx, swiperID)
				if sProfErr != nil {
					log.Printf("Warning: failed to fetch swiper profile %d for notification: %v\n", swiperID, sProfErr)
				} else if swiperProfile != nil {
					if notifErr := s.botService.SendMatchNotification(ctx, targetUser.TelegramID, swiperProfile.Name, swiperUser.Username, targetUser.LanguageCode); notifErr != nil {
						log.Printf("Warning: failed to send match notification to target %d: %v\n", targetUser.TelegramID, notifErr)
					}
				}
			}

			return &domain.SwipeResponse{
				IsMatch: true,
				Match:   match,
				Profile: targetProfile,
			}, nil
		} else {
			// Single like (not mutual yet) -> Notify target user on Telegram!
			targetUser, tErr := s.userRepo.GetByID(ctx, req.TargetID)
			swiperProfile, sProfErr := s.profileRepo.GetByUserID(ctx, swiperID)
			if tErr == nil && targetUser != nil && sProfErr == nil && swiperProfile != nil {
				swiperName := swiperProfile.Name
				if swiperName == "" {
					swiperName = "Seseorang"
				}
				if notifErr := s.botService.SendSingleLikeNotification(ctx, targetUser.TelegramID, swiperID, swiperName, targetUser.LanguageCode); notifErr != nil {
					log.Printf("Warning: failed to send single like notification to user %d: %v\n", targetUser.TelegramID, notifErr)
				}
			}
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

func (s *matchmakingService) ResetSwipes(ctx context.Context, userID uint) error {
	if err := s.swipeRepo.ResetSwipes(ctx, userID); err != nil {
		return fmt.Errorf("failed to reset swipes for user %d: %w", userID, err)
	}
	return nil
}
