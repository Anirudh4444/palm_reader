# HastRekha - Palm Reading App

An Expo React Native mobile app for palm reading based on Indian mythology and Vedic astrology.

## Architecture

### Monorepo Structure
- `artifacts/mobile` — Expo React Native mobile app (slug: `mobile`)
- `artifacts/api-server` — Express.js backend API server (port 8080)

### Key Features
1. **Authentication** — Server-side auth via Express API; users stored in PostgreSQL (`users` table via Drizzle ORM); email uniqueness enforced; passwords hashed; session cached in AsyncStorage; persists across all deployments
2. **Multi-language** — 23 languages via `LanguageContext`; full modal picker on signup AND login; language stored per-reading; AI analysis responds in selected language; auto-translates stored readings when language changes
3. **Palm Analysis** — AI-powered via OpenAI `gpt-4o` vision model (supports image inputs); deep Indian palmistry/Vedic astrology prompting; localized by language; `language` field stored on each reading
4. **Hand Suggestion** — Gender-based Vedic hand recommendation on scan screen (male→right, female→left)
5. **Readings History** — Stored in PostgreSQL `readings` table (JSONB for analysis); served via `/api/readings`; auto-migrates local AsyncStorage readings to DB on first load; persists across all devices and deploys
6. **Krishna AI Chat** — Context-aware conversations about palm reading; credit-gated; replies in user language
7. **Credit System** — 1 free reply on signup, then 2 credits/reply; 20 credits via payment (₹49)
8. **UPI Payment** — PhonePe (`9938283488@ybl`), Google Pay (`9938283488@okicici`), Paytm (`9938283488@paytm`) + test mode
9. **Daily Horoscope** — New tab with personalized Vedic horoscope (Rashi, Nakshatra, love/career/health/spiritual scores); uses DOB + palm reading data; cached per day in AsyncStorage; daily push notification at 7 AM (expo-notifications, user-toggled); free for all users
10. **Dark Mystical UI** — Deep indigo/gold/purple palette; all strings fully translated in EN/HI/TE

### Design System (`artifacts/mobile/constants/colors.ts`)
- Background: `#0A0415` (deep indigo)
- Gold: `#E8B840` / `#C9902A`
- Purple/Accent: `#7B3FDB`

### Mobile App Structure
```
artifacts/mobile/
  app/
    index.tsx              — Welcome/landing screen
    _layout.tsx            — Root layout with providers (Language→Auth→Readings→Credits)
    scan.tsx               — Palm photo capture & analysis + hand suggestion
    payment.tsx            — UPI payment screen (PhonePe/GPay/Paytm + test mode)
    (auth)/
      login.tsx            — Login screen
      signup.tsx           — Signup with DOB, gender + 23-language picker modal
    (tabs)/
      _layout.tsx          — Tab bar layout
      index.tsx            — Home tab
      readings.tsx         — Readings history tab
      profile.tsx          — Profile with language switcher tab
    reading/
      [id].tsx             — Reading detail view
    chat/
      [readingId].tsx      — Krishna AI chat with credit badge + buy credits flow
  context/
    AuthContext.tsx        — User auth state
    LanguageContext.tsx    — i18n for 23 languages (EN/HI/TE full, others inherit English)
    ReadingsContext.tsx    — Palm readings storage
    CreditContext.tsx      — Credit system: free replies + 2 credits/reply logic
  constants/
    colors.ts              — Design system colors
```

### API Server
- `POST /api/palm/analyze` — Accepts `{ image (base64), hand, dob, name, language }`, calls OpenAI vision model, returns palm reading JSON
- `POST /api/palm/chat` — Accepts `{ messages, readingContext, language }`, returns Krishna AI reply in selected language
- `POST /api/palm/translate-reading` — Accepts `{ analysis, language }`, translates all palm reading text fields to target language using GPT-4o
- `GET  /api/readings?userId=` — List all readings for a user
- `POST /api/readings` — Save a new reading (full object)
- `PATCH /api/readings/:id` — Update analysis/language fields of a reading
- `DELETE /api/readings/:id?userId=` — Delete a reading
- `POST /api/horoscope/daily` — Generate personalized Vedic daily horoscope (uses DOB, name, gender, language, optional palmSummary)
- Uses Replit-provided OpenAI integration (env vars: `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY`)
- Body limit: 50mb for base64 images

### Credit System Logic
- `FREE_REPLIES_KEY` in AsyncStorage — 1 free reply given on signup
- `CREDITS_KEY` in AsyncStorage — add via payment (20 credits = 10 replies)
- `canSendMessage()` = freeRepliesLeft > 0 || credits >= 2
- `consumeReply()` — uses free reply first, then deducts 2 credits
- Payment adds 20 credits via `addCredits(20)`

### Language System
- 23 languages with flag + native name + English name
- All keys have English fallback; Hindi (hi) + Telugu (te) have full translations
- Selected language passed to API → system prompt instructs response in that language
- Language modal on signup; also changeable in profile settings

### UPI Payment (Test Mode Active)
- Real UPI: `phonepe://`, `tez://`, `paytmmp://` deep links with UPI params
- Test mode: 1.8s simulated delay → adds 20 credits → success screen
- Remove test mode button before production

### Environment Variables
- `EXPO_PUBLIC_DOMAIN` — Used by mobile app to construct API URL
- `AI_INTEGRATIONS_OPENAI_BASE_URL` — OpenAI API base URL (from Replit integration)
- `AI_INTEGRATIONS_OPENAI_API_KEY` — OpenAI API key (from Replit integration)

## Development

Both workflows run via pnpm:
- Mobile: `pnpm --filter @workspace/mobile run dev`
- API: `pnpm --filter @workspace/api-server run dev`

## GitHub
- Repo: Anirudh4444/palm_reader, branch: `hastrekha`
- Last push: 4e77474df4 — all features e2e verified
