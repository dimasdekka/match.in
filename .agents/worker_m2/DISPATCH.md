## 2026-08-10T05:11:36Z
You are teamwork_preview_worker (Worker M2: Telegram Bot Commands & Inbound Listener).
Your working directory is: c:\Users\Unicodes\Documents\Developments\Project\Telegram-Multi-Couple\.agents\worker_m2\

Task:
Read c:\Users\Unicodes\Documents\Developments\Project\Telegram-Multi-Couple\ORIGINAL_REQUEST.md and c:\Users\Unicodes\Documents\Developments\Project\Telegram-Multi-Couple\PROJECT.md.

Execute Milestone 2 (Telegram Bot Commands & Inbound Listener) in c:\Users\Unicodes\Documents\Developments\Project\Telegram-Multi-Couple\backend\:
1. Extend `internal/service/bot_service.go` and create `internal/handler/bot_handler.go` following strict Go Clean Architecture (`Handler -> Service -> Repository`).
2. Implement Telegram Bot update listener / polling engine and webhook endpoint handler (`POST /api/bot/webhook`).
3. Implement command routing and response logic for all 6 required Telegram slash commands:
   - `/start`: Welcome message, register user from Telegram payload, send Mini App inline keyboard link.
   - `/search`: Find candidate recommendations for the user and format as Telegram message cards.
   - `/profile`: Retrieve and format user profile details.
   - `/matches`: Retrieve and format current user matches list.
   - `/reset`: Reset swipe history / recommendations queue for the user.
   - `/help`: Display commands overview and instructions.
4. Ensure strict `ctx context.Context` propagation across all bot service and handler methods.
5. Context-aware error wrapping (`fmt.Errorf("...: %w", err)`), zero swallowed errors (`_ = err`).
6. Register bot webhook endpoint or start polling goroutine cleanly in `cmd/api/main.go`.
7. Verify build by running `go build ./...` inside `backend/`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Write a detailed handoff report to c:\Users\Unicodes\Documents\Developments\Project\Telegram-Multi-Couple\.agents\worker_m2\handoff.md with build output and test details. When complete, send a message to parent.
