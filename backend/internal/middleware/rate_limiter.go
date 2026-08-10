package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

type ipLimiter struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

type RateLimiter struct {
	ips map[string]*ipLimiter
	mu  sync.Mutex
	r   rate.Limit
	b   int
}

func NewRateLimiter(r rate.Limit, b int) *RateLimiter {
	limiter := &RateLimiter{
		ips: make(map[string]*ipLimiter),
		r:   r,
		b:   b,
	}

	go limiter.cleanupLoop()

	return limiter
}

func (rl *RateLimiter) getLimiter(ip string) *rate.Limiter {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	lim, exists := rl.ips[ip]
	if !exists {
		l := rate.NewLimiter(rl.r, rl.b)
		rl.ips[ip] = &ipLimiter{limiter: l, lastSeen: time.Now()}
		return l
	}

	lim.lastSeen = time.Now()
	return lim.limiter
}

func (rl *RateLimiter) cleanupLoop() {
	ticker := time.NewTicker(5 * time.Minute)
	for range ticker.C {
		rl.mu.Lock()
		for ip, lim := range rl.ips {
			if time.Since(lim.lastSeen) > 10*time.Minute {
				delete(rl.ips, ip)
			}
		}
		rl.mu.Unlock()
	}
}

func RateLimitMiddleware(r rate.Limit, b int) gin.HandlerFunc {
	rl := NewRateLimiter(r, b)

	return func(c *gin.Context) {
		ip := c.ClientIP()
		limiter := rl.getLimiter(ip)

		if !limiter.Allow() {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "Rate limit exceeded. Please try again later.",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}
