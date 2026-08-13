package handler

import (
	"net/http"

	"matchin-backend/internal/middleware"
	"matchin-backend/internal/service"

	"github.com/gin-gonic/gin"
)

type AccountHandler struct {
	accountService service.AccountService
}

func NewAccountHandler(accountService service.AccountService) *AccountHandler {
	return &AccountHandler{accountService: accountService}
}

func (h *AccountHandler) DeleteAccount(c *gin.Context) {
	user, exists := middleware.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	if err := h.accountService.DeleteAccount(c.Request.Context(), user.ID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete account: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Account deleted successfully"})
}
