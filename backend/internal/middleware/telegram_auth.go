package middleware

import (
	"net/http"

	"matchin-backend/internal/domain"
	"matchin-backend/internal/service"
	"github.com/gin-gonic/gin"
)

func TelegramAuthMiddleware(authService service.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		initData := c.GetHeader("X-Telegram-Init-Data")
		if initData == "" {
			initData = c.Query("init_data")
		}

		if initData == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing X-Telegram-Init-Data header or init_data query parameter"})
			c.Abort()
			return
		}

		user, err := authService.ValidateTelegramInitData(c.Request.Context(), initData)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized Telegram InitData: " + err.Error()})
			c.Abort()
			return
		}

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
