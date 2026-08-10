# Backend Architecture Investigation & Analysis Report

**Project**: Match.in / Ketemu.in Backend  
**Target Path**: `backend/`  
**Date**: 2026-08-10  
**Investigator**: Explorer 1 (Backend Architecture)  

---

## 1. Directory Layout & Architecture Overview

The backend is written in Go 1.22 using the Gin web framework and GORM with SQLite (`gorm.io/driver/sqlite`).

### Directory Layout

```
backend/
├── cmd/
│   └── api/
│       └── main.go               # Main application entry point, DB setup, dependency injection, Gin routing
├── go.mod                        # Go module definition (matchin-backend)
├── internal/
│   ├── domain/                   # Domain entities, DTOs, enums
│   │   ├── user.go               # User struct, AuthRequest, AuthResponse
│   │   ├── profile.go            # Profile struct, Gender/Location Filter enums, ProfileRequest
│   │   ├── match.go              # Match struct, MatchDetail DTO
│   │   └── swipe.go              # Swipe struct, SwipeAction enum, SwipeRequest, SwipeResponse
│   ├── handler/                  # HTTP Handlers (Gin)
│   │   ├── auth_handler.go       # GetMe, UpdateLanguage
│   │   ├── profile_handler.go    # GetMyProfile, SaveProfile, GetRecommendations
│   │   └── match_handler.go      # Swipe, GetMatches
│   ├── middleware/               # HTTP Middleware
│   │   └── telegram_auth.go      # TelegramAuthMiddleware, GetCurrentUser helper
│   ├── repository/               # Data Access Layer (GORM)
│   │   ├── user_repository.go    # UserRepository interface & implementation
│   │   ├── profile_repository.go # ProfileRepository interface & implementation
│   │   └── match_repository.go   # SwipeRepository & MatchRepository interfaces & implementations
│   └── service/                  # Business Logic Layer
│       ├── auth_service.go       # ValidateTelegramInitData
│       ├── profile_service.go    # GetProfileByUserID, SaveProfile, GetRecommendations
│       ├── matchmaking_service.go# ProcessSwipe, GetMatches
│       └── bot_service.go        # SendMatchNotification (Telegram Bot API integration)
└── pkg/
    └── i18n/                     # Internationalization package
        └── i18n.go               # Indonesian & English dictionary definitions
```

---

## 2. Inventory of REST API Endpoints & Telegram Bot Commands

### A. REST API Endpoints

All API routes except `/health` are grouped under `/api` and protected by `TelegramAuthMiddleware`.

| HTTP Method | Path | Auth Required | Handler Method | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/health` | No | Anonymous inline function | Health check returning status `"ok"` and app name |
| `GET` | `/api/me` | Yes (`TelegramAuth`) | `AuthHandler.GetMe` | Returns authenticated user object from Gin context |
| `POST` | `/api/me/language` | Yes (`TelegramAuth`) | `AuthHandler.UpdateLanguage` | Updates user's language code (`id` / `en`) |
| `GET` | `/api/profile/me` | Yes (`TelegramAuth`) | `ProfileHandler.GetMyProfile` | Returns user's profile detail |
| `POST` | `/api/profile/me` | Yes (`TelegramAuth`) | `ProfileHandler.SaveProfile` | Upserts user's profile information |
| `GET` | `/api/recommendations` | Yes (`TelegramAuth`) | `ProfileHandler.GetRecommendations` | Fetches match candidates matching user filters (`limit` param, default 10) |
| `POST` | `/api/swipe` | Yes (`TelegramAuth`) | `MatchHandler.Swipe` | Records swipe (`like`/`pass`/`superlike`) & handles mutual match logic |
| `GET` | `/api/matches` | Yes (`TelegramAuth`) | `MatchHandler.GetMatches` | Returns active matches with matched profile info & Telegram direct links |

### B. Telegram Bot Commands Inventory & Implementation Status

The project requirements specify support for Telegram Bot slash commands. Below is the inventory and current codebase status:

| Command | Intended Functionality | Implementation Status | Implementation Notes |
| :--- | :--- | :--- | :--- |
| `/start` | Welcome message, language selection prompt, and Mini App WebApp button launch | **MISSING** | No bot update listener or webhook/polling handler implemented |
| `/search` | Trigger profile recommendations & open Mini App match tab | **MISSING** | No bot update listener or webhook/polling handler implemented |
| `/profile` | View & manage user profile summary card | **MISSING** | No bot update listener or webhook/polling handler implemented |
| `/matches` | View active mutual matches with direct chat links | **MISSING** | No bot update listener or webhook/polling handler implemented |
| `/reset` | Reset swipe history or filter preferences | **MISSING** | No bot update listener or webhook/polling handler implemented |
| `/help` | Show command usage guide and customer support info | **MISSING** | No bot update listener or webhook/polling handler implemented |

*Key Discovery*: The current `BotService` (`internal/service/bot_service.go`) only contains an outbound notification method (`SendMatchNotification`) that POSTs to `https://api.telegram.org/bot<token>/sendMessage`. There is no inbound webhook endpoint (`POST /api/bot/webhook`) or long-polling bot update handler anywhere in the codebase.

---

## 3. Analysis of Architectural & Code Flaws

### Flaw 1: Direct Repository Access from Handler Layer (Layer Bypassing)
- **Location**: `internal/handler/auth_handler.go:12,48`
- **Issue**: `AuthHandler` directly holds `userRepo repository.UserRepository` field and calls `h.userRepo.UpdateLanguage(c.Request.Context(), ...)` directly from the handler.
- **Impact**: Violates Clean Architecture (Handler -> Service -> Repository). Handlers should only communicate with the Service layer. Business rules surrounding language changes (e.g. logging, validation, side effects) are bypassed.

### Flaw 2: Middleware Direct Repository Coupling & Logic Leakage
- **Location**: `internal/middleware/telegram_auth.go:12,26`
- **Issue**: `TelegramAuthMiddleware` injects `userRepo repository.UserRepository` directly and calls `userRepo.CreateOrUpdate(c.Request.Context(), user)`.
- **Impact**: Middleware performs database persistence and business user synchronization directly. Database access should be encapsulated within the `AuthService` or `UserService`.

### Flaw 3: Missing Context Propagation in Service Interfaces
- **Location**: 
  - `internal/service/auth_service.go:18`: `ValidateTelegramInitData(initDataRaw string, botToken string) (*domain.User, error)`
  - `internal/service/bot_service.go:14`: `SendMatchNotification(telegramID int64, matchedName string, matchedTelegramUsername string, langCode string) error`
- **Impact**: Methods lack `ctx context.Context` as their first parameter. Violates Go best practices for request cancellation, deadlines, tracing, and context propagation required by project standards.

### Flaw 4: Security Weaknesses & Bypass in Telegram Auth Signature Validation
- **Location**: `internal/service/auth_service.go:45-71, 80-88`
- **Issue A**: In `ValidateTelegramInitData`, line 45 has `if botToken != "" && hashReceived != ""`. If an attacker omits the `hash` parameter in `initDataRaw`, `hashReceived` becomes `""`, causing the signature verification block to be skipped completely!
- **Issue B**: If `userJSON == ""`, lines 81-87 construct a hardcoded mock user payload (`ID: 100000001`, "Alex Dev") and return a valid user object.
- **Impact**: Critical security vulnerability allowing unauthenticated authorization bypass in production environments.

### Flaw 5: Widespread Error Swallowing & Ignored Errors (`_ = err`)
- **Locations**:
  - `cmd/api/main.go:23`: `_ = godotenv.Load()` ignores dotenv loading error.
  - `cmd/api/main.go:220`: `b, _ := json.Marshal(v)` ignores JSON encoding errors.
  - `internal/service/profile_service.go:31-32`: `photosJSON, _ := json.Marshal(req.Photos)`, `interestsJSON, _ := json.Marshal(req.Interests)` ignores JSON marshaling errors.
  - `internal/repository/profile_repository.go:100`: `_ = fallbackQuery.Order("is_boosted DESC, updated_at DESC").Limit(limit).Find(&profiles).Error` swallows database query errors.
  - `internal/service/matchmaking_service.go:67,68,69,72,74,76`: Swallows errors when fetching swiper user, target user, target profile, sending notification, and fetching swiper profile (`_ = s.botService.SendMatchNotification(...)`).
- **Impact**: Silent failures in production, hard-to-debug runtime issues, and potential data inconsistency.

### Flaw 6: Global Permissive CORS & Hardcoded Configurations
- **Location**: `cmd/api/main.go:31,60`
- **Issue**: `sqlite.Open("matchin.db")` has DB connection string hardcoded in `main.go`. CORS is configured with `config.AllowAllOrigins = true`.
- **Impact**: Security risk for production deployment (CSRF/CORS origin spoofing) and lack of environment variable configuration for DB connection strings.

### Flaw 7: Storing Unvalidated JSON Strings in GORM Text Columns
- **Location**: `internal/domain/profile.go:36-37`, `internal/service/profile_service.go:31-32`
- **Issue**: `Photos` and `Interests` are represented as `string` types in Go struct with `gorm:"type:text"`. Handlers pass `req.Photos` (`[]string`) to service, which marshals to JSON string without validation.
- **Impact**: No database schema constraints, risks corrupt JSON in database, and inefficient query serialization/deserialization.

---

## 4. Proposed Clean Architecture Blueprint

To align with Go Clean Architecture rules (Handler -> Service -> Repository), the backend architecture must be refactored according to the following blueprint.

### Architecture Layering Principles

```
  ┌─────────────────────────────────────────────────────────┐
  │                 HTTP Handlers / Bot Webhook             │
  │   (Gin Router, Request Binding, Status Code Mapping)    │
  └───────────────────────────┬─────────────────────────────┘
                              │
                              ▼
  ┌─────────────────────────────────────────────────────────┐
  │                     Service Layer                       │
  │ (Business Rules, Tx Orchestration, Interface Contracts) │
  └───────────────────────────┬─────────────────────────────┘
                              │
                              ▼
  ┌─────────────────────────────────────────────────────────┐
  │                    Repository Layer                     │
  │    (GORM DB Operations, Parameterized SQL, Context)     │
  └───────────────────────────┬─────────────────────────────┘
```

### Proposed Interface Contracts

#### 1. Repository Interfaces (`internal/repository/`)

```go
type UserRepository interface {
    GetByTelegramID(ctx context.Context, telegramID int64) (*domain.User, error)
    GetByID(ctx context.Context, id uint) (*domain.User, error)
    CreateOrUpdate(ctx context.Context, user *domain.User) error
    UpdateLanguage(ctx context.Context, userID uint, lang string) error
}

type ProfileRepository interface {
    GetByUserID(ctx context.Context, userID uint) (*domain.Profile, error)
    Upsert(ctx context.Context, profile *domain.Profile) error
    GetRecommendations(ctx context.Context, currentUserID uint, currentProfile *domain.Profile, limit int) ([]*domain.Profile, error)
}

type SwipeRepository interface {
    RecordSwipe(ctx context.Context, swipe *domain.Swipe) error
    HasLikedBack(ctx context.Context, targetID uint, swiperID uint) (bool, error)
}

type MatchRepository interface {
    CreateMatch(ctx context.Context, user1ID, user2ID uint) (*domain.Match, error)
    GetMatchesForUser(ctx context.Context, userID uint) ([]*domain.Match, error)
}
```

#### 2. Service Interfaces (`internal/service/`)

```go
type AuthService interface {
    AuthenticateTelegram(ctx context.Context, initDataRaw string) (*domain.User, error)
}

type UserService interface {
    GetUserByID(ctx context.Context, id uint) (*domain.User, error)
    UpdateLanguage(ctx context.Context, userID uint, lang string) error
}

type ProfileService interface {
    GetProfileByUserID(ctx context.Context, userID uint) (*domain.Profile, error)
    SaveProfile(ctx context.Context, userID uint, req *domain.ProfileRequest) (*domain.Profile, error)
    GetRecommendations(ctx context.Context, userID uint, limit int) ([]*domain.Profile, error)
}

type MatchmakingService interface {
    ProcessSwipe(ctx context.Context, swiperID uint, req *domain.SwipeRequest) (*domain.SwipeResponse, error)
    GetMatches(ctx context.Context, userID uint) ([]*domain.MatchDetail, error)
}

type BotService interface {
    SendMatchNotification(ctx context.Context, telegramID int64, matchedName string, matchedTelegramUsername string, langCode string) error
    HandleWebhookUpdate(ctx context.Context, update *domain.TelegramUpdate) error
}
```

#### 3. Handler Interfaces & Construction (`internal/handler/`)

- `AuthHandler`: Injects `service.UserService` and `service.AuthService`.
- `ProfileHandler`: Injects `service.ProfileService`.
- `MatchHandler`: Injects `service.MatchmakingService`.
- `BotHandler`: Injects `service.BotService` for handling inbound Telegram bot webhooks (`/start`, `/search`, `/profile`, `/matches`, `/reset`, `/help`).

#### 4. Refactored Middleware (`internal/middleware/`)

`TelegramAuthMiddleware(authService service.AuthService)` calls `authService.AuthenticateTelegram(c.Request.Context(), initData)` which handles both initData signature validation and user persistence, returning the authenticated `*domain.User`.

---

## 5. Summary & Actionable Recommendations

1. **Fix Layering Violations**: Remove `userRepo` from `AuthHandler` and `TelegramAuthMiddleware`. Route language updates and user auth through `UserService` / `AuthService`.
2. **Harden Security & Telegram Signature Check**: Reject requests if `hash` is missing or HMAC check fails. Remove mock user fallbacks (`Alex Dev`).
3. **Propagate `context.Context`**: Ensure every Service & Repository method accepts `ctx context.Context` as its first parameter.
4. **Eliminate Error Swallowing**: Replace all `_ = err` with proper error handling and context-aware error wrapping (`fmt.Errorf("...: %w", err)`).
5. **Implement Telegram Bot Commands**: Build inbound Telegram update handler (`BotHandler` / `BotService`) supporting `/start`, `/search`, `/profile`, `/matches`, `/reset`, and `/help`.
