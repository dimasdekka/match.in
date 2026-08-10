# Project: Telegram-Multi-Couple (Match.in / Ketemu.in)

## Architecture
Clean Architecture with strict layer separation:
`Handler -> Service -> Repository -> Database (GORM/SQLite)`

- **Handler**: REST HTTP Handlers & Bot Command Handlers. Parse request, validate with `validator/v10`, call Service, return JSON/HTTP status.
- **Service**: Business logic, authorization checks, transaction orchestration, Telegram HMAC validation, bot messaging.
- **Repository**: Data persistence via GORM with strict `ctx context.Context` propagation and parameterized queries.
- **Frontend**: React 19 + Vite + TypeScript SPA Telegram Mini App with Zod validation and i18n.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Telegram initData HMAC Auth | Security verification for Telegram Mini App auth string | M1 | Survey |
| 2 | Backend Clean Architecture | Strict Handler -> Service -> Repository layer separation | M1 | Survey |
| 3 | Context Propagation & Errors | `ctx context.Context` across all signatures, wrapped errors | M1 | Survey |
| 4 | Rate Limiting & CORS | Rate limiting middleware and configurable CORS origins | M1 | Survey |
| 5 | Input Validation (Backend) | DTO validation via `validator/v10` | M1 | Survey |
| 6 | Telegram Bot Commands | Inbound Telegram Bot handlers (/start, /search, /profile, /matches, /reset, /help) | M2 | Survey |
| 7 | Frontend Dependencies | Install missing i18next, lucide-react dependencies | M3 | Survey |
| 8 | Telegram Mini App UI | Discover/Swipe, Matches, Profile, Header, Filters UI components | M3 | Survey |
| 9 | Frontend Zod Validation | Zod schema validation for forms & API requests | M3 | Survey |
| 10 | Backend Unit & Integration Tests | Unit & integration tests for auth, handlers, services, repos, bot commands | M4 | Survey |
| 11 | Build Verification | Clean compilation (`go build ./...`, `npm run build`) | M4 | Survey |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1: Backend Security & Clean Architecture | Refactor Auth, Handlers, Services, Repositories, Context, Errors, HMAC, Rate Limit, CORS | none | DONE |
| 2 | M2: Telegram Bot Commands & Inbound Listener | Implement Telegram bot commands (/start, /search, /profile, /matches, /reset, /help) | M1 | DONE |
| 3 | M3: Frontend Mini App UI & Zod Validation | Fix dependencies, build UI pages/components, Zod schemas, API integration | M1 | DONE |
| 4 | M4: Comprehensive Testing & Security Hardening Verification | Backend test suite (`go test ./...`), E2E test verification, final build check | M1, M2, M3 | DONE |

## Interface Contracts

### Backend Layer Signatures
```go
// Handler
type UserHandler struct { userService service.UserService }
func (h *UserHandler) GetMe(c *gin.Context)

// Service
type UserService interface {
    GetOrCreateUser(ctx context.Context, tgUser *domain.TelegramUser) (*domain.User, error)
    UpdateLanguage(ctx context.Context, userID int64, lang string) error
}

type AuthService interface {
    ValidateTelegramInitData(ctx context.Context, initDataRaw string) (*domain.TelegramUser, error)
}

// Repository
type UserRepository interface {
    GetByID(ctx context.Context, id int64) (*domain.User, error)
    GetByTelegramID(ctx context.Context, tgID int64) (*domain.User, error)
    Create(ctx context.Context, user *domain.User) error
    Update(ctx context.Context, user *domain.User) error
}
```

## Code Layout

### Backend (`backend/`)
```
backend/
├── cmd/api/main.go
├── internal/
│   ├── config/
│   ├── domain/
│   ├── handler/
│   ├── middleware/
│   ├── repository/
│   └── service/
└── pkg/i18n/
```

### Frontend (`frontend/`)
```
frontend/
├── src/
│   ├── components/
│   ├── hooks/
│   ├── pages/
│   ├── schemas/
│   ├── services/
│   ├── types/
│   ├── App.tsx
│   ├── main.tsx
│   └── i18n.ts
└── package.json
```
