package domain

import "time"

type SwipeAction string

const (
	ActionLike      SwipeAction = "like"
	ActionPass      SwipeAction = "pass"
	ActionSuperlike SwipeAction = "superlike"
)

type Swipe struct {
	ID        uint        `json:"id" gorm:"primaryKey"`
	SwiperID  uint        `json:"swiper_id" gorm:"not null;index:idx_swiper_target,unique"`
	TargetID  uint        `json:"target_id" gorm:"not null;index:idx_swiper_target,unique"`
	Action    SwipeAction `json:"action" gorm:"not null"`
	CreatedAt time.Time   `json:"created_at"`
}

type SwipeRequest struct {
	TargetID uint        `json:"target_id" binding:"required,gt=0"`
	Action   SwipeAction `json:"action" binding:"required,oneof=like pass superlike"`
}

type SwipeResponse struct {
	IsMatch bool     `json:"is_match"`
	Match   *Match   `json:"match,omitempty"`
	Profile *Profile `json:"profile,omitempty"`
}
