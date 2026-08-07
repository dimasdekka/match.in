package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"matchin-backend/pkg/i18n"
)

type BotService interface {
	SendMatchNotification(telegramID int64, matchedName string, matchedTelegramUsername string, langCode string) error
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
	ChatID                int64                  `json:"chat_id"`
	Text                  string                 `json:"text"`
	ParseMode             string                 `json:"parse_mode"`
	ReplyMarkup           map[string]interface{} `json:"reply_markup,omitempty"`
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
			"inline_keyboard": [][]map[string]string{
				{
					{
						"text": "💬 Chat @ " + matchedTelegramUsername,
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

	if resp.StatusCode >= 400 {
		return fmt.Errorf("telegram bot API returned status: %d", resp.StatusCode)
	}

	return nil
}
