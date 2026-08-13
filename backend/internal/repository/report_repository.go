package repository

import (
	"context"
	"fmt"

	"matchin-backend/internal/domain"

	"gorm.io/gorm"
)

type ReportRepository interface {
	Create(ctx context.Context, report *domain.Report) error
}

type reportRepository struct {
	db *gorm.DB
}

func NewReportRepository(db *gorm.DB) ReportRepository {
	return &reportRepository{db: db}
}

func (r *reportRepository) Create(ctx context.Context, report *domain.Report) error {
	if err := r.db.WithContext(ctx).Create(report).Error; err != nil {
		return fmt.Errorf("failed to create report: %w", err)
	}
	return nil
}
