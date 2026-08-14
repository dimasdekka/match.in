package service_test

import (
	"context"
	"testing"

	"matchin-backend/internal/domain"
	"matchin-backend/internal/repository"
	"matchin-backend/internal/service"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

func setupTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open sqlite memory db: %v", err)
	}

	err = db.AutoMigrate(&domain.User{}, &domain.Profile{}, &domain.Swipe{}, &domain.Match{})
	if err != nil {
		t.Fatalf("failed to migrate db: %v", err)
	}

	return db
}

func TestBotServiceCommands(t *testing.T) {
	db := setupTestDB(t)
	ctx := context.Background()

	userRepo := repository.NewUserRepository(db)
	profileRepo := repository.NewProfileRepository(db)
	swipeRepo := repository.NewSwipeRepository(db)
	matchRepo := repository.NewMatchRepository(db)

	userService := service.NewUserService(userRepo)
	profileService := service.NewProfileService(profileRepo)
	botService := service.NewBotService("", "https://t.me/matchin_bot/app", userService, profileService)
	matchmakingService := service.NewMatchmakingService(swipeRepo, matchRepo, profileRepo, userRepo, botService)
	botService.SetMatchmakingService(matchmakingService)

	// 1. Test /start command
	startUpdate := &domain.TelegramBotUpdate{
		UpdateID: 1,
		Message: &domain.TelegramBotMessage{
			MessageID: 101,
			From: &domain.TelegramBotUser{
				ID:           12345678,
				FirstName:    "Alice",
				LastName:     "Testing",
				Username:     "alice_test",
				LanguageCode: "en",
			},
			Chat: domain.TelegramBotChat{ID: 12345678, Type: "private"},
			Text: "/start",
		},
	}

	err := botService.ProcessUpdate(ctx, startUpdate)
	if err != nil {
		t.Fatalf("/start command failed: %v", err)
	}

	user, err := userService.GetByTelegramID(ctx, 12345678)
	if err != nil || user == nil {
		t.Fatalf("expected user to be created on /start, got err=%v, user=%v", err, user)
	}

	// 2. Setup profile for user
	_, err = profileService.SaveProfile(ctx, user.ID, &domain.ProfileRequest{
		Name:               "Alice Testing",
		Age:                24,
		Gender:             domain.GenderFemale,
		TargetGender:       domain.GenderMale,
		Bio:                "Testing bio",
		Country:            "Indonesia",
		City:               "Jakarta",
		TargetLocationMode: domain.FilterGlobal,
		Photos:             []string{"http://example.com/photo1.jpg"},
		Interests:          []string{"Coding", "Music"},
	})
	if err != nil {
		t.Fatalf("failed to save profile: %v", err)
	}

	// Setup a candidate profile
	candUser := &domain.User{
		TelegramID:   87654321,
		Username:     "bob_test",
		FirstName:    "Bob",
		LastName:     "Testing",
		LanguageCode: "en",
		IsActive:     true,
	}
	if err := userService.CreateOrUpdate(ctx, candUser); err != nil {
		t.Fatalf("failed to create candidate user: %v", err)
	}

	_, err = profileService.SaveProfile(ctx, candUser.ID, &domain.ProfileRequest{
		Name:               "Bob Testing",
		Age:                26,
		Gender:             domain.GenderMale,
		TargetGender:       domain.GenderFemale,
		Bio:                "Bob's testing bio",
		Country:            "Indonesia",
		City:               "Jakarta",
		TargetLocationMode: domain.FilterGlobal,
		Interests:          []string{"Sports"},
	})
	if err != nil {
		t.Fatalf("failed to save candidate profile: %v", err)
	}

	// 3. Test /profile command
	profileUpdate := &domain.TelegramBotUpdate{
		UpdateID: 2,
		Message: &domain.TelegramBotMessage{
			MessageID: 102,
			From: &domain.TelegramBotUser{
				ID: 12345678,
			},
			Chat: domain.TelegramBotChat{ID: 12345678},
			Text: "/profile",
		},
	}
	if err := botService.ProcessUpdate(ctx, profileUpdate); err != nil {
		t.Fatalf("/profile command failed: %v", err)
	}

	// 4. Test /search command
	searchUpdate := &domain.TelegramBotUpdate{
		UpdateID: 3,
		Message: &domain.TelegramBotMessage{
			MessageID: 103,
			From: &domain.TelegramBotUser{
				ID: 12345678,
			},
			Chat: domain.TelegramBotChat{ID: 12345678},
			Text: "/search",
		},
	}
	if err := botService.ProcessUpdate(ctx, searchUpdate); err != nil {
		t.Fatalf("/search command failed: %v", err)
	}

	// 5. Swipe candidate and create match
	_, err = matchmakingService.ProcessSwipe(ctx, candUser.ID, &domain.SwipeRequest{
		TargetID: user.ID,
		Action:   domain.ActionLike,
	})
	if err != nil {
		t.Fatalf("candidate swipe failed: %v", err)
	}

	_, err = matchmakingService.ProcessSwipe(ctx, user.ID, &domain.SwipeRequest{
		TargetID: candUser.ID,
		Action:   domain.ActionLike,
	})
	if err != nil {
		t.Fatalf("user swipe failed: %v", err)
	}

	// 6. Test /matches command
	matchesUpdate := &domain.TelegramBotUpdate{
		UpdateID: 4,
		Message: &domain.TelegramBotMessage{
			MessageID: 104,
			From: &domain.TelegramBotUser{
				ID: 12345678,
			},
			Chat: domain.TelegramBotChat{ID: 12345678},
			Text: "/matches",
		},
	}
	if err := botService.ProcessUpdate(ctx, matchesUpdate); err != nil {
		t.Fatalf("/matches command failed: %v", err)
	}

	// 7. Test /reset command
	resetUpdate := &domain.TelegramBotUpdate{
		UpdateID: 5,
		Message: &domain.TelegramBotMessage{
			MessageID: 105,
			From: &domain.TelegramBotUser{
				ID: 12345678,
			},
			Chat: domain.TelegramBotChat{ID: 12345678},
			Text: "/reset",
		},
	}
	if err := botService.ProcessUpdate(ctx, resetUpdate); err != nil {
		t.Fatalf("/reset command failed: %v", err)
	}

	// 8. Test /help command
	helpUpdate := &domain.TelegramBotUpdate{
		UpdateID: 6,
		Message: &domain.TelegramBotMessage{
			MessageID: 106,
			From: &domain.TelegramBotUser{
				ID: 12345678,
			},
			Chat: domain.TelegramBotChat{ID: 12345678},
			Text: "/help",
		},
	}
	if err := botService.ProcessUpdate(ctx, helpUpdate); err != nil {
		t.Fatalf("/help command failed: %v", err)
	}
}
