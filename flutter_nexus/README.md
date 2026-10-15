# NEXUS Mobile — Production Android & iOS Architecture

NEXUS is an AI-powered personal command center mobile application built with **Flutter 3.24+ / Dart 3.2+**, featuring Clean Architecture, Riverpod 2.0 state management, Drift SQLite offline-first persistence, and secure server-side Gemini AI integration.

---

## 🏛 Clean Architecture & Feature Modularization

```text
lib/
├── core/
│   ├── constants/           # Color palettes, typography, UI metrics
│   ├── network/             # Dio client, interceptors, error handling
│   ├── storage/             # Drift SQLite database & table definitions
│   ├── sync/                # Offline mutation queue & sync engine
│   └── theme/               # Dark-first theme with restrained neon accents
├── features/
│   ├── ai/                  # Gemini assistant proxy client & speech models
│   ├── calendar/            # Daily/weekly view, time blocking algorithms
│   ├── analytics/           # Velocity charts, focus telemetry
│   └── tasks/
│       ├── data/            # TaskRepositoryImpl & SQLite DAO
│       ├── domain/          # TaskModel, Subtask, Priority enums
│       └── presentation/    # Riverpod StateNotifier & Screen widgets
└── main.dart                # Edge-to-edge system UI, ProviderScope
```

---

## 📱 Android 15 & 16 (16KB Page-Size Alignment)

In compliance with 2026 Google Play guidelines, all native SQLite `.so` shared libraries are built with 16KB max page-size alignment:

```gradle
// android/app/build.gradle.kts
android {
    compileSdk = 35
    defaultConfig {
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
        ndk {
            abiFilters.addAll(listOf("armeabi-v7a", "arm64-v8a", "x86_64"))
        }
    }
}
```

---

## 🚀 Build & Run Instructions

### Prerequisites
- Flutter SDK $\ge 3.24.0$
- Android Studio Ladybug / Jellyfish with Android SDK 35
- Java 17+

### Run Debug Build
```bash
flutter pub get
flutter run
```

### Build Production Release APK & App Bundle
```bash
# Generate Split APKs per ABI
flutter build apk --release --split-per-abi

# Generate Google Play AAB
flutter build appbundle --release
```

### Execute Unit & Widget Tests
```bash
flutter test
```

---

## 🔒 Security Architecture
- **Never embed Gemini API keys in the mobile binary**.
- Mobile clients communicate strictly with the secure backend (`/api/ai/*`) using bearer tokens.
- Offline mutations are encrypted in SQLite using Drift with native SQLCipher support.
