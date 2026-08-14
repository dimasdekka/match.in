package main

import (
	"fmt"
	"log"
	"os"

	"matchin-backend/internal/domain"

	"github.com/glebarez/sqlite"
	"github.com/joho/godotenv"
	"gorm.io/gorm"
)

func main() {
	_ = godotenv.Load()

	dbPath := os.Getenv("DATABASE_URL")
	if dbPath == "" {
		dbPath = "matchin.db"
	}

	fmt.Printf("⚠️  Menghubungkan ke database di: %s\n", dbPath)
	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
	if err != nil {
		log.Fatalf("❌ Gagal membuka database: %v", err)
	}

	// Auto migrate tables just in case
	_ = db.AutoMigrate(
		&domain.User{},
		&domain.Profile{},
		&domain.Swipe{},
		&domain.Match{},
		&domain.ChatMessage{},
		&domain.Report{},
	)

	fmt.Println("🧹 Memulai reset total database...")

	// Delete all records from each table
	r1 := db.Session(&gorm.Session{AllowGlobalUpdate: true}).Unscoped().Delete(&domain.ChatMessage{})
	r2 := db.Session(&gorm.Session{AllowGlobalUpdate: true}).Unscoped().Delete(&domain.Report{})
	r3 := db.Session(&gorm.Session{AllowGlobalUpdate: true}).Unscoped().Delete(&domain.Swipe{})
	r4 := db.Session(&gorm.Session{AllowGlobalUpdate: true}).Unscoped().Delete(&domain.Match{})
	r5 := db.Session(&gorm.Session{AllowGlobalUpdate: true}).Unscoped().Delete(&domain.Profile{})
	r6 := db.Session(&gorm.Session{AllowGlobalUpdate: true}).Unscoped().Delete(&domain.User{})

	// Reset auto increment sequence
	db.Exec("DELETE FROM sqlite_sequence WHERE name IN ('users', 'profiles', 'swipes', 'matches', 'chat_messages', 'reports');")
	db.Exec("VACUUM;")

	fmt.Println("==================================================")
	fmt.Println("✅ RESET TOTAL DATABASE BERHASIL 100%!")
	fmt.Printf("   • Chat Messages terhapus : %d baris\n", r1.RowsAffected)
	fmt.Printf("   • Reports terhapus       : %d baris\n", r2.RowsAffected)
	fmt.Printf("   • Swipes terhapus        : %d baris\n", r3.RowsAffected)
	fmt.Printf("   • Matches terhapus       : %d baris\n", r4.RowsAffected)
	fmt.Printf("   • Profiles terhapus      : %d baris\n", r5.RowsAffected)
	fmt.Printf("   • Users terhapus         : %d baris\n", r6.RowsAffected)
	fmt.Println("==================================================")
	fmt.Println("✨ Database sekarang dalam kondisi bersih total (fresh clean slate)!")
}
