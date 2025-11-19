# Getting Started - Mobile App 📱

Quick guide to run the mobile version of the Productivity Gamification App on your Mac.

## ✅ Prerequisites

Before you begin, make sure you have:

- **Mac** with macOS (for iOS development)
- **Node.js 20+** installed
- **Xcode** installed (for iOS simulator)
  - Download from Mac App Store
  - Open once to accept license agreement

## 🚀 Step-by-Step Setup

### 1. Install Dependencies

```bash
cd mobile-app
npm install
```

### 2. Configure Backend URL

Edit `mobile-app/src/api/client.ts`:

```typescript
// Find your Mac's IP address first
// Run in terminal: ipconfig getifaddr en0
// Example output: 192.168.1.100

export const API_BASE_URL = __DEV__
  ? 'http://192.168.1.100:5000/api'  // ← Replace with YOUR Mac IP
  : 'https://your-production-api.com/api';
```

### 3. Start the Backend

```bash
# In a new terminal window
cd backend
npm run dev
```

### 4. Start the Mobile App

```bash
# In the mobile-app directory
npx expo start
```

You'll see a QR code and menu like this:

```
› Metro waiting on exp://192.168.1.100:8081
› Scan the QR code above to open the project:
› Press i │ open iOS simulator
› Press a │ open Android emulator
› Press w │ open web
```

### 5. Run on iOS Simulator (Mac)

Press **`i`** or run:

```bash
npx expo start --ios
```

The iOS Simulator will open automatically! 🎉

### 6. Run on Your Physical iPhone/iPad

1. **Install Expo Go** on your device:
   - App Store → Search "Expo Go" → Install

2. **Scan the QR code**:
   - iOS: Open Camera app → Point at QR code
   - The app will open in Expo Go

3. **Make sure you're on the same WiFi** as your Mac

## 🎯 What You Can Do Now

✅ **Login/Register** - Create an account (uses the same backend as web)
✅ **Navigate** - Swipe between tabs (Dashboard, Gamification, Habits, Missions, Analytics)
✅ **Logout** - Top-right icon on Dashboard
✅ **Pull to Refresh** - Drag down on Dashboard

## 📱 Testing the App

### Test Authentication
1. Open app → Register with email/password
2. You'll be logged in automatically
3. Try logging out and back in

### Test Navigation
1. Tap bottom tabs to navigate
2. Smooth native transitions
3. Each tab has placeholder content (coming soon!)

### Test on Multiple Platforms
```bash
# iOS Simulator
npx expo start --ios

# Android Emulator (if installed)
npx expo start --android

# Web (yes, it works on web too!)
npx expo start --web
```

## 🔧 Troubleshooting

### Can't connect to backend

**Problem:** "Network request failed" error

**Solution:**
1. Check backend is running (`npm run dev` in `backend/`)
2. Update IP in `src/api/client.ts` with YOUR Mac's IP
3. Make sure device and Mac are on same WiFi
4. Try `http://YOUR_IP:5000/api` in browser - should see API response

### iOS Simulator won't open

**Problem:** "Unable to boot device" error

**Solution:**
```bash
# Kill and restart simulators
killall Simulator
npx expo start --ios
```

### Metro bundler error

**Problem:** "Metro bundler has encountered an error"

**Solution:**
```bash
# Clear cache and restart
npx expo start --clear
```

### TypeScript errors

**Problem:** Red squiggly lines in IDE

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

## 🎨 Customization

### Change Theme Colors

Edit colors in screen files (e.g., `src/screens/auth/LoginScreen.tsx`):

```typescript
const styles = StyleSheet.create({
  button: {
    backgroundColor: '#6366F1',  // ← Change primary color here
    // ...
  },
});
```

### Add Your Logo

Replace assets:
- `assets/icon.png` - App icon (1024x1024)
- `assets/splash-icon.png` - Splash screen
- `assets/adaptive-icon.png` - Android adaptive icon

## 📊 Next Steps

Now that the app is running:

1. **Explore the code** - Start with `src/screens/auth/LoginScreen.tsx`
2. **Add features** - The placeholders are waiting for you!
3. **Test on device** - Install Expo Go and scan the QR code
4. **Customize** - Change colors, add animations, make it yours

## 🚀 Building for Production

When you're ready to ship:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

## 📚 Resources

- **Expo Docs**: https://docs.expo.dev/
- **React Native Docs**: https://reactnative.dev/
- **React Navigation**: https://reactnavigation.org/
- **Main Project README**: ../README.md
- **Mobile Architecture**: ../MOBILE_ARCHITECTURE.md

## 💡 Tips

- **Hot Reload**: Changes auto-update on save
- **Debug Menu**: Shake device (or Cmd+D on simulator)
- **Console Logs**: Show in terminal where `expo start` is running
- **Network Debugging**: Use React Native Debugger

---

**Ready to build something amazing!** 🚀

Need help? Check the full documentation or open an issue.
