# Kaskad — Client app (mobile + desktop)

Kaskad is a publisher-only app store: it lists **our own** applications and lets users **download** their installers (APK, EXE, MSI, DMG, PKG, AppImage, DEB, RPM).
The app **never installs anything automatically**: users download the file, can verify its SHA-256 fingerprint, and install it manually by following the built-in help.

- **Mobile:** Android and iOS (Expo).
- **Desktop:** Windows, macOS and Linux (the same code base, wrapped in Electron).

## Features

- Catalog with featured / new / popular apps, categories and search
- Compatible formats shown first for the current device
- App pages with screenshots, versions, changelogs and SHA-256 fingerprints
- Downloads with progress, pause / resume, history and integrity check
- "My apps": track installed apps and get notified about new versions
- Optional account (email or anonymous), favorites
- Built-in installation help (Android, Windows, macOS, Linux)
- Light / Midnight / Black themes, French and English

## Getting started

Requirements: Node.js 20+, Yarn 1.x, and Expo Go (SDK 54) on your phone or an emulator / simulator.

```bash
yarn install
cp .env.example .env
yarn start:clear
```

Scan the QR code with Expo Go (Android) or the Camera app (iOS), or press `a` / `i` / `w` in the terminal.

Leave `EXPO_PUBLIC_API_URL` empty in `.env` to use the built-in **demo data**. To use the backend, set it to its URL (on a phone, use your computer's LAN IP, not `localhost`) and restart Metro.

## Running the app

```bash
yarn start          # Metro dev server
yarn start:clear    # Metro with a cleared cache
yarn android        # Android emulator / device
yarn ios            # iOS simulator (macOS)
yarn web            # browser
```

Push notifications and the native settings from `app.json` (orientation, permissions) need a development build:

```bash
yarn prebuild
yarn run:android    # or: yarn run:ios
```

## Push notifications (Firebase setup)

Local notifications work out of the box. Push notifications (`expo-notifications`) need Firebase Cloud Messaging and a development build (they don't work in Expo Go).

1. Create a project in the [Firebase console](https://console.firebase.google.com).
2. **Android:** add an Android app with the package name `com.kaskad.store`, download `google-services.json`, put it at the root of `kaskad-mobile/`, and reference it in `app.json`:
   ```json
   "android": { "googleServicesFile": "./google-services.json" }
   ```
3. **iOS:** add an iOS app with the bundle ID `com.kaskad.store`, download `GoogleService-Info.plist`, put it at the root of `kaskad-mobile/`, and reference it in `app.json`:
   ```json
   "ios": { "googleServicesFile": "./GoogleService-Info.plist" }
   ```
   Then upload your APNs auth key (`.p8`, from the Apple Developer account) in *Firebase › Project settings › Cloud Messaging*.
4. **Backend:** in *Project settings › Service accounts*, generate a private key. The backend uses it to send notifications. Never commit this key.
5. Rebuild the native app: `yarn prebuild` then `yarn run:android` / `yarn run:ios`.

## Desktop (Electron)

```bash
yarn desktop:install   # once
yarn desktop:start     # build the web version and launch Electron
```

Development mode with hot reload: run `yarn web` in one terminal, then `yarn desktop:dev` in another.

> From the VS Code terminal, run `unset ELECTRON_RUN_AS_NODE` first, otherwise Electron starts as plain Node.

## Building

```bash
yarn desktop:dist          # installers for the current OS
yarn desktop:dist:win      # Windows (.exe)
yarn desktop:dist:mac      # macOS (.dmg, requires macOS)
yarn desktop:dist:linux    # Linux (.AppImage, .deb)
```

Installers are written to `desktop/release/`. Code signing is not configured yet.
Mobile release builds will use EAS Build (not configured yet).

## Troubleshooting

| Problem | Fix |
|---|---|
| `Unable to resolve "@/…"` or `Failed to create a worklet` | Stop Metro completely and run `yarn start:clear`, then reload the app. |
| Changes to `.env` not applied | Restart Metro with `yarn start:clear`. |
| Electron: `Cannot find module 'electron'` | Run `unset ELECTRON_RUN_AS_NODE`. |
| No push notifications | Not supported in Expo Go: use a development build. |
