package middleware

import (
	"net/http"

	"matchin-backend/internal/domain"
	"matchin-backend/internal/repository"
	"matchin-backend/internal/service"
	"github.com/gin-gonic/gin"
)

func TelegramAuthMiddleware(authService service.AuthService, userRepo repository.UserRepository, botToken string) gin.HandlerFunc {
	return func(c *gin.Context) {
		initData := c.GetHeader("X-Telegram-Init-Data")
		if initData == "" {
			// Check query param fallback
			initData = c.Query("init_data")
		}

		// Validate Telegram InitData
		user, err := authService.ValidateTelegramInitData(initData, botToken)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized Telegram InitData: " + err.Error()})
			c.Abort()
			return
		}

		// Ensure user is created or updated in DB
		if err := userRepo.CreateOrUpdate(c.Request.Context(), user); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to persist user session: " + err.Error()})
			c.Abort()
			return
		}

		// Store user in Gin context
		c.Set("user", user)
		c.Set("userID", user.ID)
		c.Next()
	}
}

func GetCurrentUser(c *gin.Context) (*domain.User, bool) {
	u, exists := c.Get("user")
	if !exists {
		return nil, false
	}
	user, ok := u.(*domain.User)
	return user, ok
}
