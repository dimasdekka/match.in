package service

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/url"
	"sort"
	"strings"

	"matchin-backend/internal/domain"
	"matchin-backend/internal/repository"
)

type AuthService interface {
	ValidateTelegramInitData(initDataRaw string, botToken string) (*domain.User, error)
}

type authService struct {
	userRepo repository.UserRepository
}

func NewAuthService(userRepo repository.UserRepository) AuthService {
	return &authService{userRepo: userRepo}
}

type TelegramUserPayload struct {
	ID           int64  `json:"id"`
	FirstName    string `json:"first_name"`
	LastName     string `json:"last_name"`
	Username     string `json:"username"`
	LanguageCode string `json:"language_code"`
}

func (s *authService) ValidateTelegramInitData(initDataRaw string, botToken string) (*domain.User, error) {
	// Parse query params from initData
	values, err := url.ParseQuery(initDataRaw)
	if err != nil {
		return nil, fmt.Errorf("invalid initData query format: %w", err)
	}

	hashReceived := values.Get("hash")

	// If in dev mode without bot token, allow mock parsing for testing
	if botToken != "" && hashReceived != "" {
		// Build data_check_string
		var keys []string
		for k := range values {
			if k != "hash" {
				keys = append(keys, k)
			}
		}
		sort.Strings(keys)

		var pairs []string
		for _, k := range keys {
			pairs = append(pairs, fmt.Sprintf("%s=%s", k, values.Get(k)))
		}
		dataCheckString := strings.Join(pairs, "\n")

		// HMAC-SHA256 of botToken with key "WebAppData"
		secretHmac := hmac.New(sha256.New, []byte("WebAppData"))
		secretHmac.Write([]byte(botToken))
		secretKey := secretHmac.Sum(nil)

		// Calculate signature
		sigHmac := hmac.New(sha256.New, secretKey)
		sigHmac.Write([]byte(dataCheckString))
		calculatedHash := hex.EncodeToString(sigHmac.Sum(nil))

		if calculatedHash != hashReceived {
			return nil, fmt.Errorf("invalid telegram signature HMAC mismatch")
		}
	}

	// Extract User Payload
	userJSON := values.Get("user")
	var tgUser TelegramUserPayload

	if userJSON != "" {
		if err := json.Unmarshal([]byte(userJSON), &tgUser); err != nil {
			return nil, fmt.Errorf("failed to unmarshal telegram user JSON: %w", err)
		}
	} else {
		// Fallback mock user for initial browser dev testing
		tgUser = TelegramUserPayload{
			ID:           100000001,
			FirstName:    "Alex",
			LastName:     "Dev",
			Username:     "alex_dev",
			LanguageCode: "id",
		}
	}

	userLang := tgUser.LanguageCode
	if userLang == "" {
		userLang = "id"
	}

	user := &domain.User{
		TelegramID:   tgUser.ID,
		Username:     tgUser.Username,
		FirstName:    tgUser.FirstName,
		LastName:     tgUser.LastName,
		LanguageCode: userLang,
		IsActive:     true,
	}

	return user, nil
}
