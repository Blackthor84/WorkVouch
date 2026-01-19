# PeerCV Mobile v3.0

Mobile-first application built with Expo + React Native.

## 🚀 Setup

### Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (Mac) or Android Studio (for Android)

### Installation

```bash
cd mobile
npm install
```

### Environment Variables

Create `.env` file:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Run

```bash
# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## 📱 Features

- ✅ Splash Screen with auth check
- ✅ Authentication (Login, Register, Industry Selection)
- ✅ User Dashboard with Trust Score
- ✅ Profile Management with Photo Upload
- ✅ Job History
- ✅ Peer References
- ✅ Messages (Real-time)
- ✅ Job Matches with AI Recommendations
- ✅ Employer Mode
- ✅ Push Notifications
- ✅ Offline Support

## 🏗️ Project Structure

```
mobile/
├── app/              # Expo Router screens
│   ├── (auth)/      # Auth screens
│   ├── (tabs)/      # Main user tabs
│   └── (employer)/  # Employer tabs
├── components/      # Reusable components
├── lib/             # Utilities & Supabase client
├── hooks/           # Custom React hooks
└── utils/           # Helper functions
```

## 📦 Key Dependencies

- Expo ~50.0.0
- React Native 0.73.0
- Expo Router (File-based routing)
- Supabase JS Client
- React Native Reanimated
- NativeWind (Tailwind for React Native)

## 🔐 Authentication

Uses Supabase Auth with AsyncStorage for session persistence.

## 📊 Database

All data stored in Supabase PostgreSQL database. Same schema as web version.

## 🎨 Styling

Uses NativeWind (Tailwind CSS for React Native) with the same blue/grey color palette as web.

## 📱 Platform Support

- iOS
- Android
- Web (via Expo Web)

## 🚀 Deployment

### iOS
```bash
expo build:ios
```

### Android
```bash
expo build:android
```

Or use EAS Build:
```bash
eas build --platform ios
eas build --platform android
```
