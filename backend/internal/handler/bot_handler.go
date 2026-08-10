package handler

import (
	"log"
	"net/http"

	"matchin-backend/internal/domain"
	"matchin-backend/internal/service"

	"github.com/gin-gonic/gin"
)

type BotHandler struct {
	botService service.BotService
}

func NewBotHandler(botService service.BotService) *BotHandler {
	return &BotHandler{botService: botService}
}

func (h *BotHandler) HandleWebhook(c *gin.Context) {
	var update domain.TelegramBotUpdate
	if err := c.ShouldBindJSON(&update); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Telegram update payload: " + err.Error()})
		return
	}

	if err := h.botService.ProcessUpdate(c.Request.Context(), &update); err != nil {
		log.Printf("Error processing Telegram webhook update %d: %v\n", update.UpdateID, err)
		c.JSON(http.StatusOK, gin.H{"status": "error_handled", "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}
