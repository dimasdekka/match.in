package main

import (
	"context"
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
	wsPkg "matchin-backend/internal/websocket"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"golang.org/x/time/rate"
	"github.com/glebarez/sqlite"
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

	err = db.AutoMigrate(&domain.User{}, &domain.Profile{}, &domain.Swipe{}, &domain.Match{}, &domain.ChatMessage{}, &domain.Report{})
	if err != nil {
		log.Fatalf("Failed to auto-migrate database: %v", err)
	}

	userRepo := repository.NewUserRepository(db)
	profileRepo := repository.NewProfileRepository(db)
	swipeRepo := repository.NewSwipeRepository(db)
	matchRepo := repository.NewMatchRepository(db)
	chatRepo := repository.NewChatRepository(db)
	reportRepo := repository.NewReportRepository(db)

	webAppURL := os.Getenv("WEB_APP_URL")

	userService := service.NewUserService(userRepo)
	authService := service.NewAuthService(userService, botToken)
	profileService := service.NewProfileService(profileRepo)
	chatService := service.NewChatService(chatRepo, matchRepo, userRepo, profileRepo)
	botService := service.NewBotService(botToken, webAppURL, userService, profileService)
	matchmakingService := service.NewMatchmakingService(swipeRepo, matchRepo, profileRepo, userRepo, botService)
	reportService := service.NewReportService(reportRepo)
	accountService := service.NewAccountService(userRepo, profileRepo, swipeRepo, matchRepo, chatRepo)

	botService.SetMatchmakingService(matchmakingService)
	botService.SetAccountService(accountService)

	wsHub := wsPkg.NewHub()
	go wsHub.Run(context.Background())

	authHandler := handler.NewAuthHandler(userService)
	profileHandler := handler.NewProfileHandler(profileService)
	matchHandler := handler.NewMatchHandler(matchmakingService)
	chatHandler := handler.NewChatHandler(chatService)
	botHandler := handler.NewBotHandler(botService)
	reportHandler := handler.NewReportHandler(reportService)
	accountHandler := handler.NewAccountHandler(accountService)
	wsHandler := handler.NewWebSocketHandler(wsHub, authService, chatService, matchRepo, userRepo)

	if os.Getenv("ENABLE_BOT_POLLING") == "true" {
		go botService.StartPolling(context.Background())
	}

	r := gin.Default()
	r.MaxMultipartMemory = 10 << 20 // 10 MB limit

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

	// Realtime WebSocket Chat endpoints
	r.GET("/ws/chat", wsHandler.HandleWS)
	r.GET("/api/ws/chat", wsHandler.HandleWS)

	// Public Telegram Bot Webhook endpoint (POST /api/bot/webhook)
	r.POST("/api/bot/webhook", botHandler.HandleWebhook)

	api := r.Group("/api")
	api.Use(middleware.TelegramAuthMiddleware(authService))
	{
		api.GET("/me", authHandler.GetMe)
		api.DELETE("/me", accountHandler.DeleteAccount)
		api.POST("/me/language", authHandler.UpdateLanguage)

		api.GET("/profile/me", profileHandler.GetMyProfile)
		api.POST("/profile/me", profileHandler.SaveProfile)
		api.GET("/recommendations", profileHandler.GetRecommendations)

		api.POST("/swipe", matchHandler.Swipe)
		api.GET("/matches", matchHandler.GetMatches)
		api.GET("/likes/received", matchHandler.GetLikesReceived)
		api.GET("/likes/sent", matchHandler.GetLikesSent)
		api.DELETE("/matches/:match_id", matchHandler.Unmatch)

		api.GET("/chats", chatHandler.GetConversations)
		api.GET("/chats/:match_id/messages", chatHandler.GetMessages)
		api.POST("/chats/:match_id/messages", chatHandler.SendMessage)
		api.DELETE("/chats/:match_id/messages", chatHandler.ClearChat)
		api.POST("/chats/messages/:message_id/react", chatHandler.ReactMessage)

		api.POST("/reports", reportHandler.CreateReport)
	}

	fmt.Printf("🚀 Match.in / Ketemu.in Backend API running on port %s...\n", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Server stopped: %v", err)
	}
}
