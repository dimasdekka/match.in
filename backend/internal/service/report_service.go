package service

import (
	"context"
	"fmt"

	"matchin-backend/internal/domain"
	"matchin-backend/internal/repository"
)

type ReportService interface {
	CreateReport(ctx context.Context, reporterID uint, req *domain.ReportRequest) error
}

type reportService struct {
	reportRepo repository.ReportRepository
}

func NewReportService(reportRepo repository.ReportRepository) ReportService {
	return &reportService{reportRepo: reportRepo}
}

func (s *reportService) CreateReport(ctx context.Context, reporterID uint, req *domain.ReportRequest) error {
	report := &domain.Report{
		ReporterID: reporterID,
		ReportedID: req.ReportedID,
		MatchID:    req.MatchID,
		Reason:     req.Reason,
	}
	if err := s.reportRepo.Create(ctx, report); err != nil {
		return fmt.Errorf("failed to create report: %w", err)
	}
	return nil
}
