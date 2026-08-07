package domain

import "time"

type Match struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	User1ID   uint      `json:"user1_id" gorm:"not null;index:idx_user_pair,unique"`
	User2ID   uint      `json:"user2_id" gorm:"not null;index:idx_user_pair,unique"`
	User1     *User     `json:"user1,omitempty" gorm:"foreignKey:User1ID"`
	User2     *User     `json:"user2,omitempty" gorm:"foreignKey:User2ID"`
	IsActive  bool      `json:"is_active" gorm:"default:true"`
	CreatedAt time.Time `json:"created_at"`
}

type MatchDetail struct {
	MatchID            uint      `json:"match_id"`
	MatchedUser        *User     `json:"matched_user"`
	MatchedProfile     *Profile  `json:"matched_profile"`
	TelegramUsername   string    `json:"telegram_username"`
	DirectTelegramLink string    `json:"direct_telegram_link"`
	MatchedAt          time.Time `json:"matched_at"`
}
