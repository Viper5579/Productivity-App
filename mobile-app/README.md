# Productivity Gamification - Mobile App 📱

Mobile-native version of the Productivity Gamification App built with React Native and Expo.

## 🎯 Features

- **Native Mobile Experience** - Built with React Native for iOS and Android
- **Cross-Platform** - One codebase for both platforms
- **Shared Backend** - Uses the same API as the web version
- **Offline Support** - Coming soon
- **Push Notifications** - Coming soon
- **Biometric Auth** - Coming soon

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Mac (for iOS development)
- Xcode (for iOS simulator)
- Android Studio (for Android emulator) - optional

### Installation

```bash
# Install dependencies
npm install

# Start Expo development server
npx expo start
```

### Running the App

**On iOS Simulator (Mac only):**
```bash
npx expo start --ios
```

**On Android Emulator:**
```bash
npx expo start --android
```

**On Physical Device:**
1. Install Expo Go app on your phone
2. Run `npx expo start`
3. Scan the QR code with your phone

## 📁 Project Structure

```
mobile-app/
├── src/
│   ├── api/           # API client (shared logic with web)
│   │   └── client.ts
│   ├── navigation/    # React Navigation setup
│   │   ├── AppNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   └── MainNavigator.tsx
│   ├── screens/       # Screen components
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── RegisterScreen.tsx
│   │   └── main/
│   │       ├── DashboardScreen.tsx
│   │       ├── GamificationScreen.tsx
│   │       ├── HabitsScreen.tsx
│   │       ├── MissionsScreen.tsx
│   │       └── AnalyticsScreen.tsx
│   ├── components/    # Reusable components
│   ├── hooks/         # Custom hooks
│   │   └── useAuth.ts
│   └── types/         # TypeScript types
├── App.tsx           # App entry point
└── app.json          # Expo configuration
```

## 🔌 Backend Configuration

Update the API URL in `src/api/client.ts`:

```typescript
// For local development on Mac
export const API_BASE_URL = 'http://YOUR_MAC_IP:5000/api';

// For production
export const API_BASE_URL = 'https://your-api.com/api';
```

**Finding your Mac's IP:**
```bash
# On Mac
ipconfig getifaddr en0
```

Then update `src/api/client.ts` with your IP.

## 📱 Testing on Mac

### Using iOS Simulator
```bash
# Start the app
npx expo start --ios

# The iOS simulator will open automatically
```

### Using Android Emulator
```bash
# Start Android emulator first (from Android Studio)
# Then run:
npx expo start --android
```

### Using Physical Device
```bash
# Start Expo
npx expo start

# Scan QR code with:
# - iOS: Camera app
# - Android: Expo Go app
```

## 🏗️ Development Workflow

1. **Make changes** to source files
2. **Hot reload** updates instantly
3. **Test on simulator** or device
4. **Commit changes** to `mobile-native-app` branch

## 📦 Building for Production

### iOS (requires Mac + Apple Developer Account)
```bash
# Install EAS CLI
npm install -g eas-cli

# Configure project
eas build:configure

# Build for iOS
eas build --platform ios

# Submit to App Store
eas submit --platform ios
```

### Android
```bash
# Build for Android
eas build --platform android

# Submit to Google Play
eas submit --platform android
```

## 🔄 Differences from Web Version

| Feature | Web | Mobile |
|---------|-----|--------|
| UI Framework | HTML/CSS | React Native |
| Styling | Tailwind CSS | StyleSheet API |
| Navigation | React Router | React Navigation |
| Storage | localStorage | AsyncStorage |
| Auth | Cookies/Session | Token in AsyncStorage |
| Platform | Browser | iOS/Android |

## 🎨 UI Components

Currently using native components:
- `View` - Container
- `Text` - Text display
- `TouchableOpacity` - Buttons
- `TextInput` - Form inputs
- `ScrollView` - Scrollable content

Future: React Native Paper for Material Design

## 🔐 Authentication

Uses the same JWT-based authentication as web:
1. Login/Register sends credentials to backend
2. Backend returns JWT token
3. Token stored in AsyncStorage
4. Token included in all API requests

## 🚧 Roadmap

- [x] Authentication (Login/Register)
- [x] Navigation structure
- [x] Dashboard scaffold
- [ ] Assignment list with API integration
- [ ] Gamification (XP, levels, achievements)
- [ ] Habits tracking
- [ ] Daily missions
- [ ] Analytics charts
- [ ] Push notifications
- [ ] Offline mode
- [ ] Biometric authentication
- [ ] Canvas LMS integration

## 📖 Documentation

- [Mobile Architecture](../MOBILE_ARCHITECTURE.md)
- [Main README](../README.md)
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)

## 🤝 Contributing

This is the mobile version - the web version is in `frontend/` folder.

Both versions use the same backend in `backend/` folder.

## 📄 License

MIT

---

**Built for smooth mobile productivity** 🚀
