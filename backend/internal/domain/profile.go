package domain

import "time"

type Gender string

const (
	GenderMale   Gender = "male"
	GenderFemale Gender = "female"
	GenderAll    Gender = "all"
)

type LocationFilterMode string

const (
	FilterCity    LocationFilterMode = "same_city"
	FilterCountry LocationFilterMode = "same_country"
	FilterGlobal  LocationFilterMode = "global"
)

type Profile struct {
	ID                 uint               `json:"id" gorm:"primaryKey"`
	UserID             uint               `json:"user_id" gorm:"uniqueIndex;not null"`
	User               *User              `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Name               string             `json:"name" binding:"required"`
	Age                int                `json:"age" binding:"required,gte=18,lte=100"`
	Gender             Gender             `json:"gender" binding:"required"`
	TargetGender       Gender             `json:"target_gender" binding:"required"`
	Bio                string             `json:"bio"`
	VoiceBioURL        string             `json:"voice_bio_url"` // URL or Base64 voice intro
	Country            string             `json:"country" binding:"required"`
	City               string             `json:"city" binding:"required"`
	TargetLocationMode LocationFilterMode `json:"target_location_mode" gorm:"default:'same_city'"`
	MinAgePref         int                `json:"min_age_pref" gorm:"default:18"`
	MaxAgePref         int                `json:"max_age_pref" gorm:"default:50"`
	Photos             string             `json:"photos" gorm:"type:text"`    // JSON Array of image URLs
	Interests          string             `json:"interests" gorm:"type:text"` // JSON Array of interest tags
	IsVerified         bool               `json:"is_verified" gorm:"default:false"`
	IsPremium          bool               `json:"is_premium" gorm:"default:false"`
	IsBoosted          bool               `json:"is_boosted" gorm:"default:false"`
	BoostExpiresAt     *time.Time         `json:"boost_expires_at,omitempty"`
	CreatedAt          time.Time          `json:"created_at"`
	UpdatedAt          time.Time          `json:"updated_at"`
}

type ProfileRequest struct {
	Name               string             `json:"name" binding:"required,min=2,max=100"`
	Age                int                `json:"age" binding:"required,gte=18,lte=100"`
	Gender             Gender             `json:"gender" binding:"required,oneof=male female"`
	TargetGender       Gender             `json:"target_gender" binding:"required,oneof=male female all"`
	Bio                string             `json:"bio" binding:"max=1000"`
	VoiceBioURL        string             `json:"voice_bio_url" binding:"omitempty,url"`
	Country            string             `json:"country" binding:"required,max=100"`
	City               string             `json:"city" binding:"required,max=100"`
	TargetLocationMode LocationFilterMode `json:"target_location_mode" binding:"omitempty,oneof=same_city same_country global"`
	MinAgePref         int                `json:"min_age_pref" binding:"omitempty,gte=18,lte=100"`
	MaxAgePref         int                `json:"max_age_pref" binding:"omitempty,gte=18,lte=100"`
	Photos             []string           `json:"photos" binding:"omitempty,max=10"`
	Interests          []string           `json:"interests" binding:"omitempty,max=20"`
}
