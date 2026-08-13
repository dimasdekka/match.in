package handler

import (
	"net/http"

	"matchin-backend/internal/domain"
	"matchin-backend/internal/middleware"
	"matchin-backend/internal/service"

	"github.com/gin-gonic/gin"
)

type ReportHandler struct {
	reportService service.ReportService
}

func NewReportHandler(reportService service.ReportService) *ReportHandler {
	return &ReportHandler{reportService: reportService}
}

func (h *ReportHandler) CreateReport(c *gin.Context) {
	user, exists := middleware.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	var req domain.ReportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid report request: " + err.Error()})
		return
	}
	if err := h.reportService.CreateReport(c.Request.Context(), user.ID, &req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create report: " + err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "Report submitted successfully"})
}
