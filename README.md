# Kaskad — Client app (mobile + desktop)

Kaskad is a publisher-only app store: it lists **our own** applications and lets users **download** their installers (APK, EXE, MSI, DMG, PKG, AppImage, DEB, RPM).
The app **never installs anything automatically**: users download the file, can verify its SHA-256 fingerprint, and install it manually by following the built-in help.

- **Mobile:** Android and iOS (Expo).
- **Desktop:** Windows, macOS and Linux (the same code base, wrapped in Electron).

## Features

- Catalog with featured / new / popular apps, categories and search
- Compatible formats shown first for the current device
- App pages in the app's language (French or English, when the developer translated them), beta versions for invited testers,
- App pages with the developer's name, screenshots, versions, changelogs and SHA-256 fingerprints; developer pages listing all their apps
- Downloads with progress, pause / resume, history and integrity check
- "My apps": track installed apps and get notified about new versions
- Ratings and reviews: rate apps from 1 to 5 stars and write a review (email account), read the developer's replies, report abusive reviews
- Report an app to the Kaskad moderation team (malware, abusive content…), no account needed
- Share an app: its public web page opens the app in Kaskad when Kaskad is installed (`kaskad://app/<id>` links)
- Optional account (email with a public name, or anonymous), favorites
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

Leave `EXPO_PUBLIC_API_URL` empty in `.env` to use the built-in **demo data**.

## Connecting to the backend

Start `kaskad-backend` (see its README), then set `EXPO_PUBLIC_API_URL` in `.env` and restart Metro with `yarn start:clear`:

| Device | `EXPO_PUBLIC_API_URL` |
|---|---|
| Web, Electron, iOS simulator | `http://localhost:8000` |
| Android emulator | `http://10.0.2.2:8000` |
| Physical phone (same Wi-Fi) | `http://<your computer's LAN IP>:8000` |

Set the backend's `PUBLIC_BASE_URL` to the same address, so download and image links work on the device. For the desktop build, the URL is embedded when running `yarn desktop:start` / `yarn desktop:dist`.

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

**Electron version:** pinned to 43.x (`~43.7.5`), the most recent line that still runs on **macOS 12 Monterey** (Electron 44 requires macOS 13). Supported desktop systems: macOS 12+, Windows 10+, recent Linux distributions. Keep 43.x updated for security fixes (`yarn upgrade electron` in `desktop/`); move to 44+ only when macOS 12 support can be dropped.

The desktop app registers itself as the handler of `kaskad://` links (at runtime, and in the installers through electron-builder `protocols`): opening `kaskad://app/<id>` from a browser or an email shows that app in Kaskad, whether Kaskad is already running or not.

## Building

Continuous integration (GitHub Actions): translation check (`yarn check:i18n`) and web export on every push.

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
