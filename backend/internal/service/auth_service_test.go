package service_test

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/url"
	"sort"
	"strconv"
	"strings"
	"testing"
	"time"

	"matchin-backend/internal/domain"
	"matchin-backend/internal/service"
)

type mockUserService struct {
	users map[int64]*domain.User
}

func newMockUserService() *mockUserService {
	return &mockUserService{users: make(map[int64]*domain.User)}
}

func (m *mockUserService) GetUserByID(ctx context.Context, id uint) (*domain.User, error) {
	for _, u := range m.users {
		if u.ID == id {
			return u, nil
		}
	}
	return nil, fmt.Errorf("user not found")
}

func (m *mockUserService) GetByTelegramID(ctx context.Context, telegramID int64) (*domain.User, error) {
	u, ok := m.users[telegramID]
	if !ok {
		return nil, fmt.Errorf("user not found")
	}
	return u, nil
}

func (m *mockUserService) CreateOrUpdate(ctx context.Context, user *domain.User) error {
	if user.ID == 0 {
		user.ID = uint(len(m.users) + 1)
	}
	m.users[user.TelegramID] = user
	return nil
}

func (m *mockUserService) UpdateLanguage(ctx context.Context, userID uint, lang string) error {
	for _, u := range m.users {
		if u.ID == userID {
			u.LanguageCode = lang
			return nil
		}
	}
	return fmt.Errorf("user not found")
}

func generateTelegramInitData(botToken string, userJSON string, authDate int64, tamperedHash bool) string {
	values := url.Values{}
	if userJSON != "" {
		values.Set("user", userJSON)
	}
	if authDate != 0 {
		values.Set("auth_date", strconv.FormatInt(authDate, 10))
	}
	values.Set("query_id", "AAH_TEST_QUERY")

	var keys []string
	for k := range values {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	var pairs []string
	for _, k := range keys {
		pairs = append(pairs, fmt.Sprintf("%s=%s", k, values.Get(k)))
	}
	dataCheckString := strings.Join(pairs, "\n")

	secretHmac := hmac.New(sha256.New, []byte("WebAppData"))
	secretHmac.Write([]byte(botToken))
	secretKey := secretHmac.Sum(nil)

	sigHmac := hmac.New(sha256.New, secretKey)
	sigHmac.Write([]byte(dataCheckString))
	hash := hex.EncodeToString(sigHmac.Sum(nil))

	if tamperedHash {
		hash = "invalid_hash_signature_1234567890abcdef"
	}

	values.Set("hash", hash)
	return values.Encode()
}

func TestValidateTelegramInitData(t *testing.T) {
	botToken := "123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
	mockUser := newMockUserService()
	authSvc := service.NewAuthService(mockUser, botToken)
	ctx := context.Background()

	validUserJSON := `{"id":12345678,"first_name":"Budi","last_name":"Santoso","username":"budi_san","language_code":"id"}`
	now := time.Now().Unix()

	t.Run("Empty initDataRaw should fail", func(t *testing.T) {
		_, err := authSvc.ValidateTelegramInitData(ctx, "")
		if err == nil {
			t.Fatal("expected error for empty initDataRaw, got nil")
		}
	})

	t.Run("Empty botToken should fail", func(t *testing.T) {
		emptyBotSvc := service.NewAuthService(mockUser, "")
		_, err := emptyBotSvc.ValidateTelegramInitData(ctx, "user=test&hash=123")
		if err == nil {
			t.Fatal("expected error for empty botToken, got nil")
		}
	})

	t.Run("Missing hash parameter should fail", func(t *testing.T) {
		initData := fmt.Sprintf("auth_date=%d&user=%s", now, url.QueryEscape(validUserJSON))
		_, err := authSvc.ValidateTelegramInitData(ctx, initData)
		if err == nil || !strings.Contains(err.Error(), "missing hash signature") {
			t.Fatalf("expected missing hash error, got: %v", err)
		}
	})

	t.Run("Missing auth_date parameter should fail", func(t *testing.T) {
		initData := fmt.Sprintf("hash=123456&user=%s", url.QueryEscape(validUserJSON))
		_, err := authSvc.ValidateTelegramInitData(ctx, initData)
		if err == nil || !strings.Contains(err.Error(), "missing auth_date") {
			t.Fatalf("expected missing auth_date error, got: %v", err)
		}
	})

	t.Run("Expired auth_date (>24 hours) should fail", func(t *testing.T) {
		expiredDate := now - 90000 // 25 hours ago
		initData := generateTelegramInitData(botToken, validUserJSON, expiredDate, false)
		_, err := authSvc.ValidateTelegramInitData(ctx, initData)
		if err == nil || !strings.Contains(err.Error(), "expired") {
			t.Fatalf("expected expired auth_date error, got: %v", err)
		}
	})

	t.Run("Future auth_date (>300s in future) should fail", func(t *testing.T) {
		futureDate := now + 600 // 10 minutes in future
		initData := generateTelegramInitData(botToken, validUserJSON, futureDate, false)
		_, err := authSvc.ValidateTelegramInitData(ctx, initData)
		if err == nil || !strings.Contains(err.Error(), "expired or is invalid") {
			t.Fatalf("expected future auth_date error, got: %v", err)
		}
	})

	t.Run("Invalid HMAC hash signature should fail", func(t *testing.T) {
		initData := generateTelegramInitData(botToken, validUserJSON, now, true)
		_, err := authSvc.ValidateTelegramInitData(ctx, initData)
		if err == nil || !strings.Contains(err.Error(), "HMAC hash mismatch") {
			t.Fatalf("expected hash mismatch error, got: %v", err)
		}
	})

	t.Run("Missing user payload in initData should fail", func(t *testing.T) {
		initData := generateTelegramInitData(botToken, "", now, false)
		_, err := authSvc.ValidateTelegramInitData(ctx, initData)
		if err == nil || !strings.Contains(err.Error(), "missing user payload") {
			t.Fatalf("expected missing user payload error, got: %v", err)
		}
	})

	t.Run("Invalid JSON user payload should fail", func(t *testing.T) {
		initData := generateTelegramInitData(botToken, "{invalid_json}", now, false)
		_, err := authSvc.ValidateTelegramInitData(ctx, initData)
		if err == nil || !strings.Contains(err.Error(), "failed to unmarshal telegram user JSON") {
			t.Fatalf("expected unmarshal error, got: %v", err)
		}
	})

	t.Run("User ID 0 in payload should fail", func(t *testing.T) {
		zeroUserJSON := `{"id":0,"first_name":"Zero"}`
		initData := generateTelegramInitData(botToken, zeroUserJSON, now, false)
		_, err := authSvc.ValidateTelegramInitData(ctx, initData)
		if err == nil || !strings.Contains(err.Error(), "invalid telegram user ID: 0") {
			t.Fatalf("expected invalid telegram user ID error, got: %v", err)
		}
	})

	t.Run("User with empty language code defaults to id", func(t *testing.T) {
		noLangUserJSON := `{"id":888999,"first_name":"NoLang","last_name":"User","username":"nolang"}`
		initData := generateTelegramInitData(botToken, noLangUserJSON, now, false)
		user, err := authSvc.ValidateTelegramInitData(ctx, initData)
		if err != nil {
			t.Fatalf("expected success, got error: %v", err)
		}
		if user.LanguageCode != "id" {
			t.Fatalf("expected default language_code 'id', got '%s'", user.LanguageCode)
		}
	})

	t.Run("Valid initData signature should succeed", func(t *testing.T) {
		initData := generateTelegramInitData(botToken, validUserJSON, now, false)
		user, err := authSvc.ValidateTelegramInitData(ctx, initData)
		if err != nil {
			t.Fatalf("expected successful validation, got error: %v", err)
		}
		if user.TelegramID != 12345678 {
			t.Errorf("expected TelegramID 12345678, got %d", user.TelegramID)
		}
		if user.FirstName != "Budi" {
			t.Errorf("expected FirstName Budi, got %s", user.FirstName)
		}
		if user.LanguageCode != "id" {
			t.Errorf("expected LanguageCode id, got %s", user.LanguageCode)
		}
	})
}

