package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"matchin-backend/internal/domain"
	"matchin-backend/internal/repository"
	"matchin-backend/pkg/i18n"
)

type BotService interface {
	SendMatchNotification(telegramID int64, matchedName string, matchedTelegramUsername string, langCode string) error
	StartPollingUpdates(miniAppURL string, profileRepo repository.ProfileRepository, userRepo repository.UserRepository, swipeRepo repository.SwipeRepository, matchRepo repository.MatchRepository)
}

type botService struct {
	botToken string
	client   *http.Client
}

func NewBotService(botToken string) BotService {
	return &botService{
		botToken: botToken,
		client:   &http.Client{Timeout: 10 * time.Second},
	}
}

type TelegramSendMessagePayload struct {
	ChatID      int64                  `json:"chat_id"`
	Text        string                 `json:"text"`
	ParseMode   string                 `json:"parse_mode"`
	ReplyMarkup map[string]interface{} `json:"reply_markup,omitempty"`
}

type TelegramSendPhotoPayload struct {
	ChatID      int64                  `json:"chat_id"`
	Photo       string                 `json:"photo"`
	Caption     string                 `json:"caption"`
	ParseMode   string                 `json:"parse_mode"`
	ReplyMarkup map[string]interface{} `json:"reply_markup,omitempty"`
}

func (s *botService) SendMatchNotification(telegramID int64, matchedName string, matchedTelegramUsername string, langCode string) error {
	if s.botToken == "" {
		fmt.Printf("[BOT MOCK NOTIF] To TelegramID: %d | Matched with: %s (@%s)\n", telegramID, matchedName, matchedTelegramUsername)
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
			"inline_keyboard": [][]map[string]interface{}{
				{
					{
						"text": "💬 Chat @" + matchedTelegramUsername,
						"url":  "https://t.me/" + matchedTelegramUsername,
					},
				},
			},
		}
	}

	bodyBytes, _ := json.Marshal(payload)
	apiURL := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", s.botToken)

	resp, err := s.client.Post(apiURL, "application/json", bytes.NewBuffer(bodyBytes))
	if err != nil {
		return fmt.Errorf("failed to send bot message: %w", err)
	}
	defer resp.Body.Close()

	return nil
}

// Telegram Update Structures
type TelegramUpdate struct {
	UpdateID      int64                  `json:"update_id"`
	Message       *TelegramMessage       `json:"message"`
	CallbackQuery *TelegramCallbackQuery `json:"callback_query"`
}

type TelegramMessage struct {
	MessageID int64         `json:"message_id"`
	From      *TelegramFrom `json:"from"`
	Chat      *TelegramChat `json:"chat"`
	Text      string        `json:"text"`
}

type TelegramCallbackQuery struct {
	ID      string           `json:"id"`
	From    *TelegramFrom    `json:"from"`
	Message *TelegramMessage `json:"message"`
	Data    string           `json:"data"`
}

type TelegramFrom struct {
	ID           int64  `json:"id"`
	FirstName    string `json:"first_name"`
	LastName     string `json:"last_name"`
	Username     string `json:"username"`
	LanguageCode string `json:"language_code"`
}

type TelegramChat struct {
	ID int64 `json:"id"`
}

func (s *botService) StartPollingUpdates(
	miniAppURL string,
	profileRepo repository.ProfileRepository,
	userRepo repository.UserRepository,
	swipeRepo repository.SwipeRepository,
	matchRepo repository.MatchRepository,
) {
	if s.botToken == "" {
		fmt.Println("⚠️ Telegram Bot Token is empty. Skipping chat long polling.")
		return
	}

	if miniAppURL == "" {
		miniAppURL = "https://18-180-193-149.nip.io"
	}

	fmt.Println("🤖 Telegram Chat Bot Polling Started! Listening to /start, /search, and chat commands...")

	go func() {
		offset := int64(0)
		for {
			url := fmt.Sprintf("https://api.telegram.org/bot%s/getUpdates?offset=%d&timeout=20", s.botToken, offset)
			resp, err := s.client.Get(url)
			if err != nil {
				time.Sleep(5 * time.Second)
				continue
			}

			body, err := io.ReadAll(resp.Body)
			resp.Body.Close()
			if err != nil {
				time.Sleep(3 * time.Second)
				continue
			}

			var result struct {
				OK     bool             `json:"ok"`
				Result []TelegramUpdate `json:"result"`
			}

			if err := json.Unmarshal(body, &result); err != nil || !result.OK {
				time.Sleep(3 * time.Second)
				continue
			}

			for _, update := range result.Result {
				offset = update.UpdateID + 1

				if update.Message != nil && update.Message.Text != "" {
					s.handleTextMessage(update.Message, miniAppURL, profileRepo, userRepo)
				} else if update.CallbackQuery != nil {
					s.handleCallbackQuery(update.CallbackQuery, miniAppURL, profileRepo, userRepo, swipeRepo, matchRepo)
				}
			}
		}
	}()
}

func (s *botService) handleTextMessage(
	msg *TelegramMessage,
	miniAppURL string,
	profileRepo repository.ProfileRepository,
	userRepo repository.UserRepository,
) {
	chatID := msg.Chat.ID
	text := msg.Text
	from := msg.From

	// Save or update user
	if from != nil {
		user := &domain.User{
			TelegramID:   from.ID,
			Username:     from.Username,
			FirstName:    from.FirstName,
			LastName:     from.LastName,
			LanguageCode: from.LanguageCode,
			IsActive:     true,
		}
		_ = userRepo.CreateOrUpdate(nil, user)
	}

	if text == "/start" || text == "/menu" {
		welcomeMsg := fmt.Sprintf(
			"🔥 <b>Selamat datang di Match.in / Ketemu.in!</b>\n\n"+
				"Aplikasi dating & matchmaking modern berbasis Telegram.\n\n"+
				"✨ <b>Pilih Cara Penggunaan:</b>\n"+
				"1. 🚀 <b>Buka Mini App</b>: Tampilan visual kartu swipe (Tinder-style), Voice Bio & Filter Lokasi.\n"+
				"2. 💬 <b>Cari via Chat</b>: Cari jodoh langsung di dalam obrolan Telegram ini!",
		)

		keyboard := map[string]interface{}{
			"inline_keyboard": [][]map[string]interface{}{
				{
					{
						"text":    "🚀 Buka Match.in Mini App",
						"web_app": map[string]string{"url": miniAppURL},
					},
				},
				{
					{
						"text":          "🔍 Cari Jodoh via Chat",
						"callback_data": "cmd_search",
					},
					{
						"text":          "💖 Matches Saya",
						"callback_data": "cmd_matches",
					},
				},
			},
		}

		s.sendMessageWithKeyboard(chatID, welcomeMsg, keyboard)
	}
}

func (s *botService) handleCallbackQuery(
	query *TelegramCallbackQuery,
	miniAppURL string,
	profileRepo repository.ProfileRepository,
	userRepo repository.UserRepository,
	swipeRepo repository.SwipeRepository,
	matchRepo repository.MatchRepository,
) {
	chatID := query.Message.Chat.ID
	data := query.Data
	from := query.From

	user, _ := userRepo.GetByTelegramID(nil, from.ID)
	if user == nil {
		user = &domain.User{
			TelegramID:   from.ID,
			Username:     from.Username,
			FirstName:    from.FirstName,
			LastName:     from.LastName,
			LanguageCode: from.LanguageCode,
			IsActive:     true,
		}
		_ = userRepo.CreateOrUpdate(nil, user)
	}

	if data == "cmd_search" {
		profile, _ := profileRepo.GetByUserID(nil, user.ID)
		if profile == nil {
			// User has no profile yet -> urge opening Mini App or quick prompt
			promptMsg := "⚠️ <b>Profil Kamu Belum Lengkap!</b>\n\nBuka Mini App untuk mengisi profil 5 langkah singkat terlebih dahulu:"
			keyboard := map[string]interface{}{
				"inline_keyboard": [][]map[string]interface{}{
					{
						{
							"text":    "🚀 Isi Profil di Mini App",
							"web_app": map[string]string{"url": miniAppURL},
						},
					},
				},
			}
			s.sendMessageWithKeyboard(chatID, promptMsg, keyboard)
			return
		}

		// Fetch next recommendation profile
		recs, _ := profileRepo.GetRecommendations(nil, user.ID, profile, 1)
		if len(recs) == 0 {
			noRecMsg := "😔 <b>Belum ada kandidat baru di sekitarmu!</b>\n\nCoba buka Mini App dan ubah filter lokasi menjadi Satu Negara atau Global:"
			keyboard := map[string]interface{}{
				"inline_keyboard": [][]map[string]interface{}{
					{
						{
							"text":    "🌐 Buka Filter di Mini App",
							"web_app": map[string]string{"url": miniAppURL},
						},
					},
				},
			}
			s.sendMessageWithKeyboard(chatID, noRecMsg, keyboard)
			return
		}

		targetProfile := recs[0]
		caption := fmt.Sprintf(
			"👤 <b>%s, %d</b>\n"+
				"📍 %s, %s\n\n"+
				"📝 %s",
			targetProfile.Name, targetProfile.Age,
			targetProfile.City, targetProfile.Country,
			targetProfile.Bio,
		)

		letPhoto := "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80"
		var photos []string
		if err := json.Unmarshal([]byte(targetProfile.Photos), &photos); err == nil && len(photos) > 0 {
			letPhoto = photos[0]
		}

		keyboard := map[string]interface{}{
			"inline_keyboard": [][]map[string]interface{}{
				{
					{
						"text":          "❌ Pass",
						"callback_data": fmt.Sprintf("swipe_pass_%d", targetProfile.UserID),
					},
					{
						"text":          "❤️ Like",
						"callback_data": fmt.Sprintf("swipe_like_%d", targetProfile.UserID),
					},
				},
				{
					{
						"text":    "🚀 Buka Tampilan Mini App",
						"web_app": map[string]string{"url": miniAppURL},
					},
				},
			},
		}

		s.sendPhotoWithKeyboard(chatID, letPhoto, caption, keyboard)
	}
}

func (s *botService) sendMessageWithKeyboard(chatID int64, text string, keyboard map[string]interface{}) {
	payload := TelegramSendMessagePayload{
		ChatID:      chatID,
		Text:        text,
		ParseMode:   "HTML",
		ReplyMarkup: keyboard,
	}
	bodyBytes, _ := json.Marshal(payload)
	apiURL := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", s.botToken)
	resp, err := s.client.Post(apiURL, "application/json", bytes.NewBuffer(bodyBytes))
	if err == nil {
		resp.Body.Close()
	}
}

func (s *botService) sendPhotoWithKeyboard(chatID int64, photoURL string, caption string, keyboard map[string]interface{}) {
	payload := TelegramSendPhotoPayload{
		ChatID:      chatID,
		Photo:       photoURL,
		Caption:     caption,
		ParseMode:   "HTML",
		ReplyMarkup: keyboard,
	}
	bodyBytes, _ := json.Marshal(payload)
	apiURL := fmt.Sprintf("https://api.telegram.org/bot%s/sendPhoto", s.botToken)
	resp, err := s.client.Post(apiURL, "application/json", bytes.NewBuffer(bodyBytes))
	if err == nil {
		resp.Body.Close()
	}
}
