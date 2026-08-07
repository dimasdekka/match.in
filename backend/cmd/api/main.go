package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"matchin-backend/internal/domain"
	"matchin-backend/internal/handler"
	"matchin-backend/internal/middleware"
	"matchin-backend/internal/repository"
	"matchin-backend/internal/service"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func main() {
	_ = godotenv.Load()

	botToken := os.Getenv("TELEGRAM_BOT_TOKEN")
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Initialize SQLite Database
	db, err := gorm.Open(sqlite.Open("matchin.db"), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Auto Migrate Schemas
	err = db.AutoMigrate(&domain.User{}, &domain.Profile{}, &domain.Swipe{}, &domain.Match{})
	if err != nil {
		log.Fatalf("Failed to auto-migrate database: %v", err)
	}

	// Seed Sample Demo Data if Database is empty
	seedDemoData(db)

	// Dependency Injection (Clean Architecture)
	userRepo := repository.NewUserRepository(db)
	profileRepo := repository.NewProfileRepository(db)
	swipeRepo := repository.NewSwipeRepository(db)
	matchRepo := repository.NewMatchRepository(db)

	botService := service.NewBotService(botToken)
	authService := service.NewAuthService(userRepo)
	profileService := service.NewProfileService(profileRepo)
	matchmakingService := service.NewMatchmakingService(swipeRepo, matchRepo, profileRepo, userRepo, botService)

	authHandler := handler.NewAuthHandler(userRepo)
	profileHandler := handler.NewProfileHandler(profileService)
	matchHandler := handler.NewMatchHandler(matchmakingService)

	// Router Setup
	r := gin.Default()

	// CORS Setup
	config := cors.DefaultConfig()
	config.AllowAllOrigins = true
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Telegram-Init-Data"}
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	r.Use(cors.New(config))

	// Health Check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "app": "Match.in / Ketemu.in Backend"})
	})

	// Authenticated API Routes
	api := r.Group("/api")
	api.Use(middleware.TelegramAuthMiddleware(authService, userRepo, botToken))
	{
		api.GET("/me", authHandler.GetMe)
		api.POST("/me/language", authHandler.UpdateLanguage)

		api.GET("/profile/me", profileHandler.GetMyProfile)
		api.POST("/profile/me", profileHandler.SaveProfile)
		api.GET("/recommendations", profileHandler.GetRecommendations)

		api.POST("/swipe", matchHandler.Swipe)
		api.GET("/matches", matchHandler.GetMatches)
	}

	fmt.Printf("🚀 Match.in / Ketemu.in Backend API running on port %s...\n", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Server stopped: %v", err)
	}
}

func seedDemoData(db *gorm.DB) {
	var count int64
	db.Model(&domain.User{}).Count(&count)
	if count > 0 {
		return
	}

	fmt.Println("🌱 Seeding realistic demo profiles for Match.in / Ketemu.in...")

	demoUsers := []struct {
		User    domain.User
		Profile domain.Profile
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
				Photos:             mustMarshal([]string{"https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80"}),
				Interests:          mustMarshal([]string{"Kopi", "Musik", "Travel", "Kuliner"}),
			},
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
				Photos:             mustMarshal([]string{"https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop&q=80"}),
				Interests:          mustMarshal([]string{"Art", "Design", "Fotografi", "Kopi"}),
			},
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
				Photos:             mustMarshal([]string{"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80"}),
				Interests:          mustMarshal([]string{"Coding", "Badminton", "Kopi", "Tech"}),
			},
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
				Photos:             mustMarshal([]string{"https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80"}),
				Interests:          mustMarshal([]string{"Fitness", "Foodie", "Travel", "Cafe"}),
			},
		},
	}

	for _, item := range demoUsers {
		u := item.User
		db.Create(&u)
		p := item.Profile
		p.UserID = u.ID
		db.Create(&p)
	}

	fmt.Println("✅ Demo profiles seeded successfully!")
}

func mustMarshal(v interface{}) string {
	b, _ := json.Marshal(v)
	return string(b)
}
