# Security & Testing Audit Report: Match.in / Ketemu.in

**Target Application**: Telegram Multi-Couple (Match.in / Ketemu.in)  
**Audit Scope**: Backend (`backend/`), Frontend (`frontend/`), Authentication, SQL/ORM, API Input & Network Hardening, Test Suite Coverage.  
**Auditor**: Explorer 3 (Security & Testing Audit)  
**Date**: 2026-08-10  

---

## Executive Summary

A comprehensive security and quality assurance audit was conducted on the Telegram Multi-Couple (Match.in / Ketemu.in) codebase. The application is built using a Go backend (Gin, GORM, SQLite) and a React/Vite TypeScript frontend.

### Summary of Audit Findings
1. **Telegram Authentication (`CRITICAL`)**: Severe auth bypass vulnerability identified in `backend/internal/service/auth_service.go`. HMAC validation is skipped if `TELEGRAM_BOT_TOKEN` or `hash` is empty. Missing `user` payload falls back to hardcoded mock user (`100000001`). `auth_date` age check is missing (replay attack risk). Non-constant time hash comparison (`!=`) used.
2. **SQL Injection & Data Access (`PASS / LOW RISK`)**: All database interactions in `user_repository.go`, `profile_repository.go`, and `match_repository.go` utilize GORM parameterized queries (`?`) or GORM builder methods (`Create`, `Save`, `Updates`, `Pluck`). Zero raw SQL string concatenation found. Minor issue: ignored errors on fallback queries.
3. **API Input Validation & Network Hardening (`MEDIUM-HIGH`)**:
   - **CORS**: Insecure `AllowAllOrigins = true` in `main.go`.
   - **Rate Limiting**: Completely absent across all HTTP endpoints.
   - **Input Validation**: Lack of enum validation (`oneof`) on `Gender`, `TargetGender`, `SwipeAction`, and `TargetLocationMode`; missing string length caps (`Bio`, `Name`); unbounded query limit parameter on recommendations.
   - **Secrets Management**: Silent failover when `.env` or `TELEGRAM_BOT_TOKEN` is missing.
4. **Test Suite Coverage (`CRITICAL Gaps`)**: 0% test coverage across the entire project. Zero unit/integration tests exist in `backend/` (`0` `*_test.go` files) and `frontend/` (no test framework installed, `0` test files).

---

## 1. Telegram Authentication Audit

### 1.1 Implementation Review
- **Files**: `backend/internal/middleware/telegram_auth.go`, `backend/internal/service/auth_service.go`
- **Method**: `ValidateTelegramInitData(initDataRaw string, botToken string) (*domain.User, error)`

### 1.2 Identified Vulnerabilities & Security Flaws

#### Vulnerability 1.1: Authentication Bypass via Missing Secret Token or Hash (CRITICAL)
- **Location**: `backend/internal/service/auth_service.go`, lines 45-71
- **Code Reference**:
  ```go
  if botToken != "" && hashReceived != "" {
      // HMAC validation code executed ONLY if botToken != "" AND hashReceived != ""
  }
  ```
- **Impact**: If an attacker supplies an `initData` string without a `hash` parameter (e.g. `user=%7B...%7D`), or if the server environment variable `TELEGRAM_BOT_TOKEN` is blank/unset, the HMAC signature validation logic is **completely skipped**. The backend proceeds to parse the `user` JSON and authenticate the caller without verifying authenticity!

#### Vulnerability 1.2: Hardcoded Fallback Identity Injection (HIGH)
- **Location**: `backend/internal/service/auth_service.go`, lines 80-88
- **Code Reference**:
  ```go
  } else {
      tgUser = TelegramUserPayload{
          ID:           100000001,
          FirstName:    "Alex",
          LastName:     "Dev",
          Username:     "alex_dev",
          LanguageCode: "id",
      }
  }
  ```
- **Impact**: If `initData` lacks a `user` key or is completely empty, the service assigns a hardcoded mock user (`TelegramID: 100000001`). Combined with Vulnerability 1.1, any unauthenticated caller sending an empty header or query param can log in as Alex Dev.

#### Vulnerability 1.3: Replay Attack Risk — Missing `auth_date` Expiration Check (MEDIUM)
- **Location**: `backend/internal/service/auth_service.go`
- **Impact**: Telegram WebApp specifications state that `initData` contains an `auth_date` parameter (Unix timestamp). Official Telegram documentation mandates validating `time.Now().Unix() - authDate <= 86400` (e.g. 24 hours). Currently, `auth_service.go` ignores `auth_date`, allowing intercepted or leaked `initData` strings to be replayed indefinitely.

#### Vulnerability 1.4: Non-Constant Time Hash Comparison (LOW-MEDIUM)
- **Location**: `backend/internal/service/auth_service.go`, line 68
- **Code Reference**:
  ```go
  if calculatedHash != hashReceived {
  ```
- **Impact**: Standard string equality comparison (`!=`) terminates on the first mismatched byte, exposing the endpoint to potential timing side-channel attacks.
- **Remediation**: Use `hmac.Equal([]byte(calculatedHash), []byte(hashReceived))` or `subtle.ConstantTimeCompare`.

#### Vulnerability 1.5: Frontend Hardcoded Default InitData Leak (LOW-MEDIUM)
- **Location**: `frontend/src/services/api.ts`, lines 5-10
- **Code Reference**:
  ```typescript
  const getTelegramInitData = (): string => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.initData) {
      return (window as any).Telegram.WebApp.initData;
    }
    return 'user=%7B%22id%22%3A100000001%2C%22first_name%22%3A%22Alex%22%2C%22last_name%22%3A%22Dev%22%2C%22username%22%3A%22alex_dev%22%2C%22language_code%22%3A%22id%22%7D';
  };
  ```
- **Impact**: When accessed in a standalone browser, frontend sends un-hashed mock `user` payload, relying on backend dev bypass. In production builds, this mock fallback must be removed or gated behind `import.meta.env.DEV`.

---

## 2. SQL Queries & Data Layer Security Audit

### 2.1 Implementation Review
- **Files**: `backend/internal/repository/user_repository.go`, `profile_repository.go`, `match_repository.go`

### 2.2 Findings & Security Analysis

| Repository Method | Query Pattern | Parameterization Status | Vulnerability Status |
| :--- | :--- | :--- | :--- |
| `UserRepository.GetByTelegramID` | `Where("telegram_id = ?", telegramID)` | Parameterized | ✅ PASS |
| `UserRepository.GetByID` | `Where("id = ?", id)` | Parameterized | ✅ PASS |
| `UserRepository.CreateOrUpdate` | `Where("telegram_id = ?", user.TelegramID)` | Parameterized | ✅ PASS |
| `UserRepository.UpdateLanguage` | `Where("id = ?", userID).Update(...)` | Parameterized | ✅ PASS |
| `ProfileRepository.GetByUserID` | `Where("user_id = ?", userID)` | Parameterized | ✅ PASS |
| `ProfileRepository.Upsert` | `Where("user_id = ?", profile.UserID)` | Parameterized | ✅ PASS |
| `ProfileRepository.GetRecommendations` | `Where("swiper_id = ?", id).Pluck(...)`<br>`Where("user_id != ?", id)`<br>`Where("user_id NOT IN ?", swipedIDs)`<br>`Where("gender = ?", targetGender)`<br>`Where("age >= ? AND age <= ?", min, max)`<br>`Where("LOWER(city) = LOWER(?) AND LOWER(country) = LOWER(?)", city, country)` | Parameterized | ✅ PASS |
| `SwipeRepositoryImpl.HasLikedBack` | `Where("swiper_id = ? AND target_id = ? AND action IN ('like', 'superlike')", targetID, swiperID)` | Parameterized | ✅ PASS |
| `MatchRepository.GetMatchesForUser` | `Where("(user1_id = ? OR user2_id = ?) AND is_active = ?", userID, userID, true)` | Parameterized | ✅ PASS |

### 2.3 Findings
- **Zero SQL Injection Risks**: All GORM database queries safely bind parameters using `?` placeholders. No string concatenation (`fmt.Sprintf`, `+`) is present in raw SQL clauses.
- **Ignored Errors**: In `profile_repository.go` line 100, `_ = fallbackQuery.Order(...).Find(&profiles).Error` suppresses database errors during recommendation fallbacks. Errors must be logged or returned.

---

## 3. API Input Validation, Network & Environment Security Audit

### 3.1 CORS Configuration (MEDIUM)
- **Location**: `backend/cmd/api/main.go`, lines 59-63
- **Code Reference**:
  ```go
  config := cors.DefaultConfig()
  config.AllowAllOrigins = true
  config.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Telegram-Init-Data"}
  config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
  r.Use(cors.New(config))
  ```
- **Risk**: `AllowAllOrigins = true` allows any malicious website in a user's browser to send cross-origin requests to the API endpoints.
- **Remediation**: Set `AllowAllOrigins = false` and configure `AllowOrigins` with trusted domain origins configured in `.env` (`ALLOWED_ORIGINS`).

### 3.2 Rate Limiting (HIGH)
- **Location**: `backend/cmd/api/main.go`
- **Risk**: Absence of rate-limiting middleware exposes API endpoints (`/api/swipe`, `/api/profile/me`, `/api/recommendations`) to abuse, automated bot scraping, denial of service (DoS), and database flooding.
- **Remediation**: Integrate a token bucket or sliding window rate-limiter middleware (e.g., `golang.org/x/time/rate` or Gin rate limiters) restricting endpoints to e.g. 60 requests/minute per User ID or IP address.

### 3.3 API Input Boundary Validation (MEDIUM)
- **Location**: `backend/internal/domain/profile.go`, `swipe.go`, `user.go`, `backend/internal/handler/profile_handler.go`
- **Findings**:
  1. `Gender` & `TargetGender`: Struct tags use `binding:"required"`, but lack enum constraint (`oneof=male female all`).
  2. `TargetLocationMode`: Lacks enum constraint (`oneof=same_city same_country global`).
  3. `SwipeAction`: Lacks enum constraint (`oneof=like pass superlike`).
  4. String Length Boundaries: `Name`, `Bio`, `City`, `Country` lack maximum character limits (`max=100`, `max=1000`).
  5. Query Parameter Validation: `/api/recommendations?limit=X` parses `limit` via `strconv.Atoi` without capping maximum value (e.g. `limit > 100`).

### 3.4 Secrets Management & Environment Loading (MEDIUM)
- **Location**: `backend/cmd/api/main.go`, lines 23-34
- **Findings**:
  1. `_ = godotenv.Load()` ignores error if `.env` fails to load.
  2. If `TELEGRAM_BOT_TOKEN` is missing, the application continues startup in insecure mode instead of failing fast (`log.Fatalf("TELEGRAM_BOT_TOKEN is required in production")`).
  3. Database string `sqlite.Open("matchin.db")` is hardcoded instead of being loaded from environment variables (`DATABASE_URL`).

---

## 4. Test Suite Coverage Audit

### 4.1 Backend Test Coverage: 0%
- **Files Inspected**: `cmd/`, `internal/domain/`, `internal/handler/`, `internal/middleware/`, `internal/repository/`, `internal/service/`, `pkg/i18n/`
- **Finding**: **0 unit tests** (`*_test.go`) and **0 integration tests** exist in the backend repository.
- **Required Test Additions**:
  1. `internal/service/auth_service_test.go`: Verify Telegram initData HMAC verification, valid hashes, tampered initData, missing bot token errors, and `auth_date` expiration.
  2. `internal/service/matchmaking_service_test.go`: Test swipe logic, mutual match creation, bot notification triggers, self-swipe rejection.
  3. `internal/repository/*_test.go`: Test GORM DB operations against SQLite in-memory instance (`file::memory:?cache=shared`).
  4. `internal/handler/*_test.go`: Test Gin HTTP request/response handling with `httptest.NewRecorder()`.

### 4.2 Frontend Test Coverage: 0%
- **Files Inspected**: `frontend/package.json`, `frontend/src/`
- **Finding**: No testing dependencies (Vitest, Jest, React Testing Library) configured in `package.json`. Zero test files (`*.test.tsx`, `*.spec.ts`) present.
- **Required Test Additions**:
  1. Install `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`.
  2. Create test suites for `api.ts` service methods, `types.ts`, and core component interactions.

---

## 5. Prioritized Actionable Recommendations

### Priority 1 (Critical / Security Blocker)
1. **Harden Telegram HMAC Validation**:
   - Enforce mandatory HMAC signature check regardless of `TELEGRAM_BOT_TOKEN` presence.
   - Reject any `initData` missing `hash` or `user` parameters when running in production.
   - Validate `auth_date` to prevent replay attacks (fail if older than 24 hours).
   - Use `hmac.Equal` for timing-safe signature comparison.
   - Fail application startup if `TELEGRAM_BOT_TOKEN` is empty.

### Priority 2 (High / Architecture & Reliability)
2. **Implement API Input & Network Protections**:
   - Restrict CORS origins (`AllowAllOrigins = false`, restrict to `ALLOWED_ORIGINS`).
   - Add Rate Limiting middleware (e.g., 60 req/min per User/IP).
   - Add Zod / Validator enum & length constraints (`oneof`, `max=1000`) on request DTOs.
   - Cap maximum `limit` parameter on `/api/recommendations` (e.g. max 50).

### Priority 3 (Verification & Test Quality)
3. **Build Comprehensive Test Suites**:
   - Write Go unit tests for `AuthService`, `MatchmakingService`, `ProfileService`, and repository layer.
   - Set up Vitest in frontend to verify API client serialization and state logic.
