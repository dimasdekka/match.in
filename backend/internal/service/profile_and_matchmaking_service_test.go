package service_test

import (
	"context"
	"testing"

	"matchin-backend/internal/domain"
	"matchin-backend/internal/repository"
	"matchin-backend/internal/service"
)

func TestUserService(t *testing.T) {
	db := setupTestDB(t)
	userRepo := repository.NewUserRepository(db)
	userSvc := service.NewUserService(userRepo)
	ctx := context.Background()

	t.Run("CreateOrUpdate and GetUserByID / GetByTelegramID", func(t *testing.T) {
		u := &domain.User{
			TelegramID:   50001,
			Username:     "usertest",
			FirstName:    "User",
			LastName:     "Test",
			LanguageCode: "en",
		}

		err := userSvc.CreateOrUpdate(ctx, u)
		if err != nil {
			t.Fatalf("CreateOrUpdate failed: %v", err)
		}

		byTgID, err := userSvc.GetByTelegramID(ctx, 50001)
		if err != nil || byTgID == nil {
			t.Fatalf("GetByTelegramID failed: err=%v, user=%v", err, byTgID)
		}

		byID, err := userSvc.GetUserByID(ctx, u.ID)
		if err != nil || byID == nil {
			t.Fatalf("GetUserByID failed: err=%v, user=%v", err, byID)
		}

		err = userSvc.UpdateLanguage(ctx, u.ID, "id")
		if err != nil {
			t.Fatalf("UpdateLanguage failed: %v", err)
		}

		updated, _ := userSvc.GetUserByID(ctx, u.ID)
		if updated.LanguageCode != "id" {
			t.Fatalf("expected language_code id, got %s", updated.LanguageCode)
		}
	})
}

func TestProfileService(t *testing.T) {
	db := setupTestDB(t)
	userRepo := repository.NewUserRepository(db)
	profileRepo := repository.NewProfileRepository(db)
	userSvc := service.NewUserService(userRepo)
	profileSvc := service.NewProfileService(profileRepo)
	ctx := context.Background()

	u := &domain.User{TelegramID: 60001, Username: "psvc_user"}
	_ = userSvc.CreateOrUpdate(ctx, u)

	t.Run("SaveProfile defaults and retrieval", func(t *testing.T) {
		req := &domain.ProfileRequest{
			Name:         "PSvc User",
			Age:          28,
			Gender:       domain.GenderMale,
			TargetGender: domain.GenderFemale,
			Bio:          "Testing profile service",
			Country:      "Indonesia",
			City:         "Jakarta",
			Photos:       []string{"http://photo1.jpg"},
			Interests:    []string{"Tech", "Travel"},
		}

		saved, err := profileSvc.SaveProfile(ctx, u.ID, req)
		if err != nil {
			t.Fatalf("SaveProfile failed: %v", err)
		}
		if saved == nil {
			t.Fatal("expected non-nil saved profile")
		}
		if saved.MinAgePref != 18 || saved.MaxAgePref != 50 {
			t.Fatalf("expected default min 18 max 50, got min=%d max=%d", saved.MinAgePref, saved.MaxAgePref)
		}
		if saved.TargetLocationMode != domain.FilterCity {
			t.Fatalf("expected default location mode same_city, got %s", saved.TargetLocationMode)
		}

		fetched, err := profileSvc.GetProfileByUserID(ctx, u.ID)
		if err != nil || fetched == nil {
			t.Fatalf("GetProfileByUserID failed: err=%v, profile=%v", err, fetched)
		}
	})

	t.Run("GetRecommendations with limit bounds", func(t *testing.T) {
		// Nil profile case for user without profile
		uNoProfile := &domain.User{TelegramID: 60002, Username: "noprofile"}
		_ = userSvc.CreateOrUpdate(ctx, uNoProfile)

		recsNoProfile, err := profileSvc.GetRecommendations(ctx, uNoProfile.ID, 10, "for_you")
		if err != nil {
			t.Fatalf("GetRecommendations for user with no profile failed: %v", err)
		}
		if len(recsNoProfile) != 0 {
			t.Fatalf("expected 0 recommendations for user without profile, got %d", len(recsNoProfile))
		}

		// User with profile requesting limit <= 0 should default to 10
		recsDefault, err := profileSvc.GetRecommendations(ctx, u.ID, -5, "for_you")
		if err != nil {
			t.Fatalf("GetRecommendations default limit failed: %v", err)
		}
		_ = recsDefault
	})
}

func TestMatchmakingService(t *testing.T) {
	db := setupTestDB(t)
	userRepo := repository.NewUserRepository(db)
	profileRepo := repository.NewProfileRepository(db)
	swipeRepo := repository.NewSwipeRepository(db)
	matchRepo := repository.NewMatchRepository(db)

	userSvc := service.NewUserService(userRepo)
	profileSvc := service.NewProfileService(profileRepo)
	botSvc := service.NewBotService("", "", userSvc, profileSvc)
	mmSvc := service.NewMatchmakingService(swipeRepo, matchRepo, profileRepo, userRepo, botSvc)

	ctx := context.Background()

	u1 := &domain.User{TelegramID: 70001, Username: "mm_u1", FirstName: "User1"}
	u2 := &domain.User{TelegramID: 70002, Username: "mm_u2", FirstName: "User2"}
	_ = userSvc.CreateOrUpdate(ctx, u1)
	_ = userSvc.CreateOrUpdate(ctx, u2)

	_, _ = profileSvc.SaveProfile(ctx, u1.ID, &domain.ProfileRequest{
		Name: "U1", Age: 25, Gender: domain.GenderMale, TargetGender: domain.GenderFemale,
		Country: "Indonesia", City: "Jakarta",
	})
	_, _ = profileSvc.SaveProfile(ctx, u2.ID, &domain.ProfileRequest{
		Name: "U2", Age: 23, Gender: domain.GenderFemale, TargetGender: domain.GenderMale,
		Country: "Indonesia", City: "Jakarta",
	})

	t.Run("Self swipe rejection", func(t *testing.T) {
		_, err := mmSvc.ProcessSwipe(ctx, u1.ID, &domain.SwipeRequest{
			TargetID: u1.ID,
			Action:   domain.ActionLike,
		})
		if err == nil {
			t.Fatal("expected error on self swipe, got nil")
		}
	})

	t.Run("Single swipe non-match", func(t *testing.T) {
		resp, err := mmSvc.ProcessSwipe(ctx, u1.ID, &domain.SwipeRequest{
			TargetID: u2.ID,
			Action:   domain.ActionLike,
		})
		if err != nil {
			t.Fatalf("ProcessSwipe failed: %v", err)
		}
		if resp.IsMatch {
			t.Fatal("expected IsMatch to be false for single-sided swipe")
		}
	})

	t.Run("Mutual swipe creates match and formats GetMatches", func(t *testing.T) {
		resp, err := mmSvc.ProcessSwipe(ctx, u2.ID, &domain.SwipeRequest{
			TargetID: u1.ID,
			Action:   domain.ActionLike,
		})
		if err != nil {
			t.Fatalf("ProcessSwipe mutual failed: %v", err)
		}
		if !resp.IsMatch || resp.Match == nil {
			t.Fatalf("expected mutual match response, got: %v", resp)
		}

		matches, err := mmSvc.GetMatches(ctx, u1.ID)
		if err != nil {
			t.Fatalf("GetMatches failed: %v", err)
		}
		if len(matches) != 1 {
			t.Fatalf("expected 1 match detail, got %d", len(matches))
		}
		if matches[0].TelegramUsername != "mm_u2" {
			t.Fatalf("expected telegram_username mm_u2, got %s", matches[0].TelegramUsername)
		}
		if matches[0].DirectTelegramLink != "https://t.me/mm_u2" {
			t.Fatalf("expected direct link https://t.me/mm_u2, got %s", matches[0].DirectTelegramLink)
		}
	})

	t.Run("ResetSwipes", func(t *testing.T) {
		err := mmSvc.ResetSwipes(ctx, u1.ID)
		if err != nil {
			t.Fatalf("ResetSwipes failed: %v", err)
		}
	})
}
