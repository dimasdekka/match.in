package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"matchin-backend/internal/domain"
	"matchin-backend/pkg/i18n"
)

type BotService interface {
	SendMatchNotification(ctx context.Context, telegramID int64, matchedName string, matchedTelegramUsername string, langCode string) error
	ProcessUpdate(ctx context.Context, update *domain.TelegramBotUpdate) error
	SendMessage(ctx context.Context, payload *TelegramSendMessagePayload) error
	StartPolling(ctx context.Context)
	SetMatchmakingService(matchmakingService MatchmakingService)
}

type botService struct {
	botToken           string
	webAppURL          string
	client             *http.Client
	userService        UserService
	profileService     ProfileService
	matchmakingService MatchmakingService
}

func NewBotService(
	botToken string,
	webAppURL string,
	userService UserService,
	profileService ProfileService,
) BotService {
	return &botService{
		botToken:       botToken,
		webAppURL:      webAppURL,
		client:         &http.Client{Timeout: 10 * time.Second},
		userService:    userService,
		profileService: profileService,
	}
}

func (s *botService) SetMatchmakingService(matchmakingService MatchmakingService) {
	s.matchmakingService = matchmakingService
}

type TelegramSendMessagePayload struct {
	ChatID      int64                  `json:"chat_id"`
	Text        string                 `json:"text"`
	ParseMode   string                 `json:"parse_mode"`
	ReplyMarkup map[string]interface{} `json:"reply_markup,omitempty"`
}

func (s *botService) SendMatchNotification(ctx context.Context, telegramID int64, matchedName string, matchedTelegramUsername string, langCode string) error {
	if s.botToken == "" {
		log.Printf("[BOT MOCK NOTIF] To TelegramID: %d | Matched with: %s (@%s)\n", telegramID, matchedName, matchedTelegramUsername)
		return nil
	}

	dict := i18n.GetDict(langCode)
	msgText := fmt.Sprintf("%s\n\n"+dict.NewMatchMessage, dict.NewMatchTitle, matchedName)

	payload := TelegramSendMessagePayload{
		ChatID:    telegramID,
		Text:      msgText,
		ParseMode: "HTML",
	}

	if matchedTelegramUsername != "" {
		payload.ReplyMarkup = map[string]interface{}{
			"inline_keyboard": [][]map[string]string{
				{
					{
						"text": "💬 Chat @" + matchedTelegramUsername,
						"url":  "https://t.me/" + matchedTelegramUsername,
					},
				},
			},
		}
	}

	return s.SendMessage(ctx, &payload)
}

func (s *botService) SendMessage(ctx context.Context, payload *TelegramSendMessagePayload) error {
	if payload == nil {
		return fmt.Errorf("send message payload cannot be nil")
	}

	if s.botToken == "" {
		log.Printf("[BOT MOCK SEND] To ChatID: %d | Text: %s\n", payload.ChatID, payload.Text)
		return nil
	}

	bodyBytes, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal bot payload: %w", err)
	}

	apiURL := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", s.botToken)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, apiURL, bytes.NewBuffer(bodyBytes))
	if err != nil {
		return fmt.Errorf("failed to create http request for bot notification: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send bot message: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("telegram bot API returned status: %d", resp.StatusCode)
	}

	return nil
}

func (s *botService) ProcessUpdate(ctx context.Context, update *domain.TelegramBotUpdate) error {
	if update == nil || update.Message == nil {
		return nil
	}

	msg := update.Message
	if msg.From == nil || msg.Text == "" {
		return nil
	}

	chatID := msg.Chat.ID
	userPayload := msg.From
	text := strings.TrimSpace(msg.Text)

	lang := userPayload.LanguageCode
	if lang == "" {
		lang = "id"
	}

	dbUser := &domain.User{
		TelegramID:   userPayload.ID,
		Username:     userPayload.Username,
		FirstName:    userPayload.FirstName,
		LastName:     userPayload.LastName,
		LanguageCode: lang,
		IsActive:     true,
	}

	if s.userService != nil {
		if err := s.userService.CreateOrUpdate(ctx, dbUser); err != nil {
			log.Printf("Warning: failed to sync user %d from bot update: %v\n", userPayload.ID, err)
		} else {
			if existingUser, err := s.userService.GetByTelegramID(ctx, userPayload.ID); err == nil && existingUser != nil {
				dbUser = existingUser
			}
		}
	}

	cmd := text
	if idx := strings.Index(text, " "); idx != -1 {
		cmd = text[:idx]
	}
	if idx := strings.Index(cmd, "@"); idx != -1 {
		cmd = cmd[:idx]
	}

	switch strings.ToLower(cmd) {
	case "/start":
		return s.handleStartCommand(ctx, chatID, dbUser)
	case "/search":
		return s.handleSearchCommand(ctx, chatID, dbUser)
	case "/profile":
		return s.handleProfileCommand(ctx, chatID, dbUser)
	case "/matches":
		return s.handleMatchesCommand(ctx, chatID, dbUser)
	case "/reset":
		return s.handleResetCommand(ctx, chatID, dbUser)
	case "/help":
		return s.handleHelpCommand(ctx, chatID, dbUser)
	default:
		if strings.HasPrefix(text, "/") {
			dict := i18n.GetDict(dbUser.LanguageCode)
			return s.SendMessage(ctx, &TelegramSendMessagePayload{
				ChatID:    chatID,
				Text:      dict.BotUnknownCommand,
				ParseMode: "HTML",
			})
		}
		return s.handleHelpCommand(ctx, chatID, dbUser)
	}
}

func (s *botService) handleStartCommand(ctx context.Context, chatID int64, user *domain.User) error {
	dict := i18n.GetDict(user.LanguageCode)
	text := dict.BotWelcome

	appURL := s.webAppURL
	if appURL == "" {
		appURL = "https://t.me/matchin_bot/app"
	}

	replyMarkup := map[string]interface{}{
		"inline_keyboard": [][]map[string]interface{}{
			{
				{
					"text":    "🚀 " + dict.AppName + " Mini App",
					"web_app": map[string]string{"url": appURL},
				},
			},
		},
	}

	payload := &TelegramSendMessagePayload{
		ChatID:      chatID,
		Text:        text,
		ParseMode:   "HTML",
		ReplyMarkup: replyMarkup,
	}

	return s.SendMessage(ctx, payload)
}

func (s *botService) handleSearchCommand(ctx context.Context, chatID int64, user *domain.User) error {
	dict := i18n.GetDict(user.LanguageCode)

	if s.profileService == nil {
		return fmt.Errorf("profile service is not configured")
	}

	recs, err := s.profileService.GetRecommendations(ctx, user.ID, 3)
	if err != nil {
		return fmt.Errorf("failed to search recommendations for user %d: %w", user.ID, err)
	}

	if len(recs) == 0 {
		return s.SendMessage(ctx, &TelegramSendMessagePayload{
			ChatID:    chatID,
			Text:      dict.BotNoRecommendations,
			ParseMode: "HTML",
		})
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("🔍 <b>%s Candidate Recommendations</b> (%d found):\n\n", dict.AppName, len(recs)))

	for i, rec := range recs {
		interestsStr := "-"
		if rec.Interests != "" {
			var interestsArr []string
			if err := json.Unmarshal([]byte(rec.Interests), &interestsArr); err == nil && len(interestsArr) > 0 {
				interestsStr = strings.Join(interestsArr, ", ")
			}
		}

		location := fmt.Sprintf("%s, %s", rec.City, rec.Country)
		bio := rec.Bio
		if bio == "" {
			bio = "No bio provided."
		}

		sb.WriteString(fmt.Sprintf("%d. <b>%s</b>, %d\n", i+1, rec.Name, rec.Age))
		sb.WriteString(fmt.Sprintf("📍 Location: %s\n", location))
		sb.WriteString(fmt.Sprintf("💬 <i>\"%s\"</i>\n", bio))
		sb.WriteString(fmt.Sprintf("🏷️ Interests: %s\n\n", interestsStr))
	}

	appURL := s.webAppURL
	if appURL == "" {
		appURL = "https://t.me/matchin_bot/app"
	}

	replyMarkup := map[string]interface{}{
		"inline_keyboard": [][]map[string]interface{}{
			{
				{
					"text":    "💖 Swipe in Mini App",
					"web_app": map[string]string{"url": appURL},
				},
			},
		},
	}

	return s.SendMessage(ctx, &TelegramSendMessagePayload{
		ChatID:      chatID,
		Text:        sb.String(),
		ParseMode:   "HTML",
		ReplyMarkup: replyMarkup,
	})
}

func (s *botService) handleProfileCommand(ctx context.Context, chatID int64, user *domain.User) error {
	dict := i18n.GetDict(user.LanguageCode)

	if s.profileService == nil {
		return fmt.Errorf("profile service is not configured")
	}

	profile, err := s.profileService.GetProfileByUserID(ctx, user.ID)
	if err != nil {
		return fmt.Errorf("failed to fetch user profile: %w", err)
	}

	if profile == nil {
		return s.SendMessage(ctx, &TelegramSendMessagePayload{
			ChatID:    chatID,
			Text:      dict.BotNoProfile,
			ParseMode: "HTML",
		})
	}

	interestsStr := "-"
	if profile.Interests != "" {
		var interestsArr []string
		if err := json.Unmarshal([]byte(profile.Interests), &interestsArr); err == nil && len(interestsArr) > 0 {
			interestsStr = strings.Join(interestsArr, ", ")
		}
	}

	verifiedBadge := "❌ Not Verified"
	if profile.IsVerified {
		verifiedBadge = "✅ Verified Profile"
	}

	text := fmt.Sprintf(
		"👤 <b>Your %s Profile</b>\n\n"+
			"<b>Name:</b> %s\n"+
			"<b>Age:</b> %d\n"+
			"<b>Gender:</b> %s\n"+
			"<b>Target Gender:</b> %s\n"+
			"<b>Location:</b> %s, %s (%s)\n"+
			"<b>Age Preference:</b> %d - %d\n"+
			"<b>Bio:</b> %s\n"+
			"<b>Interests:</b> %s\n"+
			"<b>Status:</b> %s\n",
		dict.AppName,
		profile.Name,
		profile.Age,
		profile.Gender,
		profile.TargetGender,
		profile.City, profile.Country, profile.TargetLocationMode,
		profile.MinAgePref, profile.MaxAgePref,
		profile.Bio,
		interestsStr,
		verifiedBadge,
	)

	return s.SendMessage(ctx, &TelegramSendMessagePayload{
		ChatID:    chatID,
		Text:      text,
		ParseMode: "HTML",
	})
}

func (s *botService) handleMatchesCommand(ctx context.Context, chatID int64, user *domain.User) error {
	dict := i18n.GetDict(user.LanguageCode)

	if s.matchmakingService == nil {
		return fmt.Errorf("matchmaking service is not configured")
	}

	matches, err := s.matchmakingService.GetMatches(ctx, user.ID)
	if err != nil {
		return fmt.Errorf("failed to get matches for user %d: %w", user.ID, err)
	}

	if len(matches) == 0 {
		return s.SendMessage(ctx, &TelegramSendMessagePayload{
			ChatID:    chatID,
			Text:      dict.BotNoMatches,
			ParseMode: "HTML",
		})
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("🎉 <b>Your %s Matches</b> (%d):\n\n", dict.AppName, len(matches)))

	for i, m := range matches {
		name := "Unknown"
		age := 0
		city := ""
		if m.MatchedProfile != nil {
			name = m.MatchedProfile.Name
			age = m.MatchedProfile.Age
			city = m.MatchedProfile.City
		} else if m.MatchedUser != nil {
			name = m.MatchedUser.FirstName
		}

		chatLink := m.DirectTelegramLink
		if chatLink == "" && m.TelegramUsername != "" {
			chatLink = "https://t.me/" + m.TelegramUsername
		}

		sb.WriteString(fmt.Sprintf("%d. <b>%s</b> (%d, %s)\n", i+1, name, age, city))
		if m.TelegramUsername != "" {
			sb.WriteString(fmt.Sprintf("   💬 Telegram: @%s\n", m.TelegramUsername))
		}
		if chatLink != "" {
			sb.WriteString(fmt.Sprintf("   🔗 Chat Link: %s\n", chatLink))
		}
		sb.WriteString("\n")
	}

	return s.SendMessage(ctx, &TelegramSendMessagePayload{
		ChatID:    chatID,
		Text:      sb.String(),
		ParseMode: "HTML",
	})
}

func (s *botService) handleResetCommand(ctx context.Context, chatID int64, user *domain.User) error {
	dict := i18n.GetDict(user.LanguageCode)

	if s.matchmakingService == nil {
		return fmt.Errorf("matchmaking service is not configured")
	}

	if err := s.matchmakingService.ResetSwipes(ctx, user.ID); err != nil {
		return fmt.Errorf("failed to reset swipe history for user %d: %w", user.ID, err)
	}

	return s.SendMessage(ctx, &TelegramSendMessagePayload{
		ChatID:    chatID,
		Text:      dict.BotResetSuccess,
		ParseMode: "HTML",
	})
}

func (s *botService) handleHelpCommand(ctx context.Context, chatID int64, user *domain.User) error {
	dict := i18n.GetDict(user.LanguageCode)
	return s.SendMessage(ctx, &TelegramSendMessagePayload{
		ChatID:    chatID,
		Text:      dict.BotHelp,
		ParseMode: "HTML",
	})
}

func (s *botService) StartPolling(ctx context.Context) {
	if s.botToken == "" {
		log.Println("Info: TELEGRAM_BOT_TOKEN is empty; Telegram bot long-polling engine disabled.")
		return
	}

	log.Println("🤖 Starting Telegram Bot long-polling engine...")
	offset := int64(0)

	for {
		select {
		case <-ctx.Done():
			log.Println("🛑 Telegram Bot long-polling engine stopped.")
			return
		default:
			apiURL := fmt.Sprintf("https://api.telegram.org/bot%s/getUpdates?offset=%d&timeout=30", s.botToken, offset)
			req, err := http.NewRequestWithContext(ctx, http.MethodGet, apiURL, nil)
			if err != nil {
				log.Printf("Error creating getUpdates request: %v\n", err)
				time.Sleep(3 * time.Second)
				continue
			}

			resp, err := s.client.Do(req)
			if err != nil {
				if ctx.Err() != nil {
					return
				}
				log.Printf("Error requesting getUpdates: %v\n", err)
				time.Sleep(3 * time.Second)
				continue
			}

			var updateResp struct {
				OK     bool                     `json:"ok"`
				Result []domain.TelegramBotUpdate `json:"result"`
			}

			if err := json.NewDecoder(resp.Body).Decode(&updateResp); err != nil {
				resp.Body.Close()
				log.Printf("Error decoding getUpdates response: %v\n", err)
				time.Sleep(3 * time.Second)
				continue
			}
			resp.Body.Close()

			if updateResp.OK {
				for _, update := range updateResp.Result {
					if update.UpdateID >= offset {
						offset = update.UpdateID + 1
					}
					if err := s.ProcessUpdate(ctx, &update); err != nil {
						log.Printf("Error processing polled update %d: %v\n", update.UpdateID, err)
					}
				}
			} else {
				time.Sleep(3 * time.Second)
			}
		}
	}
}
