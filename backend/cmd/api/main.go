package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"matchin-backend/internal/domain"
	"matchin-backend/internal/handler"
	"matchin-backend/internal/middleware"
	"matchin-backend/internal/repository"
	"matchin-backend/internal/service"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"golang.org/x/time/rate"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("Info: .env file not found or failed to load, falling back to environment variables")
	}

	botToken := os.Getenv("TELEGRAM_BOT_TOKEN")
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	dbPath := os.Getenv("DATABASE_URL")
	if dbPath == "" {
		dbPath = "matchin.db"
	}

	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database at %s: %v", dbPath, err)
	}

	err = db.AutoMigrate(&domain.User{}, &domain.Profile{}, &domain.Swipe{}, &domain.Match{}, &domain.ChatMessage{})
	if err != nil {
		log.Fatalf("Failed to auto-migrate database: %v", err)
	}

	if err := seedDemoData(db); err != nil {
		log.Printf("Warning: error seeding demo data: %v\n", err)
	}

	userRepo := repository.NewUserRepository(db)
	profileRepo := repository.NewProfileRepository(db)
	swipeRepo := repository.NewSwipeRepository(db)
	matchRepo := repository.NewMatchRepository(db)
	chatRepo := repository.NewChatRepository(db)

	webAppURL := os.Getenv("WEB_APP_URL")

	userService := service.NewUserService(userRepo)
	authService := service.NewAuthService(userService, botToken)
	profileService := service.NewProfileService(profileRepo)
	chatService := service.NewChatService(chatRepo, matchRepo, userRepo, profileRepo)
	botService := service.NewBotService(botToken, webAppURL, userService, profileService)
	matchmakingService := service.NewMatchmakingService(swipeRepo, matchRepo, profileRepo, userRepo, botService)

	botService.SetMatchmakingService(matchmakingService)

	authHandler := handler.NewAuthHandler(userService)
	profileHandler := handler.NewProfileHandler(profileService)
	matchHandler := handler.NewMatchHandler(matchmakingService)
	chatHandler := handler.NewChatHandler(chatService)
	botHandler := handler.NewBotHandler(botService)

	if os.Getenv("ENABLE_BOT_POLLING") == "true" {
		go botService.StartPolling(context.Background())
	}

	r := gin.Default()

	// Configure Rate Limiting Middleware (10 requests/sec with burst limit of 20)
	r.Use(middleware.RateLimitMiddleware(rate.Limit(10), 20))

	// Configure CORS Middleware using configurable origins
	corsOrigins := os.Getenv("CORS_ALLOWED_ORIGINS")
	config := cors.DefaultConfig()
	if corsOrigins != "" && corsOrigins != "*" {
		origins := strings.Split(corsOrigins, ",")
		var cleanedOrigins []string
		for _, o := range origins {
			trimmed := strings.TrimSpace(o)
			if trimmed != "" {
				cleanedOrigins = append(cleanedOrigins, trimmed)
			}
		}
		config.AllowAllOrigins = false
		config.AllowOrigins = cleanedOrigins
	} else {
		config.AllowAllOrigins = true
	}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Telegram-Init-Data"}
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	r.Use(cors.New(config))

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "app": "Match.in / Ketemu.in Backend"})
	})

	// Public Telegram Bot Webhook endpoint (POST /api/bot/webhook)
	r.POST("/api/bot/webhook", botHandler.HandleWebhook)

	api := r.Group("/api")
	api.Use(middleware.TelegramAuthMiddleware(authService))
	{
		api.GET("/me", authHandler.GetMe)
		api.POST("/me/language", authHandler.UpdateLanguage)

		api.GET("/profile/me", profileHandler.GetMyProfile)
		api.POST("/profile/me", profileHandler.SaveProfile)
		api.GET("/recommendations", profileHandler.GetRecommendations)

		api.POST("/swipe", matchHandler.Swipe)
		api.GET("/matches", matchHandler.GetMatches)

		api.GET("/chats", chatHandler.GetConversations)
		api.GET("/chats/:match_id/messages", chatHandler.GetMessages)
		api.POST("/chats/:match_id/messages", chatHandler.SendMessage)
	}

	fmt.Printf("🚀 Match.in / Ketemu.in Backend API running on port %s...\n", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Server stopped: %v", err)
	}
}

func seedDemoData(db *gorm.DB) error {
	var count int64
	if err := db.Model(&domain.User{}).Count(&count).Error; err != nil {
		return fmt.Errorf("failed to count existing users for seeding: %w", err)
	}
	if count > 0 {
		return nil
	}

	fmt.Println("🌱 Seeding realistic demo profiles for Match.in / Ketemu.in...")

	demoUsers := []struct {
		User    domain.User
		Profile domain.Profile
		Photos  []string
		Interests []string
	}{
		{
			User: domain.User{
				TelegramID:   999001,
				Username:     "siti_subang",
				FirstName:    "Siti",
				LastName:     "Aisyah",
				LanguageCode: "id",
				IsActive:     true,
			},
			Profile: domain.Profile{
				Name:               "Siti Aisyah",
				Age:                23,
				Gender:             domain.GenderFemale,
				TargetGender:       domain.GenderMale,
				Bio:                "Penyuka kopi, musik akustik & penikmat pemandangan alam. Yuk ngobrol santai! ☕✨",
				VoiceBioURL:        "https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg",
				Country:            "Indonesia",
				City:               "Subang",
				TargetLocationMode: domain.FilterCity,
				MinAgePref:         20,
				MaxAgePref:         30,
				IsVerified:         true,
				IsBoosted:          true,
			},
			Photos:    []string{"https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80"},
			Interests: []string{"Kopi", "Musik", "Travel", "Kuliner"},
		},
		{
			User: domain.User{
				TelegramID:   999002,
				Username:     "dian_bandung",
				FirstName:    "Dian",
				LastName:     "Sastro",
				LanguageCode: "id",
				IsActive:     true,
			},
			Profile: domain.Profile{
				Name:               "Dian Lestari",
				Age:                25,
				Gender:             domain.GenderFemale,
				TargetGender:       domain.GenderMale,
				Bio:                "Designer & penikmat seni di Bandung. Suka fotografi & hunting tempat lucu! 📸🎨",
				VoiceBioURL:        "https://actions.google.com/sounds/v1/human_voices/applause.ogg",
				Country:            "Indonesia",
				City:               "Bandung",
				TargetLocationMode: domain.FilterCountry,
				MinAgePref:         22,
				MaxAgePref:         32,
				IsVerified:         true,
			},
			Photos:    []string{"https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop&q=80"},
			Interests: []string{"Art", "Design", "Fotografi", "Kopi"},
		},
		{
			User: domain.User{
				TelegramID:   999003,
				Username:     "budi_jakarta",
				FirstName:    "Budi",
				LastName:     "Santoso",
				LanguageCode: "id",
				IsActive:     true,
			},
			Profile: domain.Profile{
				Name:               "Budi Santoso",
				Age:                27,
				Gender:             domain.GenderMale,
				TargetGender:       domain.GenderFemale,
				Bio:                "Software Engineer di Jakarta. Suka olahraga, badminton & ngopi akhir pekan 🏸💻",
				VoiceBioURL:        "",
				Country:            "Indonesia",
				City:               "Jakarta",
				TargetLocationMode: domain.FilterCity,
				MinAgePref:         20,
				MaxAgePref:         28,
				IsVerified:         true,
			},
			Photos:    []string{"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80"},
			Interests: []string{"Coding", "Badminton", "Kopi", "Tech"},
		},
		{
			User: domain.User{
				TelegramID:   999004,
				Username:     "sophia_sg",
				FirstName:    "Sophia",
				LastName:     "Chen",
				LanguageCode: "en",
				IsActive:     true,
			},
			Profile: domain.Profile{
				Name:               "Sophia Chen",
				Age:                24,
				Gender:             domain.GenderFemale,
				TargetGender:       domain.GenderMale,
				Bio:                "Based in Singapore 🇸🇬 Foodie, gym enthusiast & cafe hopper. Let's match & explore!",
				VoiceBioURL:        "",
				Country:            "Singapore",
				City:               "Singapore",
				TargetLocationMode: domain.FilterGlobal,
				MinAgePref:         22,
				MaxAgePref:         32,
				IsVerified:         true,
			},
			Photos:    []string{"https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80"},
			Interests: []string{"Fitness", "Foodie", "Travel", "Cafe"},
		},
	}

	for _, item := range demoUsers {
		u := item.User
		if err := db.Create(&u).Error; err != nil {
			return fmt.Errorf("failed to create demo user %d: %w", u.TelegramID, err)
		}
		p := item.Profile
		p.UserID = u.ID

		photosBytes, err := json.Marshal(item.Photos)
		if err != nil {
			return fmt.Errorf("failed to marshal demo photos: %w", err)
		}
		p.Photos = string(photosBytes)

		interestsBytes, err := json.Marshal(item.Interests)
		if err != nil {
			return fmt.Errorf("failed to marshal demo interests: %w", err)
		}
		p.Interests = string(interestsBytes)

		if err := db.Create(&p).Error; err != nil {
			return fmt.Errorf("failed to create demo profile for user %d: %w", u.ID, err)
		}
	}

	fmt.Println("✅ Demo profiles seeded successfully!")
	return nil
}
