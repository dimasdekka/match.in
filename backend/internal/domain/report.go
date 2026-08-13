package domain

import "time"

type Report struct {
	ID         uint      `json:"id" gorm:"primaryKey"`
	ReporterID uint      `json:"reporter_id" gorm:"not null;index"`
	ReportedID uint      `json:"reported_id" gorm:"not null;index"`
	MatchID    uint      `json:"match_id"`
	Reason     string    `json:"reason" gorm:"type:text"`
	CreatedAt  time.Time `json:"created_at"`
}

type ReportRequest struct {
	ReportedID uint   `json:"reported_id" binding:"required"`
	MatchID    uint   `json:"match_id"`
	Reason     string `json:"reason"`
}
