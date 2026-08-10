package handler

import (
	"net/http"

	"matchin-backend/internal/domain"
	"matchin-backend/internal/middleware"
	"matchin-backend/internal/service"
	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	userService service.UserService
}

func NewAuthHandler(userService service.UserService) *AuthHandler {
	return &AuthHandler{userService: userService}
}

func (h *AuthHandler) GetMe(c *gin.Context) {
	user, exists := middleware.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User session not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user": user,
	})
}

func (h *AuthHandler) UpdateLanguage(c *gin.Context) {
	user, exists := middleware.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User session not found"})
		return
	}

	var req domain.UpdateLangRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload: " + err.Error()})
		return
	}

	if err := h.userService.UpdateLanguage(c.Request.Context(), user.ID, req.LanguageCode); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update language: " + err.Error()})
		return
	}

	user.LanguageCode = req.LanguageCode
	c.JSON(http.StatusOK, gin.H{"message": "Language updated successfully", "user": user})
}
