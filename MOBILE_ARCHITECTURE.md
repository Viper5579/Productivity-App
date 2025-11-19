# Mobile App Architecture

## Overview

This document outlines the mobile-native version of the Productivity Gamification App. This version runs on iOS and Android devices, optimized for touch interfaces and native mobile performance.

## Branch Strategy

**Two parallel versions:**
- `claude/productivity-gamification-app-setup-*` - **Web version** (React + Vite)
- `mobile-native-app` - **Mobile version** (React Native + Expo) ← **YOU ARE HERE**

Both versions share the same backend API.

## Technology Stack

### Frontend (Mobile)
- **React Native** - Native mobile components
- **Expo** - Development platform for easy Mac/iOS/Android testing
- **React Navigation** - Mobile navigation (stack, tab, drawer)
- **React Native Paper** - Material Design UI components
- **TanStack Query** (React Query) - Data fetching (same as web)
- **Zustand** - State management (same as web)
- **Expo Vector Icons** - Icons for mobile

### Backend (Unchanged)
- **Node.js + Express** - Same API server
- **PostgreSQL** - Same database
- **Redis** - Same cache/queue
- All existing modules work without changes

## Key Differences from Web Version

### Navigation
- **Web:** Browser-based routing (React Router)
- **Mobile:** Stack/Tab navigation (React Navigation)

### UI Components
- **Web:** HTML/CSS (Tailwind)
- **Mobile:** Native components (View, Text, TouchableOpacity)

### Styling
- **Web:** Tailwind CSS
- **Mobile:** StyleSheet API (React Native)

### Platform Features
- **Mobile gets:** Push notifications, Camera, Biometric auth, Haptic feedback
- **Web gets:** Browser extensions, Desktop notifications

## Mobile App Structure

```
mobile-app/                    # New Expo app (replaces frontend/)
├── app/                       # Expo Router (file-based routing)
│   ├── (auth)/               # Auth screens
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/               # Main tab navigation
│   │   ├── dashboard.tsx     # Assignments dashboard
│   │   ├── gamification.tsx  # XP, levels, achievements
│   │   ├── habits.tsx        # Habit tracking
│   │   ├── missions.tsx      # Daily missions
│   │   └── analytics.tsx     # Performance charts
│   └── _layout.tsx           # Root layout
├── components/               # Reusable mobile components
│   ├── AssignmentCard.tsx
│   ├── XpProgressBar.tsx
│   ├── HabitStreak.tsx
│   └── ...
├── hooks/                    # Shared hooks (from web)
│   ├── useAuth.ts
│   ├── useAssignments.ts
│   └── ...
├── services/                 # API client (shared with web)
│   └── api-client.ts
├── app.json                  # Expo config
└── package.json

backend/                       # Backend stays the same!
├── src/
│   ├── modules/
│   │   ├── auth/             # Works for both web & mobile
│   │   ├── canvas/
│   │   ├── gamification/
│   │   ├── habits/
│   │   └── ...
│   └── ...
```

## Mobile-Specific Features

### Phase 1 Enhancements (Mobile)
- **Biometric login** - Face ID / Touch ID
- **Offline mode** - Cache assignments locally
- **Pull to refresh** - Native refresh gesture
- **Swipe actions** - Swipe to complete/delete

### Phase 2 Enhancements (Mobile)
- **Haptic feedback** - Vibration on XP gains
- **Animated confetti** - Native animations for level-ups
- **Home screen widgets** - Show XP/level on home screen

### Phase 3 Enhancements (Mobile)
- **Push notifications** - Habit reminders
- **Calendar integration** - Add missions to native calendar
- **Siri shortcuts** - "Hey Siri, complete my habit"

### Phase 4 Enhancements (Mobile)
- **Interactive charts** - Touch/pinch to zoom
- **Share reports** - Export as image/PDF

### Phase 5 Enhancements (Mobile)
- **Voice input** - "Add assignment via voice"
- **OCR scanning** - Scan syllabus with camera

## Development Workflow

### Running on Mac
```bash
# Install dependencies
cd mobile-app
npm install

# Start Expo development server
npx expo start

# Run on iOS Simulator (Mac only)
npx expo start --ios

# Run on Android Emulator
npx expo start --android

# Run on physical device
# Scan QR code with Expo Go app
```

### Building for Production
```bash
# Build iOS app (requires Mac + Xcode)
eas build --platform ios

# Build Android app
eas build --platform android

# Submit to App Store
eas submit --platform ios

# Submit to Google Play
eas submit --platform android
```

## API Compatibility

The mobile app uses the **same REST API** as the web version:

- `POST /api/auth/login` - Works for both
- `GET /api/assignments` - Works for both
- `POST /api/gamification/complete` - Works for both
- All endpoints are mobile-friendly

**Optional mobile enhancements:**
- Add `User-Agent` detection for analytics
- Add `/api/mobile/push-token` for notifications
- Add `/api/mobile/sync` for offline sync

## Deployment Strategy

### Backend
- Deploy to cloud (Railway, Render, Fly.io)
- Same backend serves both web and mobile

### Web App
- Deploy to Vercel/Netlify
- Accessible at: `https://productivity-app.com`

### Mobile App
- iOS: App Store
- Android: Google Play
- Accessible via: App stores

## Migration Path

1. **Phase 1:** Initialize Expo app with auth ✅
2. **Phase 2:** Migrate all 5 phases to mobile
3. **Phase 3:** Add mobile-specific features
4. **Phase 4:** Test on real devices (iOS + Android)
5. **Phase 5:** Submit to app stores

## Why Expo?

- ✅ **Easy setup** - No Xcode/Android Studio config needed initially
- ✅ **Mac compatible** - Runs perfectly on macOS
- ✅ **Hot reload** - Instant code updates
- ✅ **Native modules** - Access camera, notifications, etc.
- ✅ **OTA updates** - Push updates without app store approval
- ✅ **Expo Go** - Test on real device instantly

## File Sharing Between Web/Mobile

Some code can be shared:

**✅ Can share:**
- API client (`services/api-client.ts`)
- Type definitions (`types/*.ts`)
- Business logic hooks (`useAuth`, etc.)
- Utility functions

**❌ Cannot share:**
- UI components (different rendering)
- Routing (different navigation)
- Styling (different APIs)

## Next Steps

1. Initialize Expo app in `mobile-app/` folder
2. Setup React Navigation with tab navigator
3. Port auth screens (login/register)
4. Port dashboard with native components
5. Add mobile-specific polish (animations, gestures)

---

**Both versions will coexist** - users can access via web OR mobile app!
