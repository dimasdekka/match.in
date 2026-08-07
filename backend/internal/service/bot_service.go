package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"sync"
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
	botToken   string
	client     *http.Client
	regStates  map[int64]*RegistrationState
	statesLock sync.Mutex
}

type RegistrationState struct {
	Step         int
	Name         string
	Age          int
	Gender       domain.Gender
	TargetGender domain.Gender
	City         string
	Country      string
}

func NewBotService(botToken string) BotService {
	return &botService{
		botToken:  botToken,
		client:    &http.Client{Timeout: 10 * time.Second},
		regStates: make(map[int64]*RegistrationState),
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
	if err == nil {
		resp.Body.Close()
	}

	return nil
}

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

	// Register Bot Commands Menu in Telegram UI
	s.registerBotCommands()

	fmt.Println("🤖 Telegram Chat Bot Polling Started! Full Slash Commands Enabled.")

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
					s.handleTextMessage(update.Message, miniAppURL, profileRepo, userRepo, matchRepo)
				} else if update.CallbackQuery != nil {
					s.handleCallbackQuery(update.CallbackQuery, miniAppURL, profileRepo, userRepo, swipeRepo, matchRepo)
				}
			}
		}
	}()
}

func (s *botService) registerBotCommands() {
	commands := []map[string]string{
		{"command": "start", "description": "🔥 Mulai Bot & Tampilkan Menu Utama"},
		{"command": "search", "description": "🔍 Cari Pasangan via Chat"},
		{"command": "profile", "description": "👤 Lihat & Edit Profil Saya"},
		{"command": "matches", "description": "💖 Daftar Pasangan Match Saya"},
		{"command": "reset", "description": "📝 Isi / Buat Ulang Profil"},
		{"command": "help", "description": "❓ Bantuan & Panduan Penggunaan"},
	}

	payload := map[string]interface{}{"commands": commands}
	bodyBytes, _ := json.Marshal(payload)
	apiURL := fmt.Sprintf("https://api.telegram.org/bot%s/setMyCommands", s.botToken)
	resp, err := s.client.Post(apiURL, "application/json", bytes.NewBuffer(bodyBytes))
	if err == nil {
		resp.Body.Close()
	}
}

func (s *botService) handleTextMessage(
	msg *TelegramMessage,
	miniAppURL string,
	profileRepo repository.ProfileRepository,
	userRepo repository.UserRepository,
	matchRepo repository.MatchRepository,
) {
	chatID := msg.Chat.ID
	text := strings.TrimSpace(msg.Text)
	from := msg.From

	if from == nil {
		return
	}

	user := &domain.User{
		TelegramID:   from.ID,
		Username:     from.Username,
		FirstName:    from.FirstName,
		LastName:     from.LastName,
		LanguageCode: from.LanguageCode,
		IsActive:     true,
	}
	_ = userRepo.CreateOrUpdate(nil, user)

	s.statesLock.Lock()
	state, exists := s.regStates[from.ID]
	s.statesLock.Unlock()

	// If user is currently completing chat registration wizard
	if exists && state != nil && !strings.HasPrefix(text, "/") {
		s.processChatRegistrationStep(chatID, from.ID, text, state, miniAppURL, profileRepo, userRepo)
		return
	}

	switch text {
	case "/start", "/menu":
		s.statesLock.Lock()
		delete(s.regStates, from.ID)
		s.statesLock.Unlock()

		welcomeMsg := fmt.Sprintf(
			"🔥 <b>Selamat datang di Match.in / Ketemu.in!</b>\n\n"+
				"Aplikasi dating & matchmaking modern berbasis Telegram.\n\n"+
				"✨ <b>Pilihan Fitur Utama:</b>\n"+
				"• 🚀 <b>Mini App</b>: Swipe visual Tinder-style, Voice Bio & Filter Lokasi\n"+
				"• 🔍 <b>Cari via Chat</b> (/search): Cari jodoh langsung di Telegram\n"+
				"• 👤 <b>Profil Saya</b> (/profile): Cek data profilmu\n"+
				"• 💖 <b>Matches Saya</b> (/matches): Lihat pasangan saling menyukai\n"+
				"• ❓ <b>Bantuan</b> (/help): Panduan bot",
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
						"text":          "👤 Profil Saya",
						"callback_data": "cmd_profile",
					},
				},
				{
					{
						"text":          "💖 Matches Saya",
						"callback_data": "cmd_matches",
					},
					{
						"text":          "✍️ Buat / Edit Profil",
						"callback_data": "cmd_reg_chat",
					},
				},
			},
		}

		s.sendMessageWithKeyboard(chatID, welcomeMsg, keyboard)

	case "/help":
		helpMsg := fmt.Sprintf(
			"❓ <b>PANDUAN BANTUAN MATCH.IN / KETEMU.IN</b>\n\n"+
				"<b>1. Berapa Cara Penggunaan?</b>\n"+
				"Kamu bisa memilih 2 cara:\n"+
				"- 🚀 <b>Lewat Mini App</b>: Tekan tombol 'Buka Match.in Mini App' untuk pengalaman visual Tinder-style, Voice Bio, dan Swipe.\n"+
				"- 💬 <b>Lewat Chat</b>: Gunakan perintah di bawah ini langsung di chat ini.\n\n"+
				"<b>2. Perintah Telegram Chat (/):</b>\n"+
				"• <code>/start</code> - Tampilkan menu utama\n"+
				"• <code>/search</code> - Cari kandidat jodoh langsung di chat\n"+
				"• <code>/profile</code> - Lihat & atur data profilmu\n"+
				"• <code>/matches</code> - Lihat daftar orang yang saling menyukaimu\n"+
				"• <code>/reset</code> - Isi ulang data profil dari awal\n"+
				"• <code>/help</code> - Tampilkan panduan ini\n\n"+
				"<b>3. Bagaimana Jika Saling Suka (Match)?</b>\n"+
				"Jika kamu & kandidat saling menyukai, Bot akan otomatis mengirimkan notifikasi beserta link chat Telegram pribadi pasangan!",
		)
		s.sendMessageWithKeyboard(chatID, helpMsg, nil)

	case "/profile", "/me":
		dbUser, _ := userRepo.GetByTelegramID(nil, from.ID)
		if dbUser == nil {
			s.sendMessageWithKeyboard(chatID, "⚠️ Kamu belum terdaftar. Ketik /reset atau /start untuk mendaftar.", nil)
			return
		}
		profile, _ := profileRepo.GetByUserID(nil, dbUser.ID)
		if profile == nil {
			msg := "⚠️ <b>Kamu belum mengisi profil!</b>\n\nKlik tombol di bawah untuk membuat profil:"
			keyboard := map[string]interface{}{
				"inline_keyboard": [][]map[string]interface{}{
					{
						{"text": "✍️ Buat Profil Sekarang", "callback_data": "cmd_reg_chat"},
					},
				},
			}
			s.sendMessageWithKeyboard(chatID, msg, keyboard)
			return
		}

		profileMsg := fmt.Sprintf(
			"👤 <b>PROFIL SAYA</b>\n\n"+
				"• <b>Nama</b>: %s\n"+
				"• <b>Usia</b>: %d tahun\n"+
				"• <b>Gender</b>: %s\n"+
				"• <b>Mencari</b>: %s\n"+
				"• <b>Asal/Lokasi</b>: %s, %s\n"+
				"• <b>Deskripsi Singkat</b>: %s\n",
			profile.Name, profile.Age, profile.Gender, profile.TargetGender, profile.City, profile.Country, profile.Bio,
		)

		keyboard := map[string]interface{}{
			"inline_keyboard": [][]map[string]interface{}{
				{
					{
						"text":    "🚀 Edit via Mini App",
						"web_app": map[string]string{"url": miniAppURL},
					},
					{
						"text":          "✍️ Edit via Chat",
						"callback_data": "cmd_reg_chat",
					},
				},
			},
		}

		s.sendMessageWithKeyboard(chatID, profileMsg, keyboard)

	case "/search", "/find":
		s.handleCallbackQuery(&TelegramCallbackQuery{
			From:    from,
			Message: msg,
			Data:    "cmd_search",
		}, miniAppURL, profileRepo, userRepo, nil, matchRepo)

	case "/matches":
		dbUser, _ := userRepo.GetByTelegramID(nil, from.ID)
		if dbUser == nil {
			s.sendMessageWithKeyboard(chatID, "⚠️ Kamu belum terdaftar.", nil)
			return
		}
		matches, _ := matchRepo.GetMatchesForUser(nil, dbUser.ID)
		if len(matches) == 0 {
			msg := "😔 <b>Belum ada pasangan match!</b>\n\nTerus sukai kandidat di /search atau Mini App untuk mendapatkan match pertamamu!"
			s.sendMessageWithKeyboard(chatID, msg, nil)
			return
		}

		matchListText := "💖 <b>DAFTAR PASANGAN MATCH SAYA:</b>\n\n"
		var inlineButtons [][]map[string]interface{}

		for idx, m := range matches {
			var partnerUser *domain.User
			var partnerProfile *domain.Profile
			if m.User1ID == dbUser.ID {
				partnerUser, _ = userRepo.GetByID(nil, m.User2ID)
				partnerProfile, _ = profileRepo.GetByUserID(nil, m.User2ID)
			} else {
				partnerUser, _ = userRepo.GetByID(nil, m.User1ID)
				partnerProfile, _ = profileRepo.GetByUserID(nil, m.User1ID)
			}

			if partnerUser != nil && partnerProfile != nil {
				matchListText += fmt.Sprintf("%d. <b>%s (%d thn)</b> - 📍 %s, %s\n", idx+1, partnerProfile.Name, partnerProfile.Age, partnerProfile.City, partnerProfile.Country)
				if partnerUser.Username != "" {
					inlineButtons = append(inlineButtons, []map[string]interface{}{
						{
							"text": fmt.Sprintf("💬 Chat @%s (%s)", partnerUser.Username, partnerProfile.Name),
							"url":  "https://t.me/" + partnerUser.Username,
						},
					})
				}
			}
		}

		keyboard := map[string]interface{}{
			"inline_keyboard": inlineButtons,
		}
		s.sendMessageWithKeyboard(chatID, matchListText, keyboard)

	case "/reset", "/register":
		s.statesLock.Lock()
		s.regStates[from.ID] = &RegistrationState{
			Step:    1,
			Name:    from.FirstName,
			Country: "Indonesia",
		}
		s.statesLock.Unlock()

		msg := fmt.Sprintf("📝 <b>Langkah 1 dari 4: Nama Lengkap</b>\n\nMasukkan nama panggilanmu (saat ini: <b>%s</b>). Balas pesan ini jika ingin mengubah nama:", from.FirstName)
		s.sendMessageWithKeyboard(chatID, msg, nil)

	default:
		// Fallback for unknown slash commands or general text
		if strings.HasPrefix(text, "/") {
			s.sendMessageWithKeyboard(chatID, "⚠️ Perintah tidak dikenal. Ketik /help untuk melihat daftar perintah resmi.", nil)
		}
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

	if data == "cmd_reg_chat" {
		s.statesLock.Lock()
		s.regStates[from.ID] = &RegistrationState{
			Step:    1,
			Name:    from.FirstName,
			Country: "Indonesia",
		}
		s.statesLock.Unlock()

		msg := fmt.Sprintf("📝 <b>Langkah 1 dari 4: Nama Lengkap</b>\n\nMasukkan nama panggilanmu (saat ini: <b>%s</b>). Balas pesan ini jika ingin mengubah nama:", from.FirstName)
		s.sendMessageWithKeyboard(chatID, msg, nil)
		return
	}

	if data == "cmd_profile" {
		s.handleTextMessage(&TelegramMessage{
			Chat: query.Message.Chat,
			From: from,
			Text: "/profile",
		}, miniAppURL, profileRepo, userRepo, matchRepo)
		return
	}

	if data == "cmd_matches" {
		s.handleTextMessage(&TelegramMessage{
			Chat: query.Message.Chat,
			From: from,
			Text: "/matches",
		}, miniAppURL, profileRepo, userRepo, matchRepo)
		return
	}

	if strings.HasPrefix(data, "gender_") {
		s.statesLock.Lock()
		state := s.regStates[from.ID]
		if state != nil {
			if data == "gender_male" {
				state.Gender = domain.GenderMale
			} else {
				state.Gender = domain.GenderFemale
			}
			state.Step = 3
			s.promptTargetGender(chatID)
		}
		s.statesLock.Unlock()
		return
	}

	if strings.HasPrefix(data, "target_") {
		s.statesLock.Lock()
		state := s.regStates[from.ID]
		if state != nil {
			if data == "target_female" {
				state.TargetGender = domain.GenderFemale
			} else if data == "target_male" {
				state.TargetGender = domain.GenderMale
			} else {
				state.TargetGender = domain.GenderAll
			}
			state.Step = 4
			s.promptCitySelection(chatID)
		}
		s.statesLock.Unlock()
		return
	}

	if strings.HasPrefix(data, "city_") {
		selectedCity := strings.TrimPrefix(data, "city_")
		s.statesLock.Lock()
		state := s.regStates[from.ID]
		if state != nil {
			if selectedCity == "manual" {
				s.sendMessageWithKeyboard(chatID, "✍️ <b>Ketik Nama Kotamu</b>\n\nSilakan ketik nama kotamu secara manual (contoh: Subang, Cimahi, Kediri):", nil)
			} else {
				state.City = selectedCity
				s.finishChatRegistration(chatID, from.ID, state, miniAppURL, profileRepo, userRepo)
			}
		}
		s.statesLock.Unlock()
		return
	}

	if strings.HasPrefix(data, "swipe_like_") || strings.HasPrefix(data, "swipe_pass_") {
		targetIDStr := ""
		action := domain.ActionPass
		if strings.HasPrefix(data, "swipe_like_") {
			targetIDStr = strings.TrimPrefix(data, "swipe_like_")
			action = domain.ActionLike
		} else {
			targetIDStr = strings.TrimPrefix(data, "swipe_pass_")
		}

		targetUserID, _ := strconv.ParseUint(targetIDStr, 10, 64)
		if targetUserID > 0 && swipeRepo != nil {
			swipe := &domain.Swipe{
				SwiperID: user.ID,
				TargetID: uint(targetUserID),
				Action:   action,
			}
			_ = swipeRepo.RecordSwipe(nil, swipe)

			if action == domain.ActionLike {
				likedBack, _ := swipeRepo.HasLikedBack(nil, uint(targetUserID), user.ID)
				if likedBack {
					// MUTUAL MATCH! Create Match & Send Notifications
					_, _ = matchRepo.CreateMatch(nil, user.ID, uint(targetUserID))
					targetUser, _ := userRepo.GetByID(nil, uint(targetUserID))
					targetProfile, _ := profileRepo.GetByUserID(nil, uint(targetUserID))

					if targetUser != nil && targetProfile != nil {
						_ = s.SendMatchNotification(user.TelegramID, targetProfile.Name, targetUser.Username, user.LanguageCode)

						swiperProfile, _ := profileRepo.GetByUserID(nil, user.ID)
						if swiperProfile != nil {
							_ = s.SendMatchNotification(targetUser.TelegramID, swiperProfile.Name, user.Username, targetUser.LanguageCode)
						}
					}
				}
			}
		}

		// Automatically show next candidate profile in chat
		s.handleCallbackQuery(&TelegramCallbackQuery{
			ID:      query.ID,
			From:    query.From,
			Message: query.Message,
			Data:    "cmd_search",
		}, miniAppURL, profileRepo, userRepo, swipeRepo, matchRepo)
		return
	}

	if data == "cmd_search" {
		profile, _ := profileRepo.GetByUserID(nil, user.ID)
		if profile == nil {
			promptMsg := "⚠️ <b>Profil Kamu Belum Ada!</b>\n\nPilih cara mengisi profil:"
			keyboard := map[string]interface{}{
				"inline_keyboard": [][]map[string]interface{}{
					{
						{
							"text":    "🚀 Isi Profil di Mini App",
							"web_app": map[string]string{"url": miniAppURL},
						},
					},
					{
						{
							"text":          "👤 Isi Profil via Chat",
							"callback_data": "cmd_reg_chat",
						},
					},
				},
			}
			s.sendMessageWithKeyboard(chatID, promptMsg, keyboard)
			return
		}

		recs, _ := profileRepo.GetRecommendations(nil, user.ID, profile, 1)
		if len(recs) == 0 {
			noRecMsg := "😔 <b>Belum ada kandidat baru!</b>\n\nCoba buka Mini App untuk mengubah filter:"
			keyboard := map[string]interface{}{
				"inline_keyboard": [][]map[string]interface{}{
					{
						{
							"text":    "🌐 Buka Mini App",
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
						"text":    "🚀 Buka Mini App",
						"web_app": map[string]string{"url": miniAppURL},
					},
				},
			},
		}

		s.sendPhotoWithKeyboard(chatID, letPhoto, caption, keyboard)
	}
}

func (s *botService) promptCitySelection(chatID int64) {
	keyboard := map[string]interface{}{
		"inline_keyboard": [][]map[string]interface{}{
			{
				{"text": "🏙️ Jakarta", "callback_data": "city_Jakarta"},
				{"text": "🏙️ Bandung", "callback_data": "city_Bandung"},
			},
			{
				{"text": "🏙️ Surabaya", "callback_data": "city_Surabaya"},
				{"text": "🏙️ Subang", "callback_data": "city_Subang"},
			},
			{
				{"text": "🏙️ Semarang", "callback_data": "city_Semarang"},
				{"text": "🏙️ Yogyakarta", "callback_data": "city_Yogyakarta"},
			},
			{
				{"text": "🏙️ Medan", "callback_data": "city_Medan"},
				{"text": "🏙️ Malang", "callback_data": "city_Malang"},
			},
			{
				{"text": "✍️ Ketik Kota Lain", "callback_data": "city_manual"},
			},
		},
	}

	s.sendMessageWithKeyboard(chatID, "🏙️ <b>Langkah 4 dari 4: Pilih Kotamu</b>\n\nPilih dari kota populer di bawah atau ketik manual:", keyboard)
}

func (s *botService) processChatRegistrationStep(
	chatID int64,
	telegramID int64,
	text string,
	state *RegistrationState,
	miniAppURL string,
	profileRepo repository.ProfileRepository,
	userRepo repository.UserRepository,
) {
	user, _ := userRepo.GetByTelegramID(nil, telegramID)
	if user == nil {
		return
	}

	switch state.Step {
	case 1:
		state.Name = text
		state.Step = 2
		s.sendMessageWithKeyboard(chatID, "🎂 <b>Langkah 2 dari 4: Usia</b>\n\nMasukkan usiamu dalam angka (contoh: 23):", nil)

	case 2:
		age, err := strconv.Atoi(text)
		if err != nil || age < 18 || age > 100 {
			s.sendMessageWithKeyboard(chatID, "⚠️ Usia tidak valid. Masukkan angka antara 18 sampai 99:", nil)
			return
		}
		state.Age = age
		state.Step = 3
		s.promptGender(chatID)

	case 4:
		state.City = strings.Title(strings.ToLower(strings.TrimSpace(text)))
		s.finishChatRegistration(chatID, telegramID, state, miniAppURL, profileRepo, userRepo)
	}
}

func (s *botService) finishChatRegistration(
	chatID int64,
	telegramID int64,
	state *RegistrationState,
	miniAppURL string,
	profileRepo repository.ProfileRepository,
	userRepo repository.UserRepository,
) {
	user, _ := userRepo.GetByTelegramID(nil, telegramID)
	if user == nil {
		return
	}

	photosJSON, _ := json.Marshal([]string{"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80"})
	interestsJSON, _ := json.Marshal([]string{"Musik", "Kopi", "Travel"})

	profile := &domain.Profile{
		UserID:             user.ID,
		Name:               state.Name,
		Age:                state.Age,
		Gender:             state.Gender,
		TargetGender:       state.TargetGender,
		Bio:                "Halo! Saya pengguna baru di Match.in / Ketemu.in ✨",
		Country:            state.Country,
		City:               state.City,
		TargetLocationMode: domain.FilterCity,
		MinAgePref:         18,
		MaxAgePref:         50,
		Photos:             string(photosJSON),
		Interests:          string(interestsJSON),
	}

	_ = profileRepo.Upsert(nil, profile)

	s.statesLock.Lock()
	delete(s.regStates, telegramID)
	s.statesLock.Unlock()

	finishMsg := fmt.Sprintf(
		"🎉 <b>Profil Berhasil Dibuat!</b>\n\n"+
			"👤 <b>Nama</b>: %s (%d thn)\n"+
			"📍 <b>Lokasi</b>: %s, %s\n\n"+
			"Silakan pilih mode untuk mulai mencari jodoh:",
		profile.Name, profile.Age, profile.City, profile.Country,
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
			},
		},
	}

	s.sendMessageWithKeyboard(chatID, finishMsg, keyboard)
}

func (s *botService) promptGender(chatID int64) {
	keyboard := map[string]interface{}{
		"inline_keyboard": [][]map[string]interface{}{
			{
				{
					"text":          "👨 Saya Pria",
					"callback_data": "gender_male",
				},
				{
					"text":          "👩 Saya Wanita",
					"callback_data": "gender_female",
				},
			},
		},
	}
	s.sendMessageWithKeyboard(chatID, "👫 <b>Langkah 3 dari 4: Jenis Kelamin</b>\n\nPilih jenis kelaminmu:", keyboard)
}

func (s *botService) promptTargetGender(chatID int64) {
	keyboard := map[string]interface{}{
		"inline_keyboard": [][]map[string]interface{}{
			{
				{
					"text":          "👩 Mencari Wanita",
					"callback_data": "target_female",
				},
				{
					"text":          "👨 Mencari Pria",
					"callback_data": "target_male",
				},
				{
					"text":          "✨ Semua",
					"callback_data": "target_all",
				},
			},
		},
	}
	s.sendMessageWithKeyboard(chatID, "🎯 <b>Siapa yang ingin kamu cari?</b>", keyboard)
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
