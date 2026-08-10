package handler

import (
	"net/http"
	"strconv"

	"matchin-backend/internal/domain"
	"matchin-backend/internal/middleware"
	"matchin-backend/internal/service"
	"github.com/gin-gonic/gin"
)

type ProfileHandler struct {
	profileService service.ProfileService
}

func NewProfileHandler(profileService service.ProfileService) *ProfileHandler {
	return &ProfileHandler{profileService: profileService}
}

func (h *ProfileHandler) GetMyProfile(c *gin.Context) {
	user, exists := middleware.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	profile, err := h.profileService.GetProfileByUserID(c.Request.Context(), user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get profile: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"profile": profile})
}

func (h *ProfileHandler) SaveProfile(c *gin.Context) {
	user, exists := middleware.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req domain.ProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid profile payload: " + err.Error()})
		return
	}

	profile, err := h.profileService.SaveProfile(c.Request.Context(), user.ID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save profile: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Profile saved successfully", "profile": profile})
}

func (h *ProfileHandler) GetRecommendations(c *gin.Context) {
	user, exists := middleware.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	limitStr := c.DefaultQuery("limit", "10")
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 10
	}
	if limit > 50 {
		limit = 50
	}

	recommendations, err := h.profileService.GetRecommendations(c.Request.Context(), user.ID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch recommendations: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"profiles": recommendations})
}
