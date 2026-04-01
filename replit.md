# HastRekha - Palm Reading App

An Expo React Native mobile app for palm reading based on Indian mythology and Vedic astrology.

## Architecture

### Monorepo Structure
- `artifacts/mobile` — Expo React Native mobile app (slug: `mobile`)
- `artifacts/api-server` — Express.js backend API server (port 8080)

### Key Features
1. **Authentication** — Local AsyncStorage-based signup/login/logout; stores users array in AsyncStorage
2. **Multi-language** — English, Hindi (हिंदी), Telugu (తెలుగు) via `LanguageContext`; persisted in AsyncStorage
3. **Palm Analysis** — AI-powered via OpenAI GPT-5.2 vision model; deep Indian palmistry/Vedic astrology prompting
4. **Readings History** — Stored per-user in AsyncStorage (`readings_{userId}`)
5. **Dark Mystical UI** — Deep indigo/gold/purple palette

### Design System (`artifacts/mobile/constants/colors.ts`)
- Background: `#0A0415` (deep indigo)
- Gold: `#E8B840` / `#C9902A`
- Purple/Accent: `#7B3FDB`

### Mobile App Structure
```
artifacts/mobile/
  app/
    index.tsx              — Welcome/landing screen
    _layout.tsx            — Root layout with providers
    scan.tsx               — Palm photo capture & analysis screen
    (auth)/
      login.tsx            — Login screen
      signup.tsx           — Signup screen with DOB & gender
    (tabs)/
      _layout.tsx          — Tab bar layout (NativeTabs on iOS 26+, classic otherwise)
      index.tsx            — Home tab
      readings.tsx         — Readings history tab
      profile.tsx          — Profile with language switcher tab
    reading/
      [id].tsx             — Reading detail view
  context/
    AuthContext.tsx        — User auth state
    LanguageContext.tsx    — i18n translations (EN/HI/TE)
    ReadingsContext.tsx    — Palm readings storage
  constants/
    colors.ts              — Design system colors
```

### API Server
- `POST /api/palm/analyze` — Accepts `{ image (base64), hand, dob, name, language }`, calls OpenAI vision model, returns palm reading JSON
- Uses Replit-provided OpenAI integration (env vars: `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY`)
- Body limit: 50mb for base64 images

### Environment Variables
- `EXPO_PUBLIC_DOMAIN` — Used by mobile app to construct API URL
- `AI_INTEGRATIONS_OPENAI_BASE_URL` — OpenAI API base URL (from Replit integration)
- `AI_INTEGRATIONS_OPENAI_API_KEY` — OpenAI API key (from Replit integration)

## Development

Both workflows run via pnpm:
- API server: `pnpm --filter @workspace/api-server run dev`
- Mobile: `pnpm --filter @workspace/mobile run dev`
