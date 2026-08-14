package handler

import (
	"context"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"matchin-backend/internal/domain"
	"matchin-backend/internal/repository"
	"matchin-backend/internal/service"
	wsPkg "matchin-backend/internal/websocket"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for Telegram Mini App & PWA
	},
}

type WebSocketHandler struct {
	hub         wsPkg.Hub
	authService service.AuthService
	chatService service.ChatService
	matchRepo   repository.MatchRepository
	userRepo    repository.UserRepository
}

func NewWebSocketHandler(
	hub wsPkg.Hub,
	authService service.AuthService,
	chatService service.ChatService,
	matchRepo repository.MatchRepository,
	userRepo repository.UserRepository,
) *WebSocketHandler {
	return &WebSocketHandler{
		hub:         hub,
		authService: authService,
		chatService: chatService,
		matchRepo:   matchRepo,
		userRepo:    userRepo,
	}
}

func (h *WebSocketHandler) HandleWS(c *gin.Context) {
	// 1. Authenticate user from query or header
	initData := c.Query("init_data")
	if initData == "" {
		initData = c.GetHeader("X-Telegram-Init-Data")
	}

	var user *domain.User
	var err error

	if initData != "" {
		user, err = h.authService.ValidateTelegramInitData(c.Request.Context(), initData)
	} else if token := c.Query("token"); token != "" {
		if uid, parseErr := strconv.ParseUint(token, 10, 64); parseErr == nil && uid > 0 {
			user, err = h.userRepo.GetByID(c.Request.Context(), uint(uid))
		}
	}

	if err != nil || user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized WebSocket connection"})
		return
	}

	// 2. Upgrade HTTP connection to WebSocket
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Failed to upgrade WebSocket connection for user %d: %v\n", user.ID, err)
		return
	}

	// 3. Register client to Hub and start reader/writer pumps
	client := wsPkg.NewClient(h.hub, conn, user.ID, h.handleIncomingMessage)
	h.hub.Register(client)

	go client.WritePump()
	client.ReadPump(c.Request.Context())
}

func (h *WebSocketHandler) handleIncomingMessage(ctx context.Context, client *wsPkg.Client, msg *domain.WSMessage) {
	if msg == nil || msg.MatchID == 0 {
		return
	}

	match, err := h.matchRepo.GetByID(ctx, msg.MatchID)
	if err != nil || match == nil {
		log.Printf("WebSocket: match %d not found for user %d\n", msg.MatchID, client.UserID())
		return
	}

	if match.User1ID != client.UserID() && match.User2ID != client.UserID() {
		log.Printf("WebSocket: user %d is not part of match %d\n", client.UserID(), msg.MatchID)
		return
	}

	otherUserID := match.User1ID
	if client.UserID() == match.User1ID {
		otherUserID = match.User2ID
	}

	switch msg.Event {
	case domain.WSEventChatMessage:
		content := strings.TrimSpace(msg.Content)
		if content == "" && msg.ImageURL == "" {
			return
		}

		savedMsg, err := h.chatService.SendMessage(ctx, client.UserID(), msg.MatchID, content, msg.ImageURL, msg.MessageType)
		if err != nil {
			log.Printf("WebSocket: failed to save message: %v\n", err)
			return
		}

		outMsg := &domain.WSMessage{
			Event:       domain.WSEventChatMessage,
			MatchID:     msg.MatchID,
			SenderID:    client.UserID(),
			ReceiverID:  otherUserID,
			Content:     savedMsg.Content,
			ImageURL:    savedMsg.ImageURL,
			MessageType: savedMsg.MessageType,
			MessageID:   savedMsg.ID,
			Message:     savedMsg,
			Timestamp:   savedMsg.CreatedAt,
		}

		// Broadcast in realtime to both users
		h.hub.BroadcastToMatch(match.User1ID, match.User2ID, outMsg)

	case domain.WSEventReaction:
		if msg.MessageID > 0 && msg.Reaction != "" {
			_ = h.chatService.ReactMessage(ctx, client.UserID(), msg.MessageID, msg.Reaction)
			outMsg := &domain.WSMessage{
				Event:     domain.WSEventReaction,
				MatchID:   msg.MatchID,
				MessageID: msg.MessageID,
				Reaction:  msg.Reaction,
				SenderID:  client.UserID(),
				Timestamp: time.Now(),
			}
			h.hub.BroadcastToMatch(match.User1ID, match.User2ID, outMsg)
		}

	case domain.WSEventTyping:
		outMsg := &domain.WSMessage{
			Event:     domain.WSEventTyping,
			MatchID:   msg.MatchID,
			SenderID:  client.UserID(),
			Timestamp: time.Now(),
		}
		h.hub.BroadcastToUser(otherUserID, outMsg)

	case domain.WSEventReadReceipt:
		outMsg := &domain.WSMessage{
			Event:     domain.WSEventReadReceipt,
			MatchID:   msg.MatchID,
			SenderID:  client.UserID(),
			Timestamp: time.Now(),
		}
		h.hub.BroadcastToUser(otherUserID, outMsg)
	}
}
