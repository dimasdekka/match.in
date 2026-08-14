package repository_test

import (
	"context"
	"testing"

	"matchin-backend/internal/domain"
	"matchin-backend/internal/repository"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

func setupTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open in-memory sqlite db: %v", err)
	}

	err = db.AutoMigrate(&domain.User{}, &domain.Profile{}, &domain.Swipe{}, &domain.Match{})
	if err != nil {
		t.Fatalf("failed to auto migrate db: %v", err)
	}

	return db
}

func TestUserRepository(t *testing.T) {
	db := setupTestDB(t)
	repo := repository.NewUserRepository(db)
	ctx := context.Background()

	t.Run("CreateOrUpdate and GetByTelegramID", func(t *testing.T) {
		user := &domain.User{
			TelegramID:   10001,
			Username:     "testuser1",
			FirstName:    "Test",
			LastName:     "One",
			LanguageCode: "en",
			IsActive:     true,
		}

		err := repo.CreateOrUpdate(ctx, user)
		if err != nil {
			t.Fatalf("CreateOrUpdate failed: %v", err)
		}
		if user.ID == 0 {
			t.Fatal("expected non-zero ID after creation")
		}

		fetched, err := repo.GetByTelegramID(ctx, 10001)
		if err != nil {
			t.Fatalf("GetByTelegramID failed: %v", err)
		}
		if fetched == nil || fetched.Username != "testuser1" {
			t.Fatalf("expected testuser1, got %v", fetched)
		}

		// Update user
		user.FirstName = "UpdatedName"
		err = repo.CreateOrUpdate(ctx, user)
		if err != nil {
			t.Fatalf("CreateOrUpdate update failed: %v", err)
		}

		fetchedUpdated, err := repo.GetByTelegramID(ctx, 10001)
		if err != nil || fetchedUpdated.FirstName != "UpdatedName" {
			t.Fatalf("expected UpdatedName, got %v", fetchedUpdated)
		}
	})

	t.Run("GetByID", func(t *testing.T) {
		user := &domain.User{
			TelegramID:   10002,
			Username:     "testuser2",
			FirstName:    "Test",
			LastName:     "Two",
			LanguageCode: "id",
			IsActive:     true,
		}
		_ = repo.CreateOrUpdate(ctx, user)

		fetched, err := repo.GetByID(ctx, user.ID)
		if err != nil || fetched == nil {
			t.Fatalf("GetByID failed: err=%v, user=%v", err, fetched)
		}
		if fetched.TelegramID != 10002 {
			t.Fatalf("expected TelegramID 10002, got %d", fetched.TelegramID)
		}

		// Non-existent ID
		nonExistent, err := repo.GetByID(ctx, 999999)
		if err != nil {
			t.Fatalf("expected nil error for non-existent user ID, got %v", err)
		}
		if nonExistent != nil {
			t.Fatalf("expected nil user for non-existent ID, got %v", nonExistent)
		}
	})

	t.Run("UpdateLanguage", func(t *testing.T) {
		user := &domain.User{
			TelegramID:   10003,
			Username:     "testuser3",
			LanguageCode: "en",
		}
		_ = repo.CreateOrUpdate(ctx, user)

		err := repo.UpdateLanguage(ctx, user.ID, "id")
		if err != nil {
			t.Fatalf("UpdateLanguage failed: %v", err)
		}

		fetched, _ := repo.GetByID(ctx, user.ID)
		if fetched.LanguageCode != "id" {
			t.Fatalf("expected language_code 'id', got '%s'", fetched.LanguageCode)
		}
	})
}

func TestProfileRepository(t *testing.T) {
	db := setupTestDB(t)
	userRepo := repository.NewUserRepository(db)
	profileRepo := repository.NewProfileRepository(db)
	ctx := context.Background()

	u1 := &domain.User{TelegramID: 20001, Username: "puser1", FirstName: "User1", LanguageCode: "id"}
	_ = userRepo.CreateOrUpdate(ctx, u1)

	t.Run("Upsert and GetByUserID", func(t *testing.T) {
		p1 := &domain.Profile{
			UserID:             u1.ID,
			Name:               "User One",
			Age:                25,
			Gender:             domain.GenderMale,
			TargetGender:       domain.GenderFemale,
			Bio:                "Hello world",
			Country:            "Indonesia",
			City:               "Jakarta",
			TargetLocationMode: domain.FilterCity,
			MinAgePref:         20,
			MaxAgePref:         30,
			Photos:             `["http://img1.jpg"]`,
			Interests:          `["Coding","Music"]`,
		}

		err := profileRepo.Upsert(ctx, p1)
		if err != nil {
			t.Fatalf("Upsert failed: %v", err)
		}

		fetched, err := profileRepo.GetByUserID(ctx, u1.ID)
		if err != nil || fetched == nil {
			t.Fatalf("GetByUserID failed: err=%v, profile=%v", err, fetched)
		}
		if fetched.Name != "User One" {
			t.Fatalf("expected User One, got %s", fetched.Name)
		}
		if fetched.User == nil || fetched.User.TelegramID != 20001 {
			t.Fatalf("expected preloaded user, got %v", fetched.User)
		}

		// Update profile
		p1.Bio = "Updated bio text"
		err = profileRepo.Upsert(ctx, p1)
		if err != nil {
			t.Fatalf("Upsert update failed: %v", err)
		}

		fetchedUpdated, _ := profileRepo.GetByUserID(ctx, u1.ID)
		if fetchedUpdated.Bio != "Updated bio text" {
			t.Fatalf("expected 'Updated bio text', got '%s'", fetchedUpdated.Bio)
		}
	})

	t.Run("GetRecommendations filtering", func(t *testing.T) {
		// Create female candidate in Jakarta
		uFemaleJkt := &domain.User{TelegramID: 20002, Username: "fjkt", FirstName: "F Jkt"}
		_ = userRepo.CreateOrUpdate(ctx, uFemaleJkt)
		_ = profileRepo.Upsert(ctx, &domain.Profile{
			UserID:             uFemaleJkt.ID,
			Name:               "Siti Jkt",
			Age:                24,
			Gender:             domain.GenderFemale,
			TargetGender:       domain.GenderMale,
			Country:            "Indonesia",
			City:               "Jakarta",
			TargetLocationMode: domain.FilterCity,
			MinAgePref:         20,
			MaxAgePref:         30,
		})

		// Create female candidate in Bandung
		uFemaleBdg := &domain.User{TelegramID: 20003, Username: "fbdg", FirstName: "F Bdg"}
		_ = userRepo.CreateOrUpdate(ctx, uFemaleBdg)
		_ = profileRepo.Upsert(ctx, &domain.Profile{
			UserID:             uFemaleBdg.ID,
			Name:               "Dian Bdg",
			Age:                26,
			Gender:             domain.GenderFemale,
			TargetGender:       domain.GenderMale,
			Country:            "Indonesia",
			City:               "Bandung",
			TargetLocationMode: domain.FilterCountry,
			MinAgePref:         20,
			MaxAgePref:         30,
		})

		currentP, _ := profileRepo.GetByUserID(ctx, u1.ID)

		// 1. Same city mode (Jakarta)
		recs, err := profileRepo.GetRecommendations(ctx, u1.ID, currentP, 10, "for_you")
		if err != nil {
			t.Fatalf("GetRecommendations failed: %v", err)
		}
		if len(recs) == 0 {
			t.Fatal("expected at least 1 recommendation")
		}
		if recs[0].Name != "Siti Jkt" {
			t.Fatalf("expected Siti Jkt first for same_city filter, got %s", recs[0].Name)
		}

		// 2. Global location mode
		currentP.TargetLocationMode = domain.FilterGlobal
		recsGlobal, err := profileRepo.GetRecommendations(ctx, u1.ID, currentP, 10, "for_you")
		if err != nil {
			t.Fatalf("GetRecommendations global failed: %v", err)
		}
		if len(recsGlobal) < 2 {
			t.Fatalf("expected at least 2 recommendations in global mode, got %d", len(recsGlobal))
		}
	})
}

func TestMatchAndSwipeRepositories(t *testing.T) {
	db := setupTestDB(t)
	userRepo := repository.NewUserRepository(db)
	matchRepo := repository.NewMatchRepository(db)
	swipeRepo := repository.NewSwipeRepository(db)
	ctx := context.Background()

	u1 := &domain.User{TelegramID: 30001, Username: "user1"}
	u2 := &domain.User{TelegramID: 30002, Username: "user2"}
	_ = userRepo.CreateOrUpdate(ctx, u1)
	_ = userRepo.CreateOrUpdate(ctx, u2)

	t.Run("RecordSwipe, HasLikedBack, and ResetSwipes", func(t *testing.T) {
		// u1 likes u2
		s1 := &domain.Swipe{
			SwiperID: u1.ID,
			TargetID: u2.ID,
			Action:   domain.ActionLike,
		}
		err := swipeRepo.RecordSwipe(ctx, s1)
		if err != nil {
			t.Fatalf("RecordSwipe failed: %v", err)
		}

		// Check if u2 liked u1 back (should be false)
		likedBack, err := swipeRepo.HasLikedBack(ctx, u2.ID, u1.ID)
		if err != nil {
			t.Fatalf("HasLikedBack failed: %v", err)
		}
		if likedBack {
			t.Fatal("expected u2 to NOT have liked u1 back yet")
		}

		// Check if u1 liked u2 (HasLikedBack with targetID=u1, swiperID=u2)
		u1LikedU2, err := swipeRepo.HasLikedBack(ctx, u1.ID, u2.ID)
		if err != nil {
			t.Fatalf("HasLikedBack check failed: %v", err)
		}
		if !u1LikedU2 {
			t.Fatal("expected HasLikedBack to confirm u1 liked u2")
		}

		// Reset swipes for u1
		err = swipeRepo.ResetSwipes(ctx, u1.ID)
		if err != nil {
			t.Fatalf("ResetSwipes failed: %v", err)
		}

		u1LikedU2AfterReset, _ := swipeRepo.HasLikedBack(ctx, u1.ID, u2.ID)
		if u1LikedU2AfterReset {
			t.Fatal("expected u1 swipe to be reset")
		}
	})

	t.Run("CreateMatch and GetMatchesForUser", func(t *testing.T) {
		match, err := matchRepo.CreateMatch(ctx, u2.ID, u1.ID)
		if err != nil {
			t.Fatalf("CreateMatch failed: %v", err)
		}
		if match == nil || match.ID == 0 {
			t.Fatalf("expected valid match, got %v", match)
		}

		// Verify user ordering (u1 < u2)
		if match.User1ID >= match.User2ID {
			t.Fatalf("expected User1ID (%d) < User2ID (%d)", match.User1ID, match.User2ID)
		}

		matchesU1, err := matchRepo.GetMatchesForUser(ctx, u1.ID)
		if err != nil {
			t.Fatalf("GetMatchesForUser u1 failed: %v", err)
		}
		if len(matchesU1) != 1 {
			t.Fatalf("expected 1 match for u1, got %d", len(matchesU1))
		}

		matchesU2, err := matchRepo.GetMatchesForUser(ctx, u2.ID)
		if err != nil {
			t.Fatalf("GetMatchesForUser u2 failed: %v", err)
		}
		if len(matchesU2) != 1 {
			t.Fatalf("expected 1 match for u2, got %d", len(matchesU2))
		}
	})
}
