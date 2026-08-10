package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"matchin-backend/internal/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

func TestRateLimiter(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Create router with rate limit of 2 req/sec, burst 3
	r := gin.New()
	r.Use(middleware.RateLimitMiddleware(rate.Limit(2), 3))
	r.GET("/test", func(c *gin.Context) {
		c.String(http.StatusOK, "OK")
	})

	// First 3 requests (within burst) should succeed (200 OK)
	for i := 1; i <= 3; i++ {
		req := httptest.NewRequest("GET", "/test", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("Request %d expected 200 OK, got %d", i, w.Code)
		}
	}

	// 4th immediate request should exceed burst limit and return 429 Too Many Requests
	req := httptest.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusTooManyRequests {
		t.Errorf("Expected 429 Too Many Requests on burst exceed, got %d", w.Code)
	}

	if !strings.Contains(w.Body.String(), "Rate limit exceeded") {
		t.Errorf("Expected rate limit error message, got: %s", w.Body.String())
	}
}

func TestCORSConfiguration(t *testing.T) {
	gin.SetMode(gin.TestMode)

	setupRouterWithOrigins := func(corsOrigins string) *gin.Engine {
		r := gin.New()
		config := cors.DefaultConfig()
		if corsOrigins != "" && corsOrigins != "*" {
			origins := strings.Split(corsOrigins, ",")
			var cleaned []string
			for _, o := range origins {
				if trimmed := strings.TrimSpace(o); trimmed != "" {
					cleaned = append(cleaned, trimmed)
				}
			}
			config.AllowAllOrigins = false
			config.AllowOrigins = cleaned
		} else {
			config.AllowAllOrigins = true
		}
		config.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Telegram-Init-Data"}
		config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
		r.Use(cors.New(config))
		r.GET("/api/test", func(c *gin.Context) {
			c.String(http.StatusOK, "OK")
		})
		return r
	}

	t.Run("Explicit allowed origins", func(t *testing.T) {
		r := setupRouterWithOrigins("https://matchin.app, http://localhost:5173")

		// Allowed origin
		req := httptest.NewRequest("GET", "/api/test", nil)
		req.Header.Set("Origin", "http://localhost:5173")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		if w.Header().Get("Access-Control-Allow-Origin") != "http://localhost:5173" {
			t.Errorf("Expected Access-Control-Allow-Origin http://localhost:5173, got %s", w.Header().Get("Access-Control-Allow-Origin"))
		}

		// Disallowed origin
		reqDisallowed := httptest.NewRequest("GET", "/api/test", nil)
		reqDisallowed.Header.Set("Origin", "https://malicious-site.com")
		wDisallowed := httptest.NewRecorder()
		r.ServeHTTP(wDisallowed, reqDisallowed)

		if wDisallowed.Header().Get("Access-Control-Allow-Origin") == "https://malicious-site.com" {
			t.Errorf("Disallowed origin was incorrectly allowed!")
		}
	})

	t.Run("Wildcard origins", func(t *testing.T) {
		r := setupRouterWithOrigins("*")

		req := httptest.NewRequest("GET", "/api/test", nil)
		req.Header.Set("Origin", "https://any-domain.com")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		if w.Header().Get("Access-Control-Allow-Origin") != "*" {
			t.Errorf("Expected Access-Control-Allow-Origin *, got %s", w.Header().Get("Access-Control-Allow-Origin"))
		}
	})
}
