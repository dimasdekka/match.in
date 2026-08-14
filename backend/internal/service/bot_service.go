package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"matchin-backend/internal/domain"
	"matchin-backend/pkg/i18n"
)

type BotService interface {
	SendMatchNotification(ctx context.Context, telegramID int64, matchedName string, matchedTelegramUsername string, langCode string) error
	SendSingleLikeNotification(ctx context.Context, targetTelegramID int64, swiperUserID uint, swiperName string, langCode string) error
	ProcessUpdate(ctx context.Context, update *domain.TelegramBotUpdate) error
	SendMessage(ctx context.Context, payload *TelegramSendMessagePayload) error
	StartPolling(ctx context.Context)
	SetMatchmakingService(matchmakingService MatchmakingService)
	SetAccountService(accountService AccountService)
	RegisterBotCommands(ctx context.Context) error
}

type botService struct {
	botToken           string
	webAppURL          string
	client             *http.Client
	userService        UserService
	profileService     ProfileService
	matchmakingService MatchmakingService
	accountService     AccountService
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

func (s *botService) SetAccountService(accountService AccountService) {
	s.accountService = accountService
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

func (s *botService) getPersistentKeyboard() map[string]interface{} {
	appURL := s.webAppURL
	if appURL == "" {
		appURL = "https://t.me/matchin_bot/app"
	}
	return map[string]interface{}{
		"keyboard": [][]map[string]interface{}{
			{
				{"text": "🚀 Mini App", "web_app": map[string]string{"url": appURL}},
				{"text": "👤 Profile"},
			},
			{
				{"text": "⭐ Premium"},
				{"text": "📩 Complain"},
				{"text": "🌐 Language"},
			},
		},
		"resize_keyboard": true,
	}
}

func (s *botService) RegisterBotCommands(ctx context.Context) error {
	if s.botToken == "" {
		return nil
	}

	payload := map[string]interface{}{
		"commands": []map[string]string{
			{"command": "app", "description": "🚀 Buka Match.in Mini App"},
			{"command": "profile", "description": "👤 Lihat Profil Saya"},
			{"command": "premium", "description": "⭐ Fitur Premium & VIP"},
			{"command": "complain", "description": "📩 Bantuan & Laporan"},
			{"command": "language", "description": "🌐 Ganti Bahasa"},
			{"command": "help", "description": "❓ Bantuan & Petunjuk"},
		},
	}

	bodyBytes, _ := json.Marshal(payload)
	apiURL := fmt.Sprintf("https://api.telegram.org/bot%s/setMyCommands", s.botToken)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, apiURL, bytes.NewBuffer(bodyBytes))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusOK {
		log.Println("✅ Telegram Bot Commands registered successfully.")
	}
	return nil
}

func (s *botService) SendMatchNotification(ctx context.Context, telegramID int64, matchedName string, matchedTelegramUsername string, langCode string) error {
	if s.botToken == "" {
		log.Printf("[BOT MOCK NOTIF] To TelegramID: %d | Matched with: %s (@%s)\n", telegramID, matchedName, matchedTelegramUsername)
		return nil
	}

	msgText := fmt.Sprintf("🎉 <b>It's a Match!</b> 💕\n\nKamu dan <b>%s</b> saling menyukai!\n\nLangsung alihkan ke Telegram untuk mulai chatting:", matchedName)

	if matchedTelegramUsername != "" {
		msgText += fmt.Sprintf("\n💬 Telegram: @%s", matchedTelegramUsername)
	}

	payload := TelegramSendMessagePayload{
		ChatID:      telegramID,
		Text:        msgText,
		ParseMode:   "HTML",
		ReplyMarkup: s.getPersistentKeyboard(),
	}

	if matchedTelegramUsername != "" {
		payload.ReplyMarkup = map[string]interface{}{
			"inline_keyboard": [][]map[string]string{
				{
					{
						"text": "💬 Chat @" + matchedTelegramUsername + " di Telegram",
						"url":  "https://t.me/" + matchedTelegramUsername,
					},
				},
			},
		}
	}

	return s.SendMessage(ctx, &payload)
}

func (s *botService) SendSingleLikeNotification(ctx context.Context, targetTelegramID int64, swiperUserID uint, swiperName string, langCode string) error {
	if s.botToken == "" {
		log.Printf("[BOT MOCK LIKE NOTIF] To TelegramID: %d | Swiped by UserID: %d (%s)\n", targetTelegramID, swiperUserID, swiperName)
		return nil
	}

	msgText := "💖 <b>Ada 1 orang yang menyukaimu!</b>\n\nSeseorang di Match.in tertarik dengan profilmu 😉. Ingin lihat profilnya?"

	replyMarkup := map[string]interface{}{
		"inline_keyboard": [][]map[string]interface{}{
			{
				{
					"text":          "👁️ Lihat Profil",
					"callback_data": fmt.Sprintf("view_like:%d", swiperUserID),
				},
				{
					"text":          "❌ Skip",
					"callback_data": fmt.Sprintf("skip_like:%d", swiperUserID),
				},
			},
		},
	}

	payload := TelegramSendMessagePayload{
		ChatID:      targetTelegramID,
		Text:        msgText,
		ParseMode:   "HTML",
		ReplyMarkup: replyMarkup,
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

func (s *botService) AnswerCallbackQuery(ctx context.Context, callbackQueryID string, text string) error {
	if s.botToken == "" || callbackQueryID == "" {
		return nil
	}

	payload := map[string]string{
		"callback_query_id": callbackQueryID,
		"text":              text,
	}
	bodyBytes, _ := json.Marshal(payload)
	apiURL := fmt.Sprintf("https://api.telegram.org/bot%s/answerCallbackQuery", s.botToken)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, apiURL, bytes.NewBuffer(bodyBytes))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := s.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	return nil
}

func (s *botService) SendPhoto(ctx context.Context, payload *TelegramSendPhotoPayload) error {
	if payload == nil {
		return fmt.Errorf("send photo payload cannot be nil")
	}

	if s.botToken == "" {
		log.Printf("[BOT MOCK PHOTO] To ChatID: %d | Photo: %s\n", payload.ChatID, payload.Photo)
		return nil
	}

	// Only send via sendPhoto if photo is a valid public HTTP/HTTPS URL
	if strings.HasPrefix(payload.Photo, "http://") || strings.HasPrefix(payload.Photo, "https://") {
		bodyBytes, err := json.Marshal(payload)
		if err == nil {
			apiURL := fmt.Sprintf("https://api.telegram.org/bot%s/sendPhoto", s.botToken)
			req, reqErr := http.NewRequestWithContext(ctx, http.MethodPost, apiURL, bytes.NewBuffer(bodyBytes))
			if reqErr == nil {
				req.Header.Set("Content-Type", "application/json")
				resp, doErr := s.client.Do(req)
				if doErr == nil {
					defer resp.Body.Close()
					if resp.StatusCode < 400 {
						return nil
					}
					log.Printf("Warning: sendPhoto returned status %d, falling back to sendMessage\n", resp.StatusCode)
				}
			}
		}
	}

	// Fallback to text message
	return s.SendMessage(ctx, &TelegramSendMessagePayload{
		ChatID:      payload.ChatID,
		Text:        payload.Caption,
		ParseMode:   payload.ParseMode,
		ReplyMarkup: payload.ReplyMarkup,
	})
}

func (s *botService) ProcessUpdate(ctx context.Context, update *domain.TelegramBotUpdate) error {
	if update == nil {
		return nil
	}

	// ── Handle Callback Query (Button Clicks) ──
	if update.CallbackQuery != nil {
		return s.handleCallbackQuery(ctx, update.CallbackQuery)
	}

	if update.Message == nil || update.Message.From == nil || update.Message.Text == "" {
		return nil
	}

	msg := update.Message
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
	case "/start", "/app", "🚀 mini app":
		return s.handleStartCommand(ctx, chatID, dbUser)
	case "/profile", "👤 profile":
		return s.handleProfileCommand(ctx, chatID, dbUser)
	case "/premium", "⭐ premium":
		return s.handlePremiumCommand(ctx, chatID, dbUser)
	case "/complain", "📩 complain":
		return s.handleComplainCommand(ctx, chatID, dbUser)
	case "/language", "🌐 language":
		return s.handleLanguageCommand(ctx, chatID, dbUser)
	case "/search":
		return s.handleSearchCommand(ctx, chatID, dbUser)
	case "/matches":
		return s.handleMatchesCommand(ctx, chatID, dbUser)
	case "/reset":
		return s.handleResetCommand(ctx, chatID, dbUser)
	case "/help":
		return s.handleHelpCommand(ctx, chatID, dbUser)
	default:
		if strings.HasPrefix(text, "/") {
			return s.SendMessage(ctx, &TelegramSendMessagePayload{
				ChatID:      chatID,
				Text:        "❓ Perintah tidak dikenali. Ketik /help atau gunakan menu keyboard di bawah.",
				ParseMode:   "HTML",
				ReplyMarkup: s.getPersistentKeyboard(),
			})
		}
		return s.handleStartCommand(ctx, chatID, dbUser)
	}
}

func (s *botService) handleCallbackQuery(ctx context.Context, cb *domain.TelegramCallbackQuery) error {
	if cb == nil || cb.From == nil {
		return nil
	}

	_ = s.AnswerCallbackQuery(ctx, cb.ID, "")

	chatID := cb.Message.Chat.ID
	data := cb.Data

	targetUser, err := s.userService.GetByTelegramID(ctx, cb.From.ID)
	if err != nil || targetUser == nil {
		return nil
	}

	parts := strings.Split(data, ":")
	action := parts[0]

	switch action {
	case "view_like":
		if len(parts) < 2 {
			return nil
		}
		swiperUserID, _ := strconv.ParseUint(parts[1], 10, 64)
		swiperProf, err := s.profileService.GetProfileByUserID(ctx, uint(swiperUserID))
		if err != nil || swiperProf == nil {
			return s.SendMessage(ctx, &TelegramSendMessagePayload{
				ChatID:    chatID,
				Text:      "Profil pengguna tidak ditemukan atau telah di-reset.",
				ParseMode: "HTML",
			})
		}

		bio := swiperProf.Bio
		if bio == "" {
			bio = "Suka ngobrol santai & kopi."
		}

		caption := fmt.Sprintf(
			"💖 <b>Profil Pengguna Yang Menyukaimu:</b>\n\n"+
				"👤 <b>%s</b>, %d\n"+
				"📍 %s, %s\n"+
				"💬 <i>\"%s\"</i>\n\n"+
				"Ingin saling menyukai dan mulai mengobrol dengan <b>%s</b>?",
			swiperProf.Name, swiperProf.Age, swiperProf.City, swiperProf.Country, bio, swiperProf.Name,
		)

		replyMarkup := map[string]interface{}{
			"inline_keyboard": [][]map[string]interface{}{
				{
					{
						"text":          "💖 Suka Juga & Match!",
						"callback_data": fmt.Sprintf("like_back:%d", swiperUserID),
					},
					{
						"text":          "❌ Skip",
						"callback_data": fmt.Sprintf("skip_like:%d", swiperUserID),
					},
				},
			},
		}

		var photoURL string
		if swiperProf.Photos != "" {
			var photos []string
			if json.Unmarshal([]byte(swiperProf.Photos), &photos) == nil && len(photos) > 0 {
				photoURL = photos[0]
			}
		}

		if photoURL != "" && (strings.HasPrefix(photoURL, "http://") || strings.HasPrefix(photoURL, "https://")) {
			return s.SendPhoto(ctx, &TelegramSendPhotoPayload{
				ChatID:      chatID,
				Photo:       photoURL,
				Caption:     caption,
				ParseMode:   "HTML",
				ReplyMarkup: replyMarkup,
			})
		}

		return s.SendMessage(ctx, &TelegramSendMessagePayload{
			ChatID:      chatID,
			Text:        caption,
			ParseMode:   "HTML",
			ReplyMarkup: replyMarkup,
		})

	case "like_back":
		if len(parts) < 2 {
			return nil
		}
		swiperUserID, _ := strconv.ParseUint(parts[1], 10, 64)
		var matchCreated bool
		if s.matchmakingService != nil {
			req := &domain.SwipeRequest{
				TargetID: uint(swiperUserID),
				Action:   domain.ActionLike,
			}
			res, _ := s.matchmakingService.ProcessSwipe(ctx, targetUser.ID, req)
			if res != nil && res.IsMatch {
				matchCreated = true
			}
		}

		appURL := s.webAppURL
		if appURL == "" {
			appURL = "https://t.me/matchin_bot/app"
		}

		msgText := "🎉 <b>IT'S A MATCH!</b>\n\nKamu dan pasanganmu sekarang saling menyukai! 💕\nKalian bisa langsung mengobrol dan saling mengenal lebih dekat."
		if !matchCreated {
			msgText = "💖 <b>Like Berhasil Dikirim!</b>\n\nKamu telah menyukai balik profil ini."
		}

		replyMarkup := map[string]interface{}{
			"inline_keyboard": [][]map[string]interface{}{
				{
					{
						"text":    "💬 Buka Match.in & Mulai Chat",
						"web_app": map[string]string{"url": appURL},
					},
				},
			},
		}

		return s.SendMessage(ctx, &TelegramSendMessagePayload{
			ChatID:      chatID,
			Text:        msgText,
			ParseMode:   "HTML",
			ReplyMarkup: replyMarkup,
		})

	case "skip_like":
		if len(parts) >= 2 {
			swiperUserID, _ := strconv.ParseUint(parts[1], 10, 64)
			if s.matchmakingService != nil {
				req := &domain.SwipeRequest{
					TargetID: uint(swiperUserID),
					Action:   domain.ActionPass,
				}
				_, _ = s.matchmakingService.ProcessSwipe(ctx, targetUser.ID, req)
			}
		}
		return s.SendMessage(ctx, &TelegramSendMessagePayload{
			ChatID:      chatID,
			Text:        "👌 Profil telah dilewati.",
			ParseMode:   "HTML",
			ReplyMarkup: s.getPersistentKeyboard(),
		})

	case "continue_chat":
		return s.SendMessage(ctx, &TelegramSendMessagePayload{
			ChatID:    chatID,
			Text:      "💬 <b>Mode Telegram Chat Aktif!</b>\n\nKamu bisa mencari pasangan dan mengobrol langsung di Telegram ini:\n\n🔍 /search - Cari rekomendasi kandidat\n👤 /profile - Lihat profil kamu\n🎉 /matches - Lihat daftar match kamu\n⭐ /premium - Info fitur VIP\n\nGunakan menu keyboard di bawah untuk navigasi cepat!",
			ParseMode: "HTML",
			ReplyMarkup: s.getPersistentKeyboard(),
		})
	}

	return nil
}

func (s *botService) handleStartCommand(ctx context.Context, chatID int64, user *domain.User) error {
	text := fmt.Sprintf(
		"👋 Halo <b>%s</b>! Selamat datang di <b>Match.in</b> 💕\n\n"+
			"Pilih metode yang ingin kamu gunakan untuk mencari pasangan:",
		user.FirstName,
	)

	appURL := s.webAppURL
	if appURL == "" {
		appURL = "https://t.me/matchin_bot/app"
	}

	replyMarkup := map[string]interface{}{
		"inline_keyboard": [][]map[string]interface{}{
			{
				{
					"text":    "📱 Buka Match.in Mini App",
					"web_app": map[string]string{"url": appURL},
				},
			},
			{
				{
					"text":          "💬 Lanjutkan via Telegram Chat",
					"callback_data": "continue_chat",
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

func (s *botService) handlePremiumCommand(ctx context.Context, chatID int64, user *domain.User) error {
	text := "⭐ <b>Match.in VIP & Premium</b>\n\n" +
		"Nikmati fitur eksklusif:\n" +
		"• 💖 Unlimited Likes setiap hari\n" +
		"• 👁️ Lihat siapa yang menyukaimu lebih dulu\n" +
		"• 🚀 Profile Boost ke urutan teratas\n" +
		"• 🌐 Ubah lokasi jelajah ke kota manapun\n\n" +
		"Buka Mini App untuk mengaktifkan Premium!"

	appURL := s.webAppURL
	if appURL == "" {
		appURL = "https://t.me/matchin_bot/app"
	}

	replyMarkup := map[string]interface{}{
		"inline_keyboard": [][]map[string]interface{}{
			{
				{
					"text":    "⭐ Buka Mini App & Upgrade VIP",
					"web_app": map[string]string{"url": appURL},
				},
			},
		},
	}

	return s.SendMessage(ctx, &TelegramSendMessagePayload{
		ChatID:      chatID,
		Text:        text,
		ParseMode:   "HTML",
		ReplyMarkup: replyMarkup,
	})
}

func (s *botService) handleComplainCommand(ctx context.Context, chatID int64, user *domain.User) error {
	text := "📩 <b>Laporan & Bantuan Pelanggan</b>\n\n" +
		"Ada masalah atau pertanyaan terkait akun Match.in kamu?\n\n" +
		"Tim bantuan kami siap membantu 24/7. Hubungi kami langsung di:\n" +
		"💬 Admin Support: @MatchinSupportBot\n" +
		"📧 Email: support@matchin.app"

	return s.SendMessage(ctx, &TelegramSendMessagePayload{
		ChatID:      chatID,
		Text:        text,
		ParseMode:   "HTML",
		ReplyMarkup: s.getPersistentKeyboard(),
	})
}

func (s *botService) handleLanguageCommand(ctx context.Context, chatID int64, user *domain.User) error {
	newLang := "en"
	if user.LanguageCode == "en" {
		newLang = "id"
	}

	user.LanguageCode = newLang
	if s.userService != nil {
		_ = s.userService.CreateOrUpdate(ctx, user)
	}

	langText := "Bahasa Indonesia 🇮🇩"
	if newLang == "en" {
		langText = "English 🇬🇧"
	}

	text := fmt.Sprintf("🌐 Bahasa berhasil diubah ke <b>%s</b>!", langText)

	return s.SendMessage(ctx, &TelegramSendMessagePayload{
		ChatID:      chatID,
		Text:        text,
		ParseMode:   "HTML",
		ReplyMarkup: s.getPersistentKeyboard(),
	})
}

func (s *botService) handleSearchCommand(ctx context.Context, chatID int64, user *domain.User) error {
	dict := i18n.GetDict(user.LanguageCode)

	if s.profileService == nil {
		return fmt.Errorf("profile service is not configured")
	}

	recs, err := s.profileService.GetRecommendations(ctx, user.ID, 3, "for_you")
	if err != nil {
		return fmt.Errorf("failed to search recommendations for user %d: %w", user.ID, err)
	}

	if len(recs) == 0 {
		return s.SendMessage(ctx, &TelegramSendMessagePayload{
			ChatID:      chatID,
			Text:        dict.BotNoRecommendations,
			ParseMode:   "HTML",
			ReplyMarkup: s.getPersistentKeyboard(),
		})
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("🔍 <b>Rekomendasi Match.in</b> (%d ditemukan):\n\n", len(recs)))

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
			bio = "Suka ngobrol santai & kopi."
		}

		sb.WriteString(fmt.Sprintf("%d. <b>%s</b>, %d\n", i+1, rec.Name, rec.Age))
		sb.WriteString(fmt.Sprintf("📍 Lokasi: %s\n", location))
		sb.WriteString(fmt.Sprintf("💬 <i>\"%s\"</i>\n", bio))
		sb.WriteString(fmt.Sprintf("🏷️ Minat: %s\n\n", interestsStr))
	}

	appURL := s.webAppURL
	if appURL == "" {
		appURL = "https://t.me/matchin_bot/app"
	}

	replyMarkup := map[string]interface{}{
		"inline_keyboard": [][]map[string]interface{}{
			{
				{
					"text":    "💖 Swipe di Mini App",
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
	if s.profileService == nil {
		return fmt.Errorf("profile service is not configured")
	}

	profile, err := s.profileService.GetProfileByUserID(ctx, user.ID)
	if err != nil {
		return fmt.Errorf("failed to fetch user profile: %w", err)
	}

	if profile == nil {
		return s.SendMessage(ctx, &TelegramSendMessagePayload{
			ChatID:      chatID,
			Text:        "👤 Kamu belum mengisi profil! Buka Mini App untuk melengkapi profilmu.",
			ParseMode:   "HTML",
			ReplyMarkup: s.getPersistentKeyboard(),
		})
	}

	interestsStr := "-"
	if profile.Interests != "" {
		var interestsArr []string
		if err := json.Unmarshal([]byte(profile.Interests), &interestsArr); err == nil && len(interestsArr) > 0 {
			interestsStr = strings.Join(interestsArr, ", ")
		}
	}

	verifiedBadge := "❌ Belum Verifikasi"
	if profile.IsVerified {
		verifiedBadge = "✅ Profil Terverifikasi"
	}

	text := fmt.Sprintf(
		"👤 <b>Profil Match.in Kamu</b>\n\n"+
			"<b>Nama:</b> %s\n"+
			"<b>Usia:</b> %d\n"+
			"<b>Jenis Kelamin:</b> %s\n"+
			"<b>Mencari:</b> %s\n"+
			"<b>Lokasi:</b> %s, %s\n"+
			"<b>Bio:</b> %s\n"+
			"<b>Minat:</b> %s\n"+
			"<b>Status:</b> %s\n",
		profile.Name,
		profile.Age,
		profile.Gender,
		profile.TargetGender,
		profile.City, profile.Country,
		profile.Bio,
		interestsStr,
		verifiedBadge,
	)

	return s.SendMessage(ctx, &TelegramSendMessagePayload{
		ChatID:      chatID,
		Text:        text,
		ParseMode:   "HTML",
		ReplyMarkup: s.getPersistentKeyboard(),
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
			ChatID:      chatID,
			Text:        dict.BotNoMatches,
			ParseMode:   "HTML",
			ReplyMarkup: s.getPersistentKeyboard(),
		})
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("🎉 <b>Daftar Match Kamu</b> (%d):\n\n", len(matches)))

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
		ChatID:      chatID,
		Text:        sb.String(),
		ParseMode:   "HTML",
		ReplyMarkup: s.getPersistentKeyboard(),
	})
}

func (s *botService) handleResetCommand(ctx context.Context, chatID int64, user *domain.User) error {
	var targetUserID uint
	if user != nil && user.ID != 0 {
		targetUserID = user.ID
	} else if s.userService != nil {
		if u, err := s.userService.GetByTelegramID(ctx, chatID); err == nil && u != nil {
			targetUserID = u.ID
		}
	}

	if targetUserID != 0 && s.accountService != nil {
		if err := s.accountService.DeleteAccount(ctx, targetUserID); err != nil {
			log.Printf("Error resetting account for user %d: %v\n", targetUserID, err)
		} else {
			log.Printf("Successfully reset account for user %d (TelegramID: %d)\n", targetUserID, chatID)
		}
	} else if targetUserID != 0 && s.matchmakingService != nil {
		_ = s.matchmakingService.ResetSwipes(ctx, targetUserID)
	}

	appURL := s.webAppURL
	if appURL == "" {
		appURL = "https://t.me/matchin_bot/app"
	}

	text := "🔄 <b>Akun Berhasil Direset Total!</b>\n\n" +
		"Seluruh profil, foto, riwayat swipe/like, daftar match, dan obrolan Anda telah dihapus secara permanen.\n\n" +
		"Ketik <b>/start</b> atau klik tombol di bawah untuk mendaftar ulang dan mulai baru dari awal! ✨"

	langCode := "id"
	if user != nil && user.LanguageCode != "" {
		langCode = user.LanguageCode
	}

	if langCode == "en" {
		text = "🔄 <b>Account Successfully Reset!</b>\n\n" +
			"All your profile data, photos, swipe/like history, matches, and chat conversations have been permanently wiped.\n\n" +
			"Type <b>/start</b> or tap the button below to register fresh and create a new profile! ✨"
	}

	replyMarkup := map[string]interface{}{
		"inline_keyboard": [][]map[string]interface{}{
			{
				{
					"text":    "🚀 Buka Match.in & Mulai Baru",
					"web_app": map[string]string{"url": appURL},
				},
			},
		},
	}

	return s.SendMessage(ctx, &TelegramSendMessagePayload{
		ChatID:      chatID,
		Text:        text,
		ParseMode:   "HTML",
		ReplyMarkup: replyMarkup,
	})
}

func (s *botService) handleHelpCommand(ctx context.Context, chatID int64, user *domain.User) error {
	dict := i18n.GetDict(user.LanguageCode)
	return s.SendMessage(ctx, &TelegramSendMessagePayload{
		ChatID:      chatID,
		Text:        dict.BotHelp,
		ParseMode:   "HTML",
		ReplyMarkup: s.getPersistentKeyboard(),
	})
}

func (s *botService) StartPolling(ctx context.Context) {
	if s.botToken == "" {
		log.Println("Info: TELEGRAM_BOT_TOKEN is empty; Telegram bot long-polling engine disabled.")
		return
	}

	log.Println("🤖 Registering Telegram Bot menu commands...")
	_ = s.RegisterBotCommands(ctx)

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
