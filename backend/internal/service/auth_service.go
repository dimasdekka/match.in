package service

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/url"
	"sort"
	"strconv"
	"strings"
	"time"

	"matchin-backend/internal/domain"
)

type AuthService interface {
	ValidateTelegramInitData(ctx context.Context, initDataRaw string) (*domain.User, error)
}

type authService struct {
	userService UserService
	botToken    string
}

func NewAuthService(userService UserService, botToken string) AuthService {
	return &authService{
		userService: userService,
		botToken:    botToken,
	}
}

type TelegramUserPayload struct {
	ID           int64  `json:"id"`
	FirstName    string `json:"first_name"`
	LastName     string `json:"last_name"`
	Username     string `json:"username"`
	LanguageCode string `json:"language_code"`
}

func (s *authService) ValidateTelegramInitData(ctx context.Context, initDataRaw string) (*domain.User, error) {
	if initDataRaw == "" {
		return nil, fmt.Errorf("missing initData string")
	}

	if s.botToken == "" {
		return nil, fmt.Errorf("server configuration error: TELEGRAM_BOT_TOKEN is missing")
	}

	values, err := url.ParseQuery(initDataRaw)
	if err != nil {
		return nil, fmt.Errorf("invalid initData query format: %w", err)
	}

	hashReceived := values.Get("hash")
	if hashReceived == "" {
		return nil, fmt.Errorf("missing hash signature in initData")
	}

	authDateStr := values.Get("auth_date")
	if authDateStr == "" {
		return nil, fmt.Errorf("missing auth_date in initData")
	}

	authDate, err := strconv.ParseInt(authDateStr, 10, 64)
	if err != nil {
		return nil, fmt.Errorf("invalid auth_date parameter: %w", err)
	}

	now := time.Now().Unix()
	if now-authDate > 86400 || authDate > now+300 {
		return nil, fmt.Errorf("initData auth_date has expired or is invalid (age > 24 hours)")
	}

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

	secretHmac := hmac.New(sha256.New, []byte("WebAppData"))
	secretHmac.Write([]byte(s.botToken))
	secretKey := secretHmac.Sum(nil)

	sigHmac := hmac.New(sha256.New, secretKey)
	sigHmac.Write([]byte(dataCheckString))
	calculatedHash := hex.EncodeToString(sigHmac.Sum(nil))

	if subtle.ConstantTimeCompare([]byte(calculatedHash), []byte(hashReceived)) != 1 {
		return nil, fmt.Errorf("invalid telegram signature: HMAC hash mismatch")
	}

	userJSON := values.Get("user")
	if userJSON == "" {
		return nil, fmt.Errorf("missing user payload in initData")
	}

	var tgUser TelegramUserPayload
	if err := json.Unmarshal([]byte(userJSON), &tgUser); err != nil {
		return nil, fmt.Errorf("failed to unmarshal telegram user JSON: %w", err)
	}

	if tgUser.ID == 0 {
		return nil, fmt.Errorf("invalid telegram user ID: 0")
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

	if err := s.userService.CreateOrUpdate(ctx, user); err != nil {
		return nil, fmt.Errorf("failed to authenticate user: %w", err)
	}

	return user, nil
}
