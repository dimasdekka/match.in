package i18n

import "strings"

type Dictionary struct {
	AppName              string
	Tagline              string
	NewMatchTitle        string
	NewMatchMessage      string
	ProfileUpdateSuccess string
	BotWelcome           string
	BotHelp              string
	BotNoProfile         string
	BotNoRecommendations string
	BotNoMatches         string
	BotResetSuccess      string
	BotUnknownCommand    string
}

var Translations = map[string]Dictionary{
	"id": {
		AppName:              "Ketemu.in",
		Tagline:              "Cari Pasangan, Teman & Matchmaking",
		NewMatchTitle:        "🎉 Terjadi Mutual Match!",
		NewMatchMessage:      "Selamat! Kamu dan %s saling menyukai di Ketemu.in! Buka obrolan Telegram sekarang:",
		ProfileUpdateSuccess: "Profil berhasil diperbarui!",
		BotWelcome:           "👋 <b>Selamat Datang di Ketemu.in!</b> 💖\n\nPlatform matchmaking & pencarian pasangan terbaik di Telegram. Buka Mini App untuk mulai mencari jodoh!",
		BotHelp:              "🤖 <b>Perintah Bot Ketemu.in</b>\n\n/start - Pesan selamat datang & buka Mini App\n/search - Cari rekomendasi pasangan & kandidat\n/profile - Lihat detail profil kamu\n/matches - Lihat daftar pasangan (match) kamu\n/reset - Reset riwayat swipe & antrean rekomendasi\n/help - Tampilkan bantuan & panduan perintah\n\n💡 <i>Tips: Buka Mini App untuk fitur lengkap!</i>",
		BotNoProfile:         "⚠️ <b>Profil Belum Dibuat</b>\n\nKamu belum membuat profil di Ketemu.in. Buka Mini App untuk melengkapi profil kamu terlebih dahulu!",
		BotNoRecommendations: "🔍 <b>Tidak Ada Rekomendasi</b>\n\nSaat ini belum ada rekomendasi baru yang cocok. Gunakan /reset untuk menghapus riwayat swipe atau periksa lagi nanti!",
		BotNoMatches:         "💌 <b>Belum Ada Match</b>\n\nKamu belum memiliki pasangan match. Terus swipe di Mini App atau gunakan /search untuk menemukan kandidat baru!",
		BotResetSuccess:      "🔄 <b>Riwayat Swipe Berhasil Direset!</b>\n\nRiwayat swipe dan antrean rekomendasi kamu telah dibersihkan. Kamu bisa menggunakan /search atau membuka Mini App untuk mencari kandidat kembali!",
		BotUnknownCommand:    "❓ Perintah tidak dikenali. Ketik /help untuk melihat daftar perintah yang tersedia.",
	},
	"en": {
		AppName:              "Match.in",
		Tagline:              "Dating, Find Friends & Matchmaking",
		NewMatchTitle:        "🎉 It's a Match!",
		NewMatchMessage:      "Congratulations! You and %s liked each other on Match.in! Open Telegram chat now:",
		ProfileUpdateSuccess: "Profile updated successfully!",
		BotWelcome:           "👋 <b>Welcome to Match.in!</b> 💖\n\nThe ultimate matchmaking & dating app on Telegram. Launch the Mini App to start finding your match!",
		BotHelp:              "🤖 <b>Match.in Bot Commands</b>\n\n/start - Welcome message & launch Mini App\n/search - Search candidate profiles & recommendations\n/profile - View your current profile details\n/matches - View your current mutual matches\n/reset - Reset your swipe history & recommendations queue\n/help - Show commands overview\n\n💡 <i>Tip: Launch the Mini App for full features!</i>",
		BotNoProfile:         "⚠️ <b>Profile Not Found</b>\n\nYou haven't created a profile yet. Launch the Mini App to set up your profile first!",
		BotNoRecommendations: "🔍 <b>No Recommendations Found</b>\n\nNo new recommendations match your preferences right now. Use /reset to clear your swipe history or try again later!",
		BotNoMatches:         "💌 <b>No Matches Yet</b>\n\nYou don't have any matches yet. Keep swiping in the Mini App or use /search to find new candidates!",
		BotResetSuccess:      "🔄 <b>Swipe History Reset!</b>\n\nYour swipe history and recommendations queue have been cleared. You can now use /search or open the Mini App to discover candidates again!",
		BotUnknownCommand:    "❓ Unknown command. Type /help to see the available commands list.",
	},
}

func GetDict(lang string) Dictionary {
	lang = strings.ToLower(lang)
	if strings.HasPrefix(lang, "id") {
		return Translations["id"]
	}
	return Translations["en"]
}
