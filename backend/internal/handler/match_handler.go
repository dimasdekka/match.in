package handler

import (
	"net/http"
	"strconv"

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

	if matches == nil {
		matches = []*domain.MatchDetail{}
	}

	c.JSON(http.StatusOK, gin.H{"matches": matches})
}

func (h *MatchHandler) GetLikesReceived(c *gin.Context) {
	user, exists := middleware.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	profiles, err := h.matchmakingService.GetLikesReceived(c.Request.Context(), user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch incoming likes: " + err.Error()})
		return
	}

	if profiles == nil {
		profiles = []*domain.Profile{}
	}

	c.JSON(http.StatusOK, gin.H{"profiles": profiles})
}

func (h *MatchHandler) GetLikesSent(c *gin.Context) {
	user, exists := middleware.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	profiles, err := h.matchmakingService.GetLikesSent(c.Request.Context(), user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch sent likes: " + err.Error()})
		return
	}

	if profiles == nil {
		profiles = []*domain.Profile{}
	}

	c.JSON(http.StatusOK, gin.H{"profiles": profiles})
}

func (h *MatchHandler) Unmatch(c *gin.Context) {
	user, exists := middleware.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	matchIDParam := c.Param("match_id")
	matchID, err := strconv.ParseUint(matchIDParam, 10, 64)
	if err != nil || matchID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid match_id"})
		return
	}

	if err := h.matchmakingService.Unmatch(c.Request.Context(), user.ID, uint(matchID)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to unmatch: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Unmatched successfully"})
}
