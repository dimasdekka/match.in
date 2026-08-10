package handler

import (
	"net/http"

	"matchin-backend/internal/domain"
	"matchin-backend/internal/middleware"
	"matchin-backend/internal/service"
	"github.com/gin-gonic/gin"
)

type MatchHandler struct {
	matchmakingService service.MatchmakingService
}

func NewMatchHandler(matchmakingService service.MatchmakingService) *MatchHandler {
	return &MatchHandler{matchmakingService: matchmakingService}
}

func (h *MatchHandler) Swipe(c *gin.Context) {
	user, exists := middleware.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req domain.SwipeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid swipe request: " + err.Error()})
		return
	}

	response, err := h.matchmakingService.ProcessSwipe(c.Request.Context(), user.ID, &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to process swipe: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

func (h *MatchHandler) GetMatches(c *gin.Context) {
	user, exists := middleware.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	matches, err := h.matchmakingService.GetMatches(c.Request.Context(), user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch matches: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"matches": matches})
}
