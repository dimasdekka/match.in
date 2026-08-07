package i18n

import "strings"

type Dictionary struct {
	AppName            string
	Tagline            string
	NewMatchTitle      string
	NewMatchMessage    string
	ProfileUpdateSuccess string
}

var Translations = map[string]Dictionary{
	"id": {
		AppName:              "Ketemu.in",
		Tagline:              "Cari Pasangan, Teman & Matchmaking",
		NewMatchTitle:        "🎉 Terjadi Mutual Match!",
		NewMatchMessage:      "Selamat! Kamu dan %s saling menyukai di Ketemu.in! Buka obrolan Telegram sekarang:",
		ProfileUpdateSuccess: "Profil berhasil diperbarui!",
	},
	"en": {
		AppName:              "Match.in",
		Tagline:              "Dating, Find Friends & Matchmaking",
		NewMatchTitle:        "🎉 It's a Match!",
		NewMatchMessage:      "Congratulations! You and %s liked each other on Match.in! Open Telegram chat now:",
		ProfileUpdateSuccess: "Profile updated successfully!",
	},
}

func GetDict(lang string) Dictionary {
	lang = strings.ToLower(lang)
	if strings.HasPrefix(lang, "id") {
		return Translations["id"]
	}
	return Translations["en"]
}
