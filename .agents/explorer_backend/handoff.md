# Handoff Report: Backend Architecture Investigation

**Agent**: Explorer 1 (`teamwork_preview_explorer`)  
**Working Directory**: `c:\Users\Unicodes\Documents\Developments\Project\Telegram-Multi-Couple\.agents\explorer_backend\`  
**Date**: 2026-08-10  
**Status**: Completed  

---

## 1. Observation

Direct observations from examining the backend codebase under `backend/`:

1. **Layer Bypassing in `AuthHandler`**:
   - `internal/handler/auth_handler.go:12`: `type AuthHandler struct { userRepo repository.UserRepository }`
   - `internal/handler/auth_handler.go:48`: `if err := h.userRepo.UpdateLanguage(c.Request.Context(), user.ID, req.LanguageCode); err != nil`
   - *Observation*: Handlers directly import and execute queries via `UserRepository` instead of going through a `UserService`.

2. **Layer Bypassing & Direct Database Access in Middleware**:
   - `internal/middleware/telegram_auth.go:12`: `func TelegramAuthMiddleware(authService service.AuthService, userRepo repository.UserRepository, botToken string)`
   - `internal/middleware/telegram_auth.go:26`: `if err := userRepo.CreateOrUpdate(c.Request.Context(), user); err != nil`
   - *Observation*: Middleware directly interacts with `UserRepository` to create/update user records rather than through `AuthService` or `UserService`.

3. **Missing `context.Context` Propagation**:
   - `internal/service/auth_service.go:18`: `ValidateTelegramInitData(initDataRaw string, botToken string) (*domain.User, error)`
   - `internal/service/bot_service.go:14`: `SendMatchNotification(telegramID int64, matchedName string, matchedTelegramUsername string, langCode string) error`
   - *Observation*: Method signatures lack `ctx context.Context` parameter.

4. **Security Vulnerability in Telegram Auth Signature Check**:
   - `internal/service/auth_service.go:45`: `if botToken != "" && hashReceived != ""`
   - `internal/service/auth_service.go:81-87`: Hardcoded fallback payload for `tgUser` ("Alex Dev", `ID: 100000001`).
   - *Observation*: If `hashReceived` is omitted in the request header or query, the HMAC check is completely skipped. If `user` parameter is missing or invalid JSON, it defaults to a dummy user.

5. **Swallowed Errors (`_ = err`)**:
   - `cmd/api/main.go:23`: `_ = godotenv.Load()`
   - `internal/service/profile_service.go:31-32`: `photosJSON, _ := json.Marshal(req.Photos)`
   - `internal/repository/profile_repository.go:100`: `_ = fallbackQuery.Order(...).Find(&profiles).Error`
   - `internal/service/matchmaking_service.go:67-76`: `swiperUser, _ := s.userRepo.GetByID(...)`, `_ = s.botService.SendMatchNotification(...)`
   - *Observation*: Errors are silently discarded across repository, service, and entry point files.

6. **REST API Endpoints Inventory**:
   - `GET /health` (Public)
   - `GET /api/me` (Protected)
   - `POST /api/me/language` (Protected)
   - `GET /api/profile/me` (Protected)
   - `POST /api/profile/me` (Protected)
   - `GET /api/recommendations` (Protected)
   - `POST /api/swipe` (Protected)
   - `GET /api/matches` (Protected)

7. **Missing Telegram Bot Slash Commands**:
   - Requirements specify `/start`, `/search`, `/profile`, `/matches`, `/reset`, `/help`.
   - `internal/service/bot_service.go` contains ONLY `SendMatchNotification` (outbound Telegram API call).
   - *Observation*: No inbound bot update listener or webhook/polling handler exists in `backend/` for commands `/start`, `/search`, `/profile`, `/matches`, `/reset`, `/help`.

---

## 2. Logic Chain

1. **Step 1**: The user requirement (R1) specifies strict Go Clean Architecture (Handler -> Service -> Repository), zero global mutable state, strict context propagation, and no swallowed errors.
2. **Step 2**: Examining `internal/handler/auth_handler.go` and `internal/middleware/telegram_auth.go` reveals that both directly inject `UserRepository` and execute database calls, bypassing the Service layer.
3. **Step 3**: Examining `internal/service/auth_service.go` and `internal/service/bot_service.go` shows missing `context.Context` parameters in key service methods.
4. **Step 4**: Examining error handling across `profile_repository.go`, `matchmaking_service.go`, `profile_service.go`, and `main.go` demonstrates widespread `_ = err` error swallowing.
5. **Step 5**: Checking security mechanisms in `auth_service.go` shows signature check bypass when `hash` is missing and a hardcoded mock user fallback, violating requirement R2.
6. **Step 6**: Auditing `bot_service.go` and `cmd/api/main.go` proves that Telegram Bot commands (`/start`, `/search`, `/profile`, `/matches`, `/reset`, `/help`) are missing an inbound handler/webhook receiver.
7. **Conclusion**: The backend requires refactoring to implement proper `UserService`, move repository calls out of handlers/middleware, propagate `context.Context`, harden authentication HMAC checks, fix swallowed errors, and add Telegram Bot command handlers.

---

## 3. Caveats

- **Network Tests**: External calls to `api.telegram.org` were not tested live as this is a read-only code analysis.
- **Database Backend**: Currently configured for SQLite (`matchin.db`). Production deployment may require PostgreSQL/MySQL driver swap.
- **Bot Strategy**: Whether the bot uses Webhooks (`POST /api/bot/webhook`) or Long Polling will depend on the deployment environment (Webhook recommended for serverless/cloud environments, Polling for simple server daemons).

---

## 4. Conclusion

The current backend implementation provides a working prototype for REST endpoints, but contains key Clean Architecture violations (Handler/Middleware accessing Repository directly), security risks (bypassed HMAC validation in auth service), missing `context.Context` propagation, swallowed errors (`_ = err`), and missing Telegram Bot command handlers.

Refactoring to Clean Architecture requires:
1. Creating `UserService` to handle user-related logic and language updates.
2. Removing direct `UserRepository` references from `AuthHandler` and `TelegramAuthMiddleware`.
3. Updating all Repository and Service method signatures to accept `ctx context.Context`.
4. Strict error wrapping (`fmt.Errorf("...: %w", err)`) and eliminating all `_ = err`.
5. Hardening Telegram initData HMAC verification (rejecting invalid/missing signatures).
6. Building inbound Telegram Bot update handlers for `/start`, `/search`, `/profile`, `/matches`, `/reset`, and `/help`.

---

## 5. Verification Method

To independently verify the findings in this report:

1. **Verify Layer Bypassing**:
   - Inspect `internal/handler/auth_handler.go:12,48` and `internal/middleware/telegram_auth.go:12,26` to confirm direct `userRepo` calls.
2. **Verify Security Auth Weakness**:
   - Inspect `internal/service/auth_service.go:45,81-87` to observe the `hashReceived != ""` bypass condition and "Alex Dev" mock user fallback.
3. **Verify Error Swallowing**:
   - Search for `_ = ` across `backend/` (`grep_search` query: `_ =`).
4. **Verify Missing Bot Command Handlers**:
   - Check `internal/service/bot_service.go` and `cmd/api/main.go` for any reference to `/start`, `/search`, `/profile`, `/matches`, `/reset`, or `/help`. Observe that only outbound `SendMatchNotification` exists.
