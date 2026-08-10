package handler_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"matchin-backend/internal/domain"
	"matchin-backend/internal/handler"
	"matchin-backend/internal/middleware"
	"matchin-backend/internal/repository"
	"matchin-backend/internal/service"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

type fullTestApp struct {
	Router             *gin.Engine
	DB                 *gorm.DB
	UserService        service.UserService
	ProfileService     service.ProfileService
	MatchmakingService service.MatchmakingService
	AuthUser1          *domain.User
	AuthUser2          *domain.User
}

func setupAPIIntegrationRouter(t *testing.T) *fullTestApp {
	t.Helper()
	gin.SetMode(gin.TestMode)

	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open sqlite memory db: %v", err)
	}

	_ = db.AutoMigrate(&domain.User{}, &domain.Profile{}, &domain.Swipe{}, &domain.Match{})

	userRepo := repository.NewUserRepository(db)
	profileRepo := repository.NewProfileRepository(db)
	swipeRepo := repository.NewSwipeRepository(db)
	matchRepo := repository.NewMatchRepository(db)

	userService := service.NewUserService(userRepo)
	profileService := service.NewProfileService(profileRepo)
	botService := service.NewBotService("", "", userService, profileService)
	matchmakingService := service.NewMatchmakingService(swipeRepo, matchRepo, profileRepo, userRepo, botService)
	botService.SetMatchmakingService(matchmakingService)

	u1 := &domain.User{TelegramID: 80001, Username: "api_u1", FirstName: "API User 1", LanguageCode: "id"}
	u2 := &domain.User{TelegramID: 80002, Username: "api_u2", FirstName: "API User 2", LanguageCode: "en"}
	_ = userService.CreateOrUpdate(nil, u1)
	_ = userService.CreateOrUpdate(nil, u2)

	authHandler := handler.NewAuthHandler(userService)
	profileHandler := handler.NewProfileHandler(profileService)
	matchHandler := handler.NewMatchHandler(matchmakingService)

	r := gin.New()

	// Helper test middleware to inject authenticated user into Gin context
	r.Use(func(c *gin.Context) {
		authHeader := c.GetHeader("X-Test-User-ID")
		if authHeader == "u1" {
			c.Set("user", u1)
			c.Set("userID", u1.ID)
		} else if authHeader == "u2" {
			c.Set("user", u2)
			c.Set("userID", u2.ID)
		}
		c.Next()
	})

	api := r.Group("/api")
	{
		api.GET("/me", authHandler.GetMe)
		api.POST("/me/language", authHandler.UpdateLanguage)

		api.GET("/profile/me", profileHandler.GetMyProfile)
		api.POST("/profile/me", profileHandler.SaveProfile)
		api.GET("/recommendations", profileHandler.GetRecommendations)

		api.POST("/swipe", matchHandler.Swipe)
		api.GET("/matches", matchHandler.GetMatches)
	}

	return &fullTestApp{
		Router:             r,
		DB:                 db,
		UserService:        userService,
		ProfileService:     profileService,
		MatchmakingService: matchmakingService,
		AuthUser1:          u1,
		AuthUser2:          u2,
	}
}

func TestGetMeEndpoint(t *testing.T) {
	app := setupAPIIntegrationRouter(t)

	t.Run("GET /api/me unauthorized", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/me", nil)
		w := httptest.NewRecorder()
		app.Router.ServeHTTP(w, req)

		if w.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401 Unauthorized, got %d", w.Code)
		}
	})

	t.Run("GET /api/me success", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/me", nil)
		req.Header.Set("X-Test-User-ID", "u1")
		w := httptest.NewRecorder()
		app.Router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d", w.Code)
		}

		var resp map[string]interface{}
		_ = json.Unmarshal(w.Body.Bytes(), &resp)
		userMap, ok := resp["user"].(map[string]interface{})
		if !ok || userMap["username"] != "api_u1" {
			t.Fatalf("expected user api_u1 in response, got %v", resp)
		}
	})

	t.Run("POST /api/me/language success & failure", func(t *testing.T) {
		// Valid payload
		bodyBytes, _ := json.Marshal(domain.UpdateLangRequest{LanguageCode: "en"})
		req := httptest.NewRequest(http.MethodPost, "/api/me/language", bytes.NewBuffer(bodyBytes))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("X-Test-User-ID", "u1")
		w := httptest.NewRecorder()
		app.Router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d", w.Code)
		}

		// Invalid payload (oneof=id en)
		invalidBody, _ := json.Marshal(map[string]string{"language_code": "fr"})
		reqInvalid := httptest.NewRequest(http.MethodPost, "/api/me/language", bytes.NewBuffer(invalidBody))
		reqInvalid.Header.Set("Content-Type", "application/json")
		reqInvalid.Header.Set("X-Test-User-ID", "u1")
		wInvalid := httptest.NewRecorder()
		app.Router.ServeHTTP(wInvalid, reqInvalid)

		if wInvalid.Code != http.StatusBadRequest {
			t.Fatalf("expected 400 Bad Request for invalid lang code, got %d", wInvalid.Code)
		}
	})
}

func TestProfileEndpoints(t *testing.T) {
	app := setupAPIIntegrationRouter(t)

	t.Run("GET /api/profile/me (initially null)", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/profile/me", nil)
		req.Header.Set("X-Test-User-ID", "u1")
		w := httptest.NewRecorder()
		app.Router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d", w.Code)
		}
	})

	t.Run("POST /api/profile/me save profile", func(t *testing.T) {
		profileReq := domain.ProfileRequest{
			Name:         "API User One",
			Age:          25,
			Gender:       domain.GenderMale,
			TargetGender: domain.GenderFemale,
			Bio:          "Hello from API test",
			Country:      "Indonesia",
			City:         "Jakarta",
			Photos:       []string{"https://img.com/p.jpg"},
			Interests:    []string{"Coding"},
		}

		bodyBytes, _ := json.Marshal(profileReq)
		req := httptest.NewRequest(http.MethodPost, "/api/profile/me", bytes.NewBuffer(bodyBytes))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("X-Test-User-ID", "u1")
		w := httptest.NewRecorder()
		app.Router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("expected 200 OK saving profile, got %d: %s", w.Code, w.Body.String())
		}

		// GET profile again
		reqGet := httptest.NewRequest(http.MethodGet, "/api/profile/me", nil)
		reqGet.Header.Set("X-Test-User-ID", "u1")
		wGet := httptest.NewRecorder()
		app.Router.ServeHTTP(wGet, reqGet)

		if wGet.Code != http.StatusOK {
			t.Fatalf("expected 200 OK fetching saved profile, got %d", wGet.Code)
		}
	})

	t.Run("GET /api/recommendations", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/recommendations?limit=5", nil)
		req.Header.Set("X-Test-User-ID", "u1")
		w := httptest.NewRecorder()
		app.Router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("expected 200 OK recommendations, got %d", w.Code)
		}
	})
}

func TestSwipeAndMatchEndpoints(t *testing.T) {
	app := setupAPIIntegrationRouter(t)

	// Save profile for u1 and u2 first
	_, _ = app.ProfileService.SaveProfile(nil, app.AuthUser1.ID, &domain.ProfileRequest{
		Name: "U1", Age: 24, Gender: domain.GenderMale, TargetGender: domain.GenderFemale,
		Country: "Indonesia", City: "Jakarta",
	})
	_, _ = app.ProfileService.SaveProfile(nil, app.AuthUser2.ID, &domain.ProfileRequest{
		Name: "U2", Age: 22, Gender: domain.GenderFemale, TargetGender: domain.GenderMale,
		Country: "Indonesia", City: "Jakarta",
	})

	t.Run("POST /api/swipe invalid action", func(t *testing.T) {
		swipeBody, _ := json.Marshal(map[string]interface{}{"target_id": app.AuthUser2.ID, "action": "invalid_action"})
		req := httptest.NewRequest(http.MethodPost, "/api/swipe", bytes.NewBuffer(swipeBody))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("X-Test-User-ID", "u1")
		w := httptest.NewRecorder()
		app.Router.ServeHTTP(w, req)

		if w.Code != http.StatusBadRequest {
			t.Fatalf("expected 400 Bad Request for invalid swipe action, got %d", w.Code)
		}
	})

	t.Run("POST /api/swipe and GET /api/matches flow", func(t *testing.T) {
		// 1. u1 swipes like on u2
		swipeBody1, _ := json.Marshal(domain.SwipeRequest{TargetID: app.AuthUser2.ID, Action: domain.ActionLike})
		req1 := httptest.NewRequest(http.MethodPost, "/api/swipe", bytes.NewBuffer(swipeBody1))
		req1.Header.Set("Content-Type", "application/json")
		req1.Header.Set("X-Test-User-ID", "u1")
		w1 := httptest.NewRecorder()
		app.Router.ServeHTTP(w1, req1)

		if w1.Code != http.StatusOK {
			t.Fatalf("expected 200 OK on u1 swipe, got %d", w1.Code)
		}

		// 2. u2 swipes like on u1 (Mutual match!)
		swipeBody2, _ := json.Marshal(domain.SwipeRequest{TargetID: app.AuthUser1.ID, Action: domain.ActionLike})
		req2 := httptest.NewRequest(http.MethodPost, "/api/swipe", bytes.NewBuffer(swipeBody2))
		req2.Header.Set("Content-Type", "application/json")
		req2.Header.Set("X-Test-User-ID", "u2")
		w2 := httptest.NewRecorder()
		app.Router.ServeHTTP(w2, req2)

		if w2.Code != http.StatusOK {
			t.Fatalf("expected 200 OK on u2 mutual swipe, got %d", w2.Code)
		}

		var swipeResp domain.SwipeResponse
		_ = json.Unmarshal(w2.Body.Bytes(), &swipeResp)
		if !swipeResp.IsMatch {
			t.Fatalf("expected is_match true on mutual swipe, got %v", swipeResp)
		}

		// 3. GET /api/matches for u1
		reqMatches := httptest.NewRequest(http.MethodGet, "/api/matches", nil)
		reqMatches.Header.Set("X-Test-User-ID", "u1")
		wMatches := httptest.NewRecorder()
		app.Router.ServeHTTP(wMatches, reqMatches)

		if wMatches.Code != http.StatusOK {
			t.Fatalf("expected 200 OK on GET /api/matches, got %d", wMatches.Code)
		}
	})
}

func TestTelegramAuthMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)

	db, _ := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	_ = db.AutoMigrate(&domain.User{}, &domain.Profile{}, &domain.Swipe{}, &domain.Match{})

	userRepo := repository.NewUserRepository(db)
	userSvc := service.NewUserService(userRepo)
	authSvc := service.NewAuthService(userSvc, "123456:SECRET_BOT_TOKEN")

	r := gin.New()
	r.Use(middleware.TelegramAuthMiddleware(authSvc))
	r.GET("/protected", func(c *gin.Context) {
		u, exists := middleware.GetCurrentUser(c)
		if !exists {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "user not found in context"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"status": "ok", "telegram_id": u.TelegramID})
	})

	t.Run("Missing initData header returns 401", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/protected", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		if w.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401 Unauthorized, got %d", w.Code)
		}
	})

	t.Run("Invalid initData header returns 401", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/protected", nil)
		req.Header.Set("X-Telegram-Init-Data", "invalid_init_data_payload")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		if w.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401 Unauthorized, got %d", w.Code)
		}
	})
}
