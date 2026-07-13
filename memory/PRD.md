# BabyFace AI — PRD (in-progress)

## Overview
Expo/React Native app (French locale) that generates a photorealistic image of a couple's future baby using Gemini Nano Banana via `emergentintegrations`. Users get 3 free credits, then a stub "buy credits" flow.

## Backend (FastAPI + Motor + MongoDB)
- `POST /api/users`, `GET/PUT /api/users/{id}` — create/read/update user
- `POST /api/generations` — create a baby generation (decrements credits, calls Gemini)
- `GET /api/generations?user_id=` — list user's generations (chronological)
- `GET /api/generations/{id}` — fetch one
- Adult height uses the mid-parental height formula (no AI).
- Env: `MONGO_URL`, `DB_NAME=babyface_ai`, `EMERGENT_LLM_KEY`, `FREE_CREDITS=3`.

## Frontend (Expo Router)
Screens:
- `/` — Splash (custom logo image)
- `/login` — Google / Apple (simulated). Uses branded wordmark image.
- `/onboarding` — name → age → referral source → done
- `/(tabs)/index` — Home with credits badge + "Commencer" + gender toggle via active tab tap
- `/(tabs)/profile` — avatar, name, past generations 3-col grid
- `/edit-profile` — avatar + name edit
- `/generate` — 4-step homme/femme info+photo → generating → reveal → swipeable Papa/Maman/Bébé cards with confetti + share
- `/generation/[id]` — detail of a past generation (same cards view)

## Design system (2025-08)
- **Typeface:** Instrument Serif (via `@expo-google-fonts/instrument-serif`), applied globally by patching `Text.render` / `TextInput.render` at boot.
- **Buttons:** `LiquidGlassButton` + `LiquidGlassIconButton` components (`src/components/LiquidGlassButton.tsx`).
  - Composed of `BlurView` + vertical color LinearGradient + top specular gloss + rim border + press-scale spring.
  - Variants: `primary` (brand purple), `light`, `dark`, `blue`, `pink`, `success`, `error`, `ghost`.
  - Used everywhere: onboarding CTAs + chips, login providers, edit-profile, generate flow (info CTAs, photo pickers, retake/continue, retry/close, permission sheet), home (credits badge, Commencer, buy sheet), profile (pencil badge, modifier), result cards (share, close, exit), detail screen (retour).
- **Logo:**
  - `assets/images/logo-icon.png` (1024×1024) — splash + icon + adaptive-icon + native splash
  - `assets/images/logo-wordmark.png` (1200×236, transparent-bg) — login screen
- **Native splash** (`app.json`): backgroundColor `#ffffff`, imageWidth 240.
- **Android adaptive icon**: backgroundColor `#987ad6` (brand).

## Known deferrals
- Real Google / Apple auth (currently simulated).
- Real IAP for credit top-ups (currently a toast “arrivent bientôt”).
- Delete / favorite / re-generate on Profile grid.
- English locale.
