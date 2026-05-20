# 🔮 HastRekha / JindagikiRekha — Palm Reading App
### Complete Architecture & Context Guide

> **Purpose**: This document is the single source of truth for understanding the codebase. It is written so that any LLM or new developer can immediately understand the project's structure, data flow, and deployment.

---

## 1. Project Identity

| Field | Value |
|---|---|
| **App Name** | JindagikiRekha (Expo display name) / HastRekha (internal brand) |
| **Concept** | AI-powered Indian palmistry app — users photograph their palm and receive Vedic astrology readings in 23 Indian languages |
| **Target** | Mobile (iOS + Android) via Expo/React Native |
| **GitHub Repo** | `Anirudh4444/palm_reader` · branch `hastrekha` |
| **Hosted On** | Replit (originally); deployable anywhere |

---

## 2. High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         MONOREPO ROOT                            │
│                    (pnpm workspaces)                             │
│                                                                  │
│  artifacts/mobile        ←── Expo React Native App              │
│  artifacts/api-server    ←── Express.js REST API (port 8080)    │
│  lib/db                  ←── Drizzle ORM + PostgreSQL schema    │
│  lib/api-spec            ←── Shared API type specs              │
│  lib/api-zod             ←── Zod validators                     │
│  lib/api-client-react    ←── React Query API client hooks       │
│  lib/integrations*       ←── OpenAI integration helpers         │
│  scripts/                ←── Build/deploy scripts               │
└──────────────────────────────────────────────────────────────────┘
```

### Communication Flow

```
Mobile App (React Native)
        │
        │  HTTPS REST calls
        ▼
API Server (Express.js :8080)
        │
        ├─── OpenAI GPT-4o (vision + chat)  ──→ Palm Analysis / Chat / Horoscope
        │
        └─── PostgreSQL (via Drizzle ORM) ───→ users + readings tables
```

---

## 3. Mobile App (`artifacts/mobile`)

### 3.1 Tech Stack
- **Framework**: Expo SDK ~54, React Native 0.81.5
- **Navigation**: `expo-router` (file-based routing, like Next.js)
- **State Management**: React Context API (4 global contexts)
- **Data Fetching**: `@tanstack/react-query`
- **Font**: Inter (Google Fonts via `@expo-google-fonts/inter`)
- **Language**: TypeScript 5.9

### 3.2 Screen / Route Structure

```
app/
├── _layout.tsx              ← ROOT LAYOUT
│     Providers stacked: SafeArea → ErrorBoundary → QueryClient
│                         → Gesture → Language → Auth → Readings → Credits
│     Registers all stack screens
│
├── index.tsx                ← WELCOME / LANDING SCREEN
│     Entry point; routes unauthenticated users to login
│
├── scan.tsx                 ← PALM SCAN SCREEN
│     - Camera / gallery image picker
│     - Gender-based hand recommendation (male→right, female→left)
│     - Sends base64 image to POST /api/palm/analyze
│     - Shows loading while AI processes
│
├── payment.tsx              ← UPI PAYMENT SCREEN
│     - Shows PhonePe / Google Pay / Paytm deep links
│     - Test mode: simulated 1.8s delay → addCredits(20)
│     - Real mode: UPI deep-link intent
│
├── (auth)/                  ← AUTH SCREENS (modal presentation)
│   ├── login.tsx            ← Email + password login
│   └── signup.tsx           ← Name, DOB, gender, language picker + register
│
├── (tabs)/                  ← BOTTOM TAB NAVIGATOR
│   ├── _layout.tsx          ← Tab bar configuration
│   ├── index.tsx            ← HOME tab
│   ├── readings.tsx         ← READINGS HISTORY tab
│   └── profile.tsx          ← PROFILE + language switcher tab
│
├── reading/
│   └── [id].tsx             ← READING DETAIL VIEW
│         - Shows full palm analysis for a single reading
│         - Has "Chat with Krishna" button
│
└── chat/
    └── [readingId].tsx      ← KRISHNA AI CHAT
          - Contextual chat about the palm reading
          - Shows credit badge; blocks if no credits
          - "Buy Credits" routes to payment.tsx
```

### 3.3 Design System

| Token | Value | Usage |
|---|---|---|
| Background | `#0A0415` | Deep indigo, all screens |
| Gold Primary | `#E8B840` | Highlights, buttons |
| Gold Dark | `#C9902A` | Pressed states |
| Purple Accent | `#7B3FDB` | Icons, accents |
| UI Style | Dark mystical | All screens dark mode |

---

## 4. Global State — Context Providers

All 4 providers wrap the entire app in `_layout.tsx`. Order matters (outer → inner):

```
LanguageProvider → AuthProvider → ReadingsProvider → CreditProvider
```

### 4.1 `LanguageContext`
- **File**: `context/LanguageContext.tsx` (62KB — largest file)
- **Purpose**: i18n for 23 Indian languages
- **Languages**: EN, HI, TE (full translations) + 20 others (fall back to EN)
- **How it works**:
  - `useLanguage()` hook returns `{ language, setLanguage, t }` where `t(key)` returns translated string
  - Language code (e.g. `"hi"`) is stored in AsyncStorage
  - Language is passed to API calls so AI responds in that language

### 4.2 `AuthContext`
- **File**: `context/AuthContext.tsx`
- **State**: `user: User | null`, `isLoading: boolean`
- **User type**: `{ id, name, email, dob?, gender? }`
- **Session**: Persisted in AsyncStorage key `"user"`
- **API calls**:
  - `login()` → `POST /api/auth/login`
  - `signup()` → `POST /api/auth/register`
  - `logout()` → clears AsyncStorage, navigates to `/`
  - `updateProfile()` → `PATCH /api/auth/profile`
- **API Base URL**: `EXPO_PUBLIC_DOMAIN` env var → `https://{domain}/api`

### 4.3 `ReadingsContext`
- **File**: `context/ReadingsContext.tsx`
- **State**: `readings: PalmReading[]`, `isLoading: boolean`
- **PalmReading type** (full structure):
  ```typescript
  {
    id: string;           // UUID
    userId: string;       // links to auth user
    imageUri: string;     // local URI of palm photo
    hand: 'left' | 'right';
    dob?: string;         // date of birth
    language?: string;    // language code at time of reading
    createdAt: string;    // ISO timestamp
    analysis: {
      overview, lifeLine, heartLine, headLine,
      fateLine, sunLine, mountVenus, personality,
      career, love, health, spiritual,
      vedicInsight, mythologyInsight,
      luckyNumbers, luckyColors, favorableTime
    }
  }
  ```
- **Migration**: On first load, migrates any local AsyncStorage readings to the server DB
- **CRUD**: `addReading`, `updateReading`, `deleteReading`, `getReadingById`, `refreshReadings`

### 4.4 `CreditContext`
- **File**: `context/CreditContext.tsx`
- **State**: `credits: number`, `freeRepliesLeft: number`
- **Logic**:
  - New users get **1 free reply** (`FREE_REPLIES_INITIAL = 1`)
  - After free reply is used: each message costs **2 credits**
  - Payment adds **20 credits**
  - `canSendMessage()` = `freeRepliesLeft > 0 || credits >= 2`
  - `consumeReply()` deducts free reply first, then credits
  - `totalRepliesLeft` = freeRepliesLeft + floor(credits / 2)
- **Storage**: AsyncStorage keys `hastrekha_credits` and `hastrekha_free_replies`

---

## 5. API Server (`artifacts/api-server`)

### 5.1 Tech Stack
- **Framework**: Express.js
- **Language**: TypeScript
- **Port**: 8080
- **Body limit**: 50mb (for base64 palm images)
- **Database**: PostgreSQL via Drizzle ORM (from `@workspace/db`)
- **AI**: OpenAI SDK (gpt-4o)

### 5.2 All API Endpoints

#### Auth (`/api/auth`)
| Method | Path | Body | Response | Description |
|---|---|---|---|---|
| POST | `/api/auth/register` | `{name, email, password, dob?, gender?}` | `{user}` | Create account |
| POST | `/api/auth/login` | `{email, password}` | `{user}` | Login |
| PATCH | `/api/auth/profile` | `{userId, name?, dob?, gender?}` | `{user}` | Update profile |

#### Palm AI (`/api/palm`)
| Method | Path | Body | Response | Description |
|---|---|---|---|---|
| POST | `/api/palm/analyze` | `{image (base64), hand, dob, name, language}` | Analysis JSON | AI palm reading via GPT-4o vision |
| POST | `/api/palm/chat` | `{messages[], readingContext, language}` | `{reply}` | Krishna AI chat |
| POST | `/api/palm/translate-reading` | `{analysis, language}` | `{analysis}` | Translate reading to target language |

#### Readings (`/api/readings`)
| Method | Path | Query/Body | Response | Description |
|---|---|---|---|---|
| GET | `/api/readings` | `?userId=` | `{readings[]}` | List all readings |
| POST | `/api/readings` | Full PalmReading object | `{reading}` | Save new reading |
| PATCH | `/api/readings/:id` | `{userId, analysis?, language?}` | `{reading}` | Update reading |
| DELETE | `/api/readings/:id` | `?userId=` | `{success}` | Delete reading |

#### Horoscope (`/api/horoscope`)
| Method | Path | Body | Response | Description |
|---|---|---|---|---|
| POST | `/api/horoscope/daily` | `{name, dob, gender, language, palmSummary?, date?}` | `{horoscope}` | Daily Vedic horoscope |

#### Health
| Method | Path | Response |
|---|---|---|
| GET | `/api/health` | `{status: "ok"}` |

### 5.3 AI Prompt Strategy

**Palm Analysis** (`POST /api/palm/analyze`):
- System: Expert in Hasta Samudrikam (Indian palmistry), Vedic astrology, Hindu mythology
- Analyzes 7 mounts, 5 major lines, personality, career, love, health, spiritual insights
- Returns structured JSON with 15 fields
- Language injection: adds `CRITICAL: Write ALL text values in {language}` to system prompt
- Model: `gpt-4o` with `detail: 'high'` vision

**Krishna Chat** (`POST /api/palm/chat`):
- Persona: Lord Krishna as a wise guide discussing the user's palm reading
- Context-aware: receives full reading context
- Language-aware: responds in user's selected language

**Daily Horoscope** (`POST /api/horoscope/daily`):
- Computes Vedic Rashi (moon sign) and Nakshatra from DOB
- Optional: incorporates palm reading summary for personalization
- Returns 12-field JSON with scores (1–10) for love/career/health/overall

---

## 6. Database Schema (`lib/db`)

Uses **Drizzle ORM** with **PostgreSQL**.

### `users` table
| Column | Type | Notes |
|---|---|---|
| id | text | Generated: `Date.now() + random` |
| name | text | User's display name |
| email | text | Unique, lowercase |
| passwordHash | text | djb2 hash (not bcrypt — simple hash) |
| dob | text | Date of birth string |
| gender | text | `"male"` / `"female"` / etc. |

### `readings` table
| Column | Type | Notes |
|---|---|---|
| id | text | UUID from client |
| userId | text | FK → users.id |
| imageUri | text | Local URI (not stored server-side image) |
| hand | text | `"left"` or `"right"` |
| dob | text | Nullable |
| language | text | Language code at time of reading |
| analysis | jsonb | Full 15-field analysis object |
| createdAt | timestamp | Auto-set |

---

## 7. UPI Payment System

| Payment Method | Deep Link Scheme | UPI ID |
|---|---|---|
| PhonePe | `phonepe://` | `9938283488@ybl` |
| Google Pay | `tez://` | `9938283488@okicici` |
| Paytm | `paytmmp://` | `9938283488@paytm` |

- **Test Mode** (currently active): 1.8s simulated delay → `addCredits(20)` → success screen
- **Production**: Remove the test mode button; UPI deep links open actual payment apps

---

## 8. Push Notifications

- **Library**: `expo-notifications`
- **Trigger**: Daily at 7 AM (user-toggled in profile)
- **Content**: "Your daily horoscope is ready"
- **Handler**: Set in `_layout.tsx` with sound + banner

---

## 9. Environment Variables

| Variable | Where Used | Purpose |
|---|---|---|
| `EXPO_PUBLIC_DOMAIN` | Mobile app | Constructs API URL: `https://{domain}/api` |
| `EXPO_PUBLIC_API_URL` | ReadingsContext | Base URL for readings API |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | API server | OpenAI API base URL |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | API server | OpenAI API key |

---

## 10. Key Libraries & Packages

### Mobile
| Package | Purpose |
|---|---|
| `expo-router ~6` | File-based navigation |
| `expo-image-picker` | Camera + gallery access |
| `expo-notifications` | Push notifications |
| `expo-linear-gradient` | Gradient backgrounds |
| `expo-blur` | Glass/blur effects |
| `@tanstack/react-query` | Server state management |
| `react-native-gesture-handler` | Swipe/gesture interactions |
| `react-native-reanimated` | Smooth animations |
| `@expo-google-fonts/inter` | Inter font family |

### API Server
| Package | Purpose |
|---|---|
| `express` | HTTP server |
| `openai` | GPT-4o vision + chat |
| `drizzle-orm` | Type-safe database ORM |

---

## 11. Data Flow — Palm Analysis (End to End)

```
1. User opens scan.tsx
2. Picks palm photo via expo-image-picker
3. App converts image to base64
4. POST /api/palm/analyze  { image, hand, dob, name, language }
5. API server sends to GPT-4o vision with Indian palmistry system prompt
6. GPT-4o returns JSON with 15 analysis fields
7. API server parses & returns JSON
8. Mobile app receives analysis
9. ReadingsContext.addReading() saves reading:
   - Optimistically updates local state
   - POST /api/readings to persist in PostgreSQL
10. Navigation: router.push('/reading/{id}')
11. Reading detail screen renders all 15 analysis fields
12. User can tap "Chat with Krishna" → chat/[readingId].tsx
```

---

## 12. Data Flow — Language Translation

```
1. User changes language in profile.tsx
2. LanguageContext.setLanguage(newLang) called
3. For each existing reading (ReadingsContext):
   - POST /api/palm/translate-reading { analysis, language }
   - GPT-4o translates all 15 text fields to new language
   - ReadingsContext.updateReading() saves translated version
4. All UI strings switch via t(key) from LanguageContext
```

---

## 13. Monorepo Commands

```bash
# Install dependencies
pnpm install

# Run mobile app (Expo dev server)
pnpm --filter @workspace/mobile run dev

# Run API server
pnpm --filter @workspace/api-server run dev

# Type check mobile
pnpm --filter @workspace/mobile run typecheck
```

---

## 14. 🚀 How to Deploy with Expo Go

> **Expo Go** is the fastest way to test the app on a real device without building a binary. The backend must be running and accessible from the internet.

### Step 1 — Prerequisites

```bash
# Install Node.js 18+ and pnpm
npm install -g pnpm

# Install Expo CLI globally
npm install -g expo-cli @expo/ngrok

# Install Expo Go on your phone (iOS App Store / Google Play)
```

### Step 2 — Set Up the Backend

You need the Express API running and publicly accessible.

#### Option A: Deploy API to Railway / Render / Fly.io (Recommended for production)

1. Deploy `artifacts/api-server` as a Node.js service
2. Set environment variables:
   ```
   AI_INTEGRATIONS_OPENAI_BASE_URL=https://api.openai.com/v1
   AI_INTEGRATIONS_OPENAI_API_KEY=sk-your-key-here
   DATABASE_URL=postgresql://...your-postgres-url...
   ```
3. Note the deployed URL (e.g. `https://palm-api.railway.app`)

#### Option B: Local Tunnel (for development testing)

```bash
# Start API locally
pnpm --filter @workspace/api-server run dev

# In another terminal, expose it
npx ngrok http 8080
# Note the https URL (e.g. https://abc123.ngrok.io)
```

### Step 3 — Configure Mobile App

Set the `EXPO_PUBLIC_DOMAIN` to point to your backend:

```bash
# In artifacts/mobile/.env (create if not exists)
EXPO_PUBLIC_DOMAIN=palm-api.railway.app
# OR if using ngrok:
EXPO_PUBLIC_DOMAIN=abc123.ngrok.io
```

> ⚠️ Do NOT include `https://` or `/api` in `EXPO_PUBLIC_DOMAIN`. The app constructs the full URL as `https://{EXPO_PUBLIC_DOMAIN}/api`.

### Step 4 — Start the Expo Dev Server

```bash
cd artifacts/mobile

# Option 1: Standard LAN (phone and PC on same WiFi)
pnpm exec expo start

# Option 2: Tunnel mode (phone anywhere in the world)
pnpm exec expo start --tunnel
```

### Step 5 — Open in Expo Go

1. Open **Expo Go** on your phone
2. **Android**: Scan the QR code shown in terminal
3. **iOS**: Open camera app and scan the QR code
4. The app will bundle and launch on your device

### Step 6 — Verify It Works

| Check | What to do |
|---|---|
| App loads | Welcome screen appears |
| Auth works | Sign up with name/email/password |
| Palm scan | Tap scan, pick a palm photo, wait for AI reading |
| Reading detail | Tap a reading to see all 15 analysis fields |
| Language switch | Go to Profile → change language → readings should translate |
| Horoscope | Navigate to Horoscope tab (requires DOB in profile) |
| Krishna Chat | Open a reading → Chat with Krishna (uses 1 free reply) |

---

## 15. Building for Production (EAS Build)

For distributing via App Store / Play Store, use EAS:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to your Expo account
eas login

# Configure (one-time)
eas build:configure

# Build for Android APK (for testing)
cd artifacts/mobile
eas build --platform android --profile preview

# Build for iOS Simulator
eas build --platform ios --profile development

# Build production bundle
eas build --platform all --profile production
```

The `eas.json` in `artifacts/mobile` already has build profiles configured.

> ⚠️ For production builds, disable UPI test mode in `payment.tsx`. Remove the "Test Payment" button before submitting to stores.

---

## 16. Known Issues / Notes for LLMs

| Issue | Details |
|---|---|
| **Password hashing** | Uses simple djb2 hash, NOT bcrypt. Not production-safe for sensitive apps. |
| **No JWT/sessions** | Auth is stateless — user object stored in AsyncStorage. No server-side session. |
| **Image not stored server-side** | Only the `imageUri` (local device path) is stored. Images are NOT uploaded to any server. |
| **Test mode active** | UPI payment test mode is still enabled. Remove before production. |
| **EAS projectId placeholder** | `app.json` has `projectId: "hastrekha-palm-reading"` — replace with real Expo project ID. |
| **Credits local-only** | Credits in `CreditContext` are stored in AsyncStorage, not in the DB. Clearing app data resets credits. |
| **Language fallback** | Only EN, HI, TE have full translations. All other 20 languages fall back to English UI strings (only AI output is in the requested language). |
