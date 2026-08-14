package handler

import (
	"net/http"
	"strconv"

	"matchin-backend/internal/domain"
	"matchin-backend/internal/middleware"
	"matchin-backend/internal/service"

	"github.com/gin-gonic/gin"
)

type ChatHandler struct {
	chatService service.ChatService
}

func NewChatHandler(chatService service.ChatService) *ChatHandler {
	return &ChatHandler{chatService: chatService}
}

func (h *ChatHandler) GetConversations(c *gin.Context) {
	user, exists := middleware.GetCurrentUser(c)
	if !exists || user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	conversations, err := h.chatService.GetConversations(c.Request.Context(), user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if conversations == nil {
		conversations = []*domain.Conversation{}
	}

	c.JSON(http.StatusOK, gin.H{"conversations": conversations})
}

func (h *ChatHandler) GetMessages(c *gin.Context) {
	user, exists := middleware.GetCurrentUser(c)
	if !exists || user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	matchIDParam := c.Param("match_id")
	matchID, err := strconv.ParseUint(matchIDParam, 10, 64)
	if err != nil || matchID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid match_id"})
		return
	}

	messages, err := h.chatService.GetMessages(c.Request.Context(), user.ID, uint(matchID))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if messages == nil {
		messages = []*domain.ChatMessage{}
	}

	c.JSON(http.StatusOK, gin.H{"messages": messages})
}

func (h *ChatHandler) SendMessage(c *gin.Context) {
	user, exists := middleware.GetCurrentUser(c)
	if !exists || user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	matchIDParam := c.Param("match_id")
	matchID, err := strconv.ParseUint(matchIDParam, 10, 64)
	if err != nil || matchID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid match_id"})
		return
	}

	var req domain.ChatMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload"})
		return
	}

	msg, err := h.chatService.SendMessage(c.Request.Context(), user.ID, uint(matchID), req.Content, req.ImageURL, req.MessageType)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": msg})
}

func (h *ChatHandler) ClearChat(c *gin.Context) {
	user, exists := middleware.GetCurrentUser(c)
	if !exists || user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	matchIDParam := c.Param("match_id")
	matchID, err := strconv.ParseUint(matchIDParam, 10, 64)
	if err != nil || matchID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid match_id"})
		return
	}

	if err := h.chatService.ClearChat(c.Request.Context(), user.ID, uint(matchID)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to clear chat: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Chat cleared successfully"})
}

func (h *ChatHandler) ReactMessage(c *gin.Context) {
	user, exists := middleware.GetCurrentUser(c)
	if !exists || user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	messageIDParam := c.Param("message_id")
	messageID, err := strconv.ParseUint(messageIDParam, 10, 64)
	if err != nil || messageID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid message_id"})
		return
	}

	var req struct {
		Reaction string `json:"reaction" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid reaction payload"})
		return
	}

	if err := h.chatService.ReactMessage(c.Request.Context(), user.ID, uint(messageID), req.Reaction); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to react: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Reaction updated"})
}
