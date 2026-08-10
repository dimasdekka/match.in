# Original User Request

## Initial Request — 2026-08-10T04:53:11Z

Refactor the Match.in / Ketemu.in codebase into strict Go Clean Architecture (Handler -> Service -> Repository) and conduct a comprehensive security audit for production deployment.

Working directory: c:\Users\Unicodes\Documents\Developments\Project\Telegram-Multi-Couple

## Requirements

### R1. Go Clean Architecture Refactoring
Refactor all backend layers in backend/ to strictly comply with Clean Architecture (Handler -> Service -> Repository). Ensure strict Context propagation across all layers, context-aware error wrapping, parameterized queries, and zero global mutable state.

### R2. Comprehensive Security Audit & Hardening
Audit and harden security across the entire stack:
- Telegram Authentication: Validate HMAC-SHA256 signatures for initData with bot token.
- Data Protection & Sanitization: Ensure parameterized SQL queries (GORM/raw SQL) to prevent SQL injection, validate inputs at boundary with Zod/validator.
- Network & Access Controls: Validate CORS headers, rate limiting, and environment variable secrets handling.

### R3. Verification & Verification Tests
Ensure all existing REST API endpoints (/api/me, /api/profile/me, /api/recommendations, /api/swipe, /api/matches), Telegram Bot slash commands (/start, /search, /profile, /matches, /reset, /help), and Mini App features build cleanly and pass automated unit/integration tests.

## Acceptance Criteria

### Security & Architecture
- Zero SQL injection or unvalidated input vulnerabilities at API boundaries
- Strict Context propagation (ctx context.Context) across all Repository and Service method signatures
- Proper error wrapping (fmt.Errorf("...: %w", err)) without swallowed errors (_ = err)

### Functionality & Verification
- go build ./... compiles cleanly with zero errors
- npm run build in frontend/ compiles cleanly with zero TypeScript errors
- All API endpoints respond with correct status codes and JSON contracts
