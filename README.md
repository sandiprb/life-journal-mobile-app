# Life Journal

A personal journaling app built with Expo (React Native) and Supabase. Track your mood, write journal entries, record life events, and attach photos — all in one place.

## Features

- **Mood tracking** — daily mood check-ins with notes and a 1–5 scale
- **Journal** — rich text entries with date and favourite flagging
- **Life events** — milestone tracker with categories, significance rating, location, and photos
- **Photos** — attach one or multiple photos to life events
- **Google Sign-In** — OAuth via Supabase, no email/password required
- **Persistent sessions** — stays logged in between app launches via SQLite-backed storage

## Tech stack

| Layer | Choice |
|---|---|
| Framework | [Expo](https://expo.dev) (SDK 54) + React Native 0.81 |
| Routing | [Expo Router](https://expo.github.io/router) v6 (file-based) |
| Styling | [NativeWind](https://www.nativewind.dev) (Tailwind CSS for RN) |
| Backend | [Supabase](https://supabase.com) — Auth, Postgres, Storage |
| Data fetching | [TanStack Query](https://tanstack.com/query) v5 |
| Auth | Supabase Google OAuth via `expo-auth-session` + `expo-web-browser` |
| Session storage | `expo-sqlite` (native), `localStorage` (web) |

## Project structure

```
app/
  _layout.tsx              # Root layout — QueryClient + AuthProvider
  (auth)/
    login.tsx              # Google Sign-In screen
  (tabs)/
    index.tsx              # Home / dashboard
    mood.tsx               # Mood check-in
    journal/               # Journal list + entry detail
    events/                # Life events list + event detail (with photos)
  new/
    journal-entry.tsx      # New journal entry modal
    life-event.tsx         # New life event modal (with photo picker)
    mood-checkin.tsx       # New mood check-in modal

components/
  PhotoPicker.tsx          # Upload button for life event photos
  PhotoThumbnail.tsx       # Signed-URL image thumbnail

hooks/
  useMoodEntries.ts
  useJournalEntries.ts
  useLifeEvents.ts
  usePhotos.ts             # usePhotosByLifeEvent, useUploadPhoto, useDeletePhoto

lib/
  supabase.ts              # Supabase client with SQLite session storage
  auth.tsx                 # AuthContext — signInWithGoogle, signOut

types/
  database.ts              # TypeScript types for all DB tables

supabase/
  config.toml              # Local dev + remote auth config (redirect URLs, Google provider)
  migrations/              # SQL migrations
```

## Getting started

### Prerequisites

- Node.js 20+
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (`npm install -g expo-cli`)
- A [Supabase](https://supabase.com) project
- A Google Cloud OAuth 2.0 client (for sign-in)

### 1. Clone and install

```bash
git clone <repo-url>
cd life-journal
npm install
```

### 2. Environment variables

Create a `.env` file at the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Set up Supabase

The project uses the Supabase CLI. If you have it installed and the project linked:

```bash
# Apply database migrations
supabase db push

# Push auth config (redirect URLs, Google provider toggle)
supabase config push
```

### 4. Enable Google Sign-In

**Google Cloud Console:**
1. Create an OAuth 2.0 Client ID (type: **Web application**)
2. Add this authorized redirect URI:
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```
3. Copy the Client ID and Client Secret

**Set credentials in Supabase:**
```bash
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID="your-client-id" \
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET="your-client-secret" \
supabase config push --yes
```

### 5. Run the app

```bash
# iOS simulator
npm run ios

# Android emulator
npm run android

# Web browser
npm run web

# Expo Go (scan QR)
npm start
```

> **Note:** Google Sign-In requires a development build or standalone build — it does not work in Expo Go due to the custom URL scheme redirect.

## Building for device

The project uses [EAS Build](https://docs.expo.dev/build/introduction/) for iOS and Android builds.

```bash
# Install EAS CLI
npm install -g eas-cli
eas login

# Configure (first time only)
eas build:configure

# Development build (installs on device, enables Google OAuth)
eas build --platform ios --profile development

# TestFlight / production
eas build --platform ios --profile production
eas submit --platform ios
```

## Database schema

| Table | Description |
|---|---|
| `mood_entries` | Daily mood check-ins (1–5 scale, note, date) |
| `journal_entries` | Free-text journal entries |
| `life_events` | Milestone events with category, location, significance |
| `photos` | Photos linked to life events, stored in Supabase Storage |

All tables are protected by Supabase Row Level Security — users can only access their own data.

## Auth flow (Google OAuth on native)

```
App → supabase.auth.signInWithOAuth() → returns Google auth URL
  → WebBrowser.openAuthSessionAsync(googleUrl, appScheme)
    → User logs in with Google
    → Google → Supabase callback → redirects to life-journal://
      → OS intercepts redirect, closes browser
        → App extracts access_token + refresh_token from URL fragment
        → supabase.auth.setSession() → session persisted to SQLite
```

## Allowed redirect URLs (configured in Supabase)

| URL | Used for |
|---|---|
| `life-journal://` | Standalone and development builds |
| `exp://localhost:8081` | Expo Go on iOS simulator |
| `exp://127.0.0.1:8081` | Expo Go alternate |

When testing on a physical device with Expo Go, also add your local IP (e.g. `exp://192.168.x.x:8081`) in the Supabase dashboard under **Authentication → URL Configuration → Redirect URLs**.
