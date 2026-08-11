package domain

type TelegramBotUpdate struct {
	UpdateID      int64                  `json:"update_id"`
	Message       *TelegramBotMessage    `json:"message"`
	CallbackQuery *TelegramCallbackQuery `json:"callback_query"`
}

type TelegramBotMessage struct {
	MessageID int64            `json:"message_id"`
	From      *TelegramBotUser `json:"from"`
	Chat      TelegramBotChat  `json:"chat"`
	Text      string           `json:"text"`
	Date      int64            `json:"date"`
}

type TelegramCallbackQuery struct {
	ID      string              `json:"id"`
	From    *TelegramBotUser    `json:"from"`
	Message *TelegramBotMessage `json:"message"`
	Data    string              `json:"data"`
}

type TelegramBotUser struct {
	ID           int64  `json:"id"`
	IsBot        bool   `json:"is_bot"`
	FirstName    string `json:"first_name"`
	LastName     string `json:"last_name"`
	Username     string `json:"username"`
	LanguageCode string `json:"language_code"`
}

type TelegramBotChat struct {
	ID        int64  `json:"id"`
	Type      string `json:"type"`
	Title     string `json:"title,omitempty"`
	Username  string `json:"username,omitempty"`
	FirstName string `json:"first_name,omitempty"`
	LastName  string `json:"last_name,omitempty"`
}
