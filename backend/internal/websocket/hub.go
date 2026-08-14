package websocket

import (
	"context"
	"log"
	"sync"

	"matchin-backend/internal/domain"
)

type Hub interface {
	Run(ctx context.Context)
	Register(client *Client)
	Unregister(client *Client)
	BroadcastToUser(userID uint, msg *domain.WSMessage)
	BroadcastToMatch(user1ID, user2ID uint, msg *domain.WSMessage)
}

type hub struct {
	// Registered clients: userID -> map[*Client]bool
	clients    map[uint]map[*Client]bool
	broadcast  chan *broadcastMessage
	register   chan *Client
	unregister chan *Client
	mu         sync.RWMutex
}

type broadcastMessage struct {
	targetUserIDs []uint
	message       *domain.WSMessage
}

func NewHub() Hub {
	return &hub{
		clients:    make(map[uint]map[*Client]bool),
		broadcast:  make(chan *broadcastMessage, 256),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

func (h *hub) Run(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			h.mu.Lock()
			for _, clientMap := range h.clients {
				for client := range clientMap {
					close(client.send)
					_ = client.conn.Close()
				}
			}
			h.clients = make(map[uint]map[*Client]bool)
			h.mu.Unlock()
			return

		case client := <-h.register:
			h.mu.Lock()
			if _, ok := h.clients[client.userID]; !ok {
				h.clients[client.userID] = make(map[*Client]bool)
			}
			h.clients[client.userID][client] = true
			h.mu.Unlock()
			log.Printf("[WS HUB] User %d connected. Total active connections for user: %d\n", client.userID, len(h.clients[client.userID]))

		case client := <-h.unregister:
			h.mu.Lock()
			if clientMap, ok := h.clients[client.userID]; ok {
				if _, exists := clientMap[client]; exists {
					delete(clientMap, client)
					close(client.send)
					if len(clientMap) == 0 {
						delete(h.clients, client.userID)
					}
				}
			}
			h.mu.Unlock()
			log.Printf("[WS HUB] User %d disconnected\n", client.userID)

		case bm := <-h.broadcast:
			h.mu.RLock()
			for _, uid := range bm.targetUserIDs {
				if clientMap, ok := h.clients[uid]; ok {
					for client := range clientMap {
						select {
						case client.send <- bm.message:
						default:
							close(client.send)
							delete(clientMap, client)
						}
					}
				}
			}
			h.mu.RUnlock()
		}
	}
}

func (h *hub) Register(client *Client) {
	h.register <- client
}

func (h *hub) Unregister(client *Client) {
	h.unregister <- client
}

func (h *hub) BroadcastToUser(userID uint, msg *domain.WSMessage) {
	h.broadcast <- &broadcastMessage{
		targetUserIDs: []uint{userID},
		message:       msg,
	}
}

func (h *hub) BroadcastToMatch(user1ID, user2ID uint, msg *domain.WSMessage) {
	h.broadcast <- &broadcastMessage{
		targetUserIDs: []uint{user1ID, user2ID},
		message:       msg,
	}
}
