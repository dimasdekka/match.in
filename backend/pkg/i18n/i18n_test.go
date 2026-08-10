package i18n_test

import (
	"testing"

	"matchin-backend/pkg/i18n"
)

func TestI18nGetDict(t *testing.T) {
	t.Run("Indonesian dictionary retrieval", func(t *testing.T) {
		dict := i18n.GetDict("id")
		if dict.AppName != "Ketemu.in" {
			t.Fatalf("expected AppName Ketemu.in, got %s", dict.AppName)
		}

		dictPrefix := i18n.GetDict("id-ID")
		if dictPrefix.AppName != "Ketemu.in" {
			t.Fatalf("expected AppName Ketemu.in for id-ID, got %s", dictPrefix.AppName)
		}
	})

	t.Run("English dictionary retrieval and fallback", func(t *testing.T) {
		dictEn := i18n.GetDict("en")
		if dictEn.AppName != "Match.in" {
			t.Fatalf("expected AppName Match.in, got %s", dictEn.AppName)
		}

		dictFallback := i18n.GetDict("fr")
		if dictFallback.AppName != "Match.in" {
			t.Fatalf("expected fallback AppName Match.in for unknown lang, got %s", dictFallback.AppName)
		}
	})
}
