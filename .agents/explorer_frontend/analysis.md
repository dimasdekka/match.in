# [CONFIRMED] Frontend Architecture & Codebase Investigation Report

**Target Path**: `c:\Users\Unicodes\Documents\Developments\Project\Telegram-Multi-Couple\frontend\`  
**Date**: 2026-08-10  
**Investigator**: `teamwork_preview_explorer` (Explorer 2: Frontend Architecture)

---

## 1. Architecture & Setup Overview

### 1.1 Framework & Build Tools
- **Framework**: React 19 (`react` ^19.2.8, `react-dom` ^19.2.8).
- **Bundler & Tooling**: Vite 8 (`vite` ^8.2.0, `@vitejs/plugin-react` ^6.0.4).
- **Type Checker**: TypeScript 6 (`typescript` ~6.0.2) with composite build config (`tsconfig.json` referencing `tsconfig.app.json` & `tsconfig.node.json`).
- **Linter**: Oxlint (`oxlint` ^1.75.0, configuration in `.oxlintrc.json`).
- **Application Type**: Client-Side Single Page Application (SPA), target environment: Telegram Mini App / Mobile Browser.

### 1.2 Routing & State Management
- **Router Setup**: **None**. No routing library (e.g. `react-router`) is installed in `package.json` nor implemented in code.
- **State Management**: **None**. State is restricted to primitive `useState` in `App.tsx` (default Vite starter code). No Zustand, Redux, Context API, or TanStack Query is present.

### 1.3 API Client & Telegram SDK Integration
- **API Client**: Implemented in `src/services/api.ts`. Uses native `fetch` against hardcoded `http://localhost:8080/api`.
- **Telegram Mini App SDK**: Primitive window property extraction:
  ```ts
  const getTelegramInitData = (): string => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.initData) {
      return (window as any).Telegram.WebApp.initData;
    }
    return 'user=%7B%22id%22%3A100000001%2C%22first_name%22%3A%22Alex%22%2C...%7D';
  };
  ```
  No official `@tma.js/sdk` or `@telegram-apps/sdk` installed. No Telegram WebApp UI integration (MainButton, BackButton, HapticFeedback, ThemeParams, Viewport expansion).

---

## 2. Catalog of Pages, Components, Forms, API Calls, and Validation Schemas

### 2.1 Frontend Pages
- **Current Status**: **0 Application Pages Implemented**.
- `App.tsx` contains the default Vite starter template ("Get started", Vite/React logos, counter button, social links). The dating/matchmaking Mini App views (Discover, Matches, Profile, Filters) have not been assembled or connected to `App.tsx`.

### 2.2 Frontend Components
- **`src/components/Header.tsx`**: Header component featuring app title ("Ketemu.in" / "Match.in"), "MINI APP" badge, language switcher button (`toggleLanguage`), and location/age filter modal trigger button (`onOpenFilter`).

### 2.3 Forms & Inputs
- **Current Status**: **0 Form Components Implemented**.
- Form interfaces are declared in `src/types.ts`:
  ```ts
  export interface ProfileFormData {
    name: string;
    age: number;
    gender: Gender;
    target_gender: Gender;
    bio: string;
    voice_bio_url: string;
    country: string;
    city: string;
    target_location_mode: LocationFilterMode;
    min_age_pref: number;
    max_age_pref: number;
    photos: string[];
    interests: string[];
  }
  ```

### 2.4 API Calls (`src/services/api.ts`)
| Method | Endpoint | Description | Request Body | Response Type |
|---|---|---|---|---|
| `getMe()` | `GET /api/me` | Fetch active user session | None | `{ user: User }` |
| `updateLanguage(code)` | `POST /api/me/language` | Update user language setting | `{ language_code: string }` | `{ user: User }` |
| `getMyProfile()` | `GET /api/profile/me` | Fetch current user profile | None | `{ profile: Profile \| null }` |
| `saveProfile(data)` | `POST /api/profile/me` | Create or update user profile | `ProfileFormData` | `{ profile: Profile }` |
| `getRecommendations(limit)` | `GET /api/recommendations?limit=N` | Fetch candidate profiles for swiping | Query param `limit` (default 10) | `{ profiles: Profile[] }` |
| `swipe(targetId, action)` | `POST /api/swipe` | Record swipe action (`like` \| `pass` \| `superlike`) | `{ target_id: number, action: SwipeAction }` | `SwipeResponse` |
| `getMatches()` | `GET /api/matches` | Fetch user's mutual matches | None | `{ matches: MatchDetail[] }` |

All requests include header `'X-Telegram-Init-Data': getTelegramInitData()`.

### 2.5 Validation Schemas
- **Current Status**: **0 Validation Schemas**. No Zod, Yup, or manual schema validation exists.

---

## 3. Issues & Production Readiness Deficiencies

### 3.1 Missing Dependencies breaking `npm run build` [CONFIRMED]
- `Header.tsx` imports `react-i18next` and `lucide-react`.
- `i18n.ts` imports `i18next` and `react-i18next`.
- **Defect**: None of `i18next`, `react-i18next`, or `lucide-react` are listed in `package.json`. Running `tsc -b` or `npm run build` will fail with unresolved module errors.

### 3.2 Main Application Unconnected to Mini App UI [CONFIRMED]
- `src/App.tsx` contains Vite starter placeholder code. `Header.tsx`, `api.ts`, and `i18n.ts` are completely orphaned and unused by the root component.
- Users navigating to the Mini App will only see the default Vite template page.

### 3.3 Hardcoded Backend API Base URL [CONFIRMED]
- `src/services/api.ts` line 3: `const API_BASE_URL = 'http://localhost:8080/api';`.
- **Defect**: Hardcoded `localhost:8080` prevents production deployment on HTTPS/Telegram WebApp tunnels. Must use `import.meta.env.VITE_API_BASE_URL || '/api'`.

### 3.4 Missing Input Boundary Validation [CONFIRMED]
- In accordance with mandatory rules, form data (`ProfileFormData`) and API payload parameters are sent without boundary validation (e.g., Zod schemas).

### 3.5 Lack of Telegram Mini App SDK Integration & Security Fallback [CONFIRMED]
- `getTelegramInitData()` uses a hardcoded fallback string when `window.Telegram.WebApp.initData` is absent.
- Uses unsafe `(window as any).Telegram` casting.
- Lacks Telegram WebApp viewport expansion (`Telegram.WebApp.expand()`), theme color synchronization, and native button controls.

---

## 4. `package.json` Dependencies & Build Strategy

### 4.1 Required Dependency Corrections
To resolve build errors and achieve production readiness, `package.json` must be updated with:
```json
{
  "dependencies": {
    "react": "^19.2.8",
    "react-dom": "^19.2.8",
    "i18next": "^24.2.2",
    "react-i18next": "^15.4.0",
    "lucide-react": "^0.475.0",
    "zod": "^3.24.2"
  }
}
```

### 4.2 Build Script Verification
- Build script in `package.json`: `"build": "tsc -b && vite build"`.
- Requires adding missing packages before `npm run build` can succeed cleanly.
