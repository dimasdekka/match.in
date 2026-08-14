package websocket

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"matchin-backend/internal/domain"
	"github.com/gorilla/websocket"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 512 * 1024 // 512 KB (supports images/audio)
)

type MessageHandler func(ctx context.Context, client *Client, msg *domain.WSMessage)

type Client struct {
	hub            Hub
	conn           *websocket.Conn
	send           chan *domain.WSMessage
	userID         uint
	messageHandler MessageHandler
}

func NewClient(hub Hub, conn *websocket.Conn, userID uint, messageHandler MessageHandler) *Client {
	return &Client{
		hub:            hub,
		conn:           conn,
		send:           make(chan *domain.WSMessage, 256),
		userID:         userID,
		messageHandler: messageHandler,
	}
}

func (c *Client) UserID() uint {
	return c.userID
}

func (c *Client) ReadPump(ctx context.Context) {
	defer func() {
		c.hub.Unregister(c)
		_ = c.conn.Close()
	}()

	c.conn.SetReadLimit(maxMessageSize)
	_ = c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		_ = c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, messageBytes, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WS unexpected close: %v\n", err)
			}
			break
		}

		var wsMsg domain.WSMessage
		if err := json.Unmarshal(messageBytes, &wsMsg); err != nil {
			log.Printf("WS unmarshal error: %v\n", err)
			continue
		}

		if wsMsg.Event == domain.WSEventPing {
			c.send <- &domain.WSMessage{Event: domain.WSEventPong, Timestamp: time.Now()}
			continue
		}

		if c.messageHandler != nil {
			c.messageHandler(ctx, c, &wsMsg)
		}
	}
}

func (c *Client) WritePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		_ = c.conn.Close()
	}()

	for {
		select {
		case msg, ok := <-c.send:
			_ = c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				_ = c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			if err := json.NewEncoder(w).Encode(msg); err != nil {
				return
			}
			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			_ = c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
