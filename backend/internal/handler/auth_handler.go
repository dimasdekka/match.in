package handler

import (
	"net/http"

	"matchin-backend/internal/middleware"
	"matchin-backend/internal/repository"
	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	userRepo repository.UserRepository
}

func NewAuthHandler(userRepo repository.UserRepository) *AuthHandler {
	return &AuthHandler{userRepo: userRepo}
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

type UpdateLangRequest struct {
	LanguageCode string `json:"language_code" binding:"required"`
}

func (h *AuthHandler) UpdateLanguage(c *gin.Context) {
	user, exists := middleware.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User session not found"})
		return
	}

	var req UpdateLangRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload: " + err.Error()})
		return
	}

	if err := h.userRepo.UpdateLanguage(c.Request.Context(), user.ID, req.LanguageCode); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update language: " + err.Error()})
		return
	}

	user.LanguageCode = req.LanguageCode
	c.JSON(http.StatusOK, gin.H{"message": "Language updated successfully", "user": user})
}
