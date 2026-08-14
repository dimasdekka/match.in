package handler_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"matchin-backend/internal/domain"
	"matchin-backend/internal/handler"
	"matchin-backend/internal/repository"
	"matchin-backend/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

func setupTestRouter(t *testing.T) (*gin.Engine, service.UserService) {
	t.Helper()
	gin.SetMode(gin.TestMode)

	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open sqlite memory db: %v", err)
	}

	err = db.AutoMigrate(&domain.User{}, &domain.Profile{}, &domain.Swipe{}, &domain.Match{})
	if err != nil {
		t.Fatalf("failed to migrate db: %v", err)
	}

	userRepo := repository.NewUserRepository(db)
	profileRepo := repository.NewProfileRepository(db)
	swipeRepo := repository.NewSwipeRepository(db)
	matchRepo := repository.NewMatchRepository(db)

	userService := service.NewUserService(userRepo)
	profileService := service.NewProfileService(profileRepo)
	botService := service.NewBotService("", "https://t.me/matchin_bot/app", userService, profileService)
	matchmakingService := service.NewMatchmakingService(swipeRepo, matchRepo, profileRepo, userRepo, botService)
	botService.SetMatchmakingService(matchmakingService)

	botHandler := handler.NewBotHandler(botService)

	r := gin.New()
	r.POST("/api/bot/webhook", botHandler.HandleWebhook)

	return r, userService
}

func TestBotWebhookHandler(t *testing.T) {
	r, userService := setupTestRouter(t)

	update := domain.TelegramBotUpdate{
		UpdateID: 999,
		Message: &domain.TelegramBotMessage{
			MessageID: 1,
			From: &domain.TelegramBotUser{
				ID:           777888,
				FirstName:    "WebhookUser",
				Username:     "webhook_user",
				LanguageCode: "en",
			},
			Chat: domain.TelegramBotChat{ID: 777888},
			Text: "/start",
		},
	}

	body, err := json.Marshal(update)
	if err != nil {
		t.Fatalf("failed to marshal payload: %v", err)
	}

	req := httptest.NewRequest(http.MethodPost, "/api/bot/webhook", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()

	r.ServeHTTP(resp, req)

	if resp.Code != http.StatusOK {
		t.Fatalf("expected status 200 OK, got %d", resp.Code)
	}

	user, err := userService.GetByTelegramID(req.Context(), 777888)
	if err != nil || user == nil {
		t.Fatalf("expected user to be created via webhook /start, got err=%v, user=%v", err, user)
	}
}
