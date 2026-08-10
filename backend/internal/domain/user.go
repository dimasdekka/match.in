package domain

import "time"

type User struct {
	ID           uint      `json:"id" gorm:"primaryKey"`
	TelegramID   int64     `json:"telegram_id" gorm:"uniqueIndex;not null"`
	Username     string    `json:"username"`
	FirstName    string    `json:"first_name"`
	LastName     string    `json:"last_name"`
	LanguageCode string    `json:"language_code" gorm:"default:'id'"` // 'id', 'en', etc.
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type AuthRequest struct {
	InitData string `json:"init_data" binding:"required"`
}

type AuthResponse struct {
	Token string `json:"token"`
	User  *User  `json:"user"`
}

type UpdateLangRequest struct {
	LanguageCode string `json:"language_code" binding:"required,oneof=id en"`
}
