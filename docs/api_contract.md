# 📖 Match.in / Ketemu.in — API Contract & Architecture Documentation

> **Version**: 1.1.0  
> **Backend Architecture**: Strict Go Clean Architecture (Handler ➔ Service ➔ Repository)  
> **Security Standards**: Telegram HMAC-SHA256 WebApp Auth, Context Propagation, Parameterized SQL, Token-Bucket Rate Limiting (10 req/s, burst 20).

---

## 🏗️ Architecture Overview

The backend is built following **Clean Architecture principles**:
```
┌─────────────────────────────────────────────────────────────┐
│                 HTTP Transport & Telegram Bot               │
│               (Gin Framework / Webhook Handler)             │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                       Handler Layer                         │
│   (Request validation, context passing, HTTP responses)     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                       Service Layer                         │
│   (Business rules, matchmaking logic, bot notifications)    │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     Repository Layer                        │
│     (GORM / SQLite parameterized data persistence)          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication & Headers

All `/api/*` endpoints (except public `/health` and `/api/bot/webhook`) are protected by **Telegram Mini App Authentication**.

### Required Headers:
```http
Authorization: Bearer <telegram_init_data_raw_string>
# OR
X-Telegram-Init-Data: <telegram_init_data_raw_string>
Content-Type: application/json
```

### Signature Verification Algorithm:
1. Server computes `secret_key = HMAC-SHA256("WebAppData", bot_token)`.
2. Server validates `hash = HMAC-SHA256(secret_key, data_check_string)`.
3. If valid, extracts Telegram User ID and attaches `domain.User` to `gin.Context`.

---

## 🌐 Complete API Endpoints Catalog

### 1. Account & User Management (`/api/me`)

#### `GET /api/me`
Mengambil data akun pengguna yang sedang login.
- **Response `200 OK`**:
```json
{
  "user": {
    "id": 1,
    "telegram_id": 123456789,
    "username": "dimasdekka",
    "first_name": "Dimas",
    "last_name": "Dekka",
    "language_code": "id",
    "is_active": true,
    "created_at": "2026-08-14T08:00:00Z",
    "updated_at": "2026-08-14T08:00:00Z"
  }
}
```

#### `DELETE /api/me`
Menghapus akun pengguna secara permanen beserta seluruh profil, riwayat swipe, match, dan pesan chat.
- **Response `200 OK`**:
```json
{
  "message": "Account and associated data deleted successfully"
}
```

#### `POST /api/me/language`
Memperbarui preferensi bahasa pengguna (`id` atau `en`).
- **Request Body**:
```json
{
  "language_code": "id"
}
```
- **Response `200 OK`**:
```json
{
  "message": "Language updated successfully",
  "language_code": "id"
}
```

---

### 2. Profile & Discover Deck (`/api/profile` & `/api/recommendations`)

#### `GET /api/profile/me`
Mengambil profil lengkap pengguna sendiri.
- **Response `200 OK`**:
```json
{
  "profile": {
    "id": 1,
    "user_id": 1,
    "name": "Dimas",
    "age": 25,
    "birth_date": "2001-05-15",
    "gender": "male",
    "target_gender": "female",
    "bio": "Coffee enthusiast & software developer.",
    "city": "Jakarta",
    "country": "Indonesia",
    "latitude": -6.2088,
    "longitude": 106.8456,
    "target_location_mode": "same_city",
    "min_age_pref": 20,
    "max_age_pref": 30,
    "max_distance_km": 50,
    "relationship_goal": "long_term",
    "dating_intention": "serious",
    "photos": "[\"https://example.com/photo1.jpg\"]",
    "interests": "[\"Coffee\",\"Music\",\"Tech\"]",
    "is_verified": true,
    "is_boosted": false
  }
}
```

#### `POST /api/profile/me`
Membuat atau memperbarui profil dan preferensi pencarian.
- **Request Body**:
```json
{
  "name": "Dimas",
  "age": 25,
  "birth_date": "2001-05-15",
  "gender": "male",
  "target_gender": "female",
  "bio": "Coffee enthusiast & software developer.",
  "city": "Jakarta",
  "country": "Indonesia",
  "latitude": -6.2088,
  "longitude": 106.8456,
  "target_location_mode": "same_city",
  "min_age_pref": 20,
  "max_age_pref": 30,
  "max_distance_km": 50,
  "relationship_goal": "long_term",
  "dating_intention": "serious",
  "photos": ["https://example.com/photo1.jpg"],
  "interests": ["Coffee", "Music", "Tech"]
}
```
- **Response `200 OK`**:
```json
{
  "message": "Profile saved successfully",
  "profile": { ... }
}
```

#### `GET /api/recommendations`
Mengambil tumpukan kandidat Discover Deck berdasarkan filter dan mode feed.
- **Query Parameters**:
  - `limit` (integer, default `20`, max `50`)
  - `feed` (string: `for_you` | `nearby` | `popular` | `new` | `serious`, default `for_you`)
- **Response `200 OK`**:
```json
{
  "profiles": [
    {
      "id": 2,
      "user_id": 2,
      "name": "Naya",
      "age": 24,
      "city": "Jakarta",
      "country": "Indonesia",
      "bio": "Coffee dates, live music, and Sunday walks.",
      "photos": "[\"https://images.unsplash.com/.../photo.jpg\"]",
      "interests": "[\"Coffee\",\"Music\",\"Travel\"]",
      "is_verified": true,
      "is_boosted": false
    }
  ]
}
```

---

### 3. Swipes, Likes & Matches (`/api/swipe`, `/api/matches`, `/api/likes`)

#### `POST /api/swipe`
Merekam aksi swipe pada kandidat. Jika saling like, sistem otomatis membuat match dan mengirim notifikasi Telegram ke kedua pengguna.
- **Request Body**:
```json
{
  "target_id": 2,
  "action": "like" // "like" | "pass" | "superlike"
}
```
- **Response `200 OK`**:
```json
{
  "is_match": true,
  "match_id": 10,
  "matched_user": {
    "id": 2,
    "first_name": "Naya",
    "username": "naya_jkt"
  },
  "matched_profile": {
    "name": "Naya",
    "age": 24,
    "city": "Jakarta",
    "photos": "[\"https://images.unsplash.com/.../photo.jpg\"]"
  }
}
```

#### `GET /api/matches`
Mengambil seluruh daftar mutual match yang aktif.
- **Response `200 OK`**:
```json
{
  "matches": [
    {
      "match_id": 10,
      "matched_user": { "id": 2, "first_name": "Naya", "username": "naya_jkt" },
      "matched_profile": { "id": 2, "user_id": 2, "name": "Naya", "age": 24, "city": "Jakarta", "photos": "..." },
      "matched_at": "2026-08-14T08:10:00Z"
    }
  ]
}
```

#### `GET /api/likes/received`
Mengambil daftar profil pengguna yang menyukai Anda (*Likes You*).
- **Response `200 OK`**:
```json
{
  "profiles": [
    {
      "id": 2,
      "user_id": 2,
      "name": "Naya",
      "age": 24,
      "city": "Jakarta",
      "photos": "[\"https://images.unsplash.com/.../photo.jpg\"]"
    }
  ]
}
```

#### `GET /api/likes/sent`
Mengambil daftar profil yang telah Anda like (*You Liked*).
- **Response `200 OK`**:
```json
{
  "profiles": [
    {
      "id": 3,
      "user_id": 3,
      "name": "Salsa",
      "age": 23,
      "city": "Bandung",
      "photos": "[\"https://images.unsplash.com/.../photo.jpg\"]"
    }
  ]
}
```

#### `DELETE /api/matches/:match_id`
Membatalkan / mengakhiri match dengan pengguna lain (*Unmatch*).
- **Response `200 OK`**:
```json
{
  "message": "Unmatched successfully"
}
```

---

### 4. Real-time Messaging & Media (`/api/chats`)

#### `GET /api/chats`
Mengambil daftar semua percakapan yang sedang aktif beserta pesan terakhir.
- **Response `200 OK`**:
```json
{
  "conversations": [
    {
      "match_id": 10,
      "matched_user": { "id": 2, "first_name": "Naya", "username": "naya_jkt" },
      "matched_profile": { "id": 2, "name": "Naya", "age": 24, "city": "Jakarta", "photos": "..." },
      "last_message": {
        "id": 42,
        "content": "Halo Dimas! Senang kenalan 💕",
        "created_at": "2026-08-14T08:15:00Z"
      },
      "unread_count": 1
    }
  ]
}
```

#### `GET /api/chats/:match_id/messages`
Mengambil seluruh riwayat pesan obrolan pada suatu match.
- **Response `200 OK`**:
```json
{
  "messages": [
    {
      "id": 42,
      "match_id": 10,
      "sender_id": 2,
      "content": "Halo Dimas! Senang kenalan 💕",
      "image_url": "",
      "message_type": "text",
      "reaction": "❤️",
      "is_read": true,
      "created_at": "2026-08-14T08:15:00Z"
    }
  ]
}
```

#### `POST /api/chats/:match_id/messages`
Mengirim pesan baru (Teks, Gambar terkompresi Base64/URL, Voice Note, Sticker, atau GIF).
- **Request Body**:
```json
{
  "content": "Ini foto saat liburan kemarin 📸",
  "image_url": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "message_type": "image" // "text" | "image" | "voice" | "sticker" | "gif"
}
```
- **Response `201 Created`**:
```json
{
  "message": {
    "id": 43,
    "match_id": 10,
    "sender_id": 1,
    "content": "Ini foto saat liburan kemarin 📸",
    "image_url": "data:image/jpeg;base64,...",
    "message_type": "image",
    "reaction": "",
    "is_read": false,
    "created_at": "2026-08-14T08:16:00Z"
  }
}
```

#### `DELETE /api/chats/:match_id/messages`
Menghapus seluruh isi pesan percakapan pada match tersebut (*Clear Chat*).
- **Response `200 OK`**:
```json
{
  "message": "Chat history cleared successfully"
}
```

#### `POST /api/chats/messages/:message_id/react`
Menyematkan emoji reaksi pada balon pesan chat (❤️, 😂, 🔥, 👍).
- **Request Body**:
```json
{
  "reaction": "❤️"
}
```
- **Response `200 OK`**:
```json
{
  "message": "Reaction updated successfully"
}
```

---

### 5. Moderation & Reports (`/api/reports`)

#### `POST /api/reports`
Melaporkan pengguna yang melanggar ketentuan komunitas.
- **Request Body**:
```json
{
  "reported_id": 2,
  "match_id": 10,
  "reason": "Spam / inappropriate behavior"
}
```
- **Response `201 Created`**:
```json
{
  "message": "Report submitted successfully"
}
```

---

### 6. System Health Check (`/health`)

#### `GET /health`
- **Response `200 OK`**:
```json
{
  "status": "ok",
  "app": "Match.in / Ketemu.in Backend"
}
```

---

## 📊 Error Handling Standard

Semua error pada API mengembalikan format JSON standar:
```json
{
  "error": "Detailed human-readable error description"
}
```

| HTTP Code | Arti / Skenario |
|:---|:---|
| `400 Bad Request` | Payload request / validasi parameter tidak valid |
| `401 Unauthorized` | Header `Authorization` / Telegram initData tidak valid atau kedaluwarsa |
| `403 Forbidden` | Pengguna tidak memiliki akses ke resource tersebut |
| `404 Not Found` | Resource yang diminta tidak ditemukan |
| `429 Too Many Requests` | Melebihi batas rate limit (10 req/s, burst 20) |
| `500 Internal Server Error` | Terjadi kegagalan internal pada server |

---

## 🧪 Automated Testing

Jalankan test suite backend Clean Architecture:
```bash
cd backend
go test -v ./...
```
Semua package telah dilengkapi unit & integration test dengan in-memory pure-Go database driver (`github.com/glebarez/sqlite`), tanpa ketergantungan pada CGO atau GCC eksternal.
