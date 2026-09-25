# Kaskad client app (mobile + desktop) — Functionalities

Complete list of what the client app does, on Android, iOS and desktop (Windows, macOS, Linux through Electron). This file is updated every time a feature is added or changed.

Kaskad lists apps published on the Kaskad store and lets users **download** their installers (APK, EXE, MSI, DMG, PKG, AppImage, DEB, RPM). **Nothing is ever installed automatically:** users download the file, can verify its SHA-256 fingerprint, and install it themselves with the built-in help.

---

## 1. Platforms

| Platform | Details |
|---|---|
| Android | Expo app; phones and tablets (landscape on tablets) |
| iOS | Expo app; portrait on iPhone, tablets supported |
| Desktop | Same code base wrapped in Electron: Windows (.exe), macOS (.dmg), Linux (.AppImage, .deb); responsive layout up to wide screens |
| Web | Same build, used by the desktop app and for development |

- **Device detection:** the app detects the platform (Android, iOS, Windows, macOS, Linux) and shows compatible files first ("APK files for Android are shown first"); incompatible platforms stay downloadable.
- **Demo mode:** without a backend address (`EXPO_PUBLIC_API_URL` empty), the app runs on built-in demo data (10 apps, 6 categories, 2 developers).

---

## 2. Navigation

- Bottom tab bar in "liquid glass" style (blur, animated indicator): **Home, Search, My apps, Downloads, Profile**.
- Stack screens: app page, all reviews, write a review, report an app, category, developer, favorites, FAQ / help, sign-in, full-screen screenshot viewer.
- Native-feeling transitions (iOS native stack, JS stack on Android / desktop), back gestures, safe areas (notches, navigation bars).
- Scrollbars hidden; pull to refresh on lists.

---

## 3. Home

- Header with logo, help and favorites shortcuts.
- Device banner: the detected platform and the formats shown first.
- **Featured** apps: large cards (1 on phones, up to 4 on wide screens).
- **Categories** chips (order defined by the platform admin).
- **New** and **Popular** horizontal lists with "See all" (opens Search sorted accordingly).
- Texts (short descriptions) in the app's language when the developer translated them.

---

## 4. Search and browsing

- Search by name or keyword (name and descriptions).
- Filters: category, platform ("This device" or a specific platform), sort (popular, recent, name).
- Result count, paginated loading ("load more"), empty state.
- **Category** page: all apps of a category, compatible ones first.
- **Developer** page: the developer account's name, number of apps and all its published apps.

---

## 5. App page

- Icon, name, **developer name** (opens the developer page), short description, **average rating** (stars and number of ratings, updated right after the user rates), platforms, download count, last update.
- Header actions: **share** and favorite.
- **Primary download** card: the best version for the device (platform · format · version · size), download button, state and actions.
- Categories (open the category), favorite button (account required).
- "My apps" panel: mark as installed / installed version / new version available; update notifications switch per app.
- **Screenshots** gallery → full-screen viewer (swipe, zoom, immersive on Android).
- **About**: long description (read more / less).
- **Versions and files**: grouped by version (expand / collapse), publication date, release notes ("What's new"), every file (platform, format, size) with its **SHA-256 fingerprint** (copy) and download button; security note with a link to the integrity help.
- **Beta versions** (only for testers invited by the developer and signed in with that email): "BETA" badge, shown before production versions.
- **Ratings and reviews** section (see section 6).
- **More from the developer**: horizontal list of the developer's other apps, "See all".
- **Report this app** link at the bottom of the page (see section 6).
- **Languages:** name is shared; short description, long description and release notes are shown in the app's language (French / English) when available, otherwise in the listing's main language. The page reloads when the language changes.

---

## 6. Ratings, reviews, reports and sharing

- **Page views:** opening an app page is counted for the developer's statistics (views, conversion, countries); the server ignores repeated views within 30 minutes.
- **Rating summary:** average (1 decimal, localized), stars, number of ratings and the 5 → 1 star distribution.
- **Rate this app:** tapping a star opens the review screen with that rating. An **email account** is required (anonymous or signed-out users get a toast with a "Sign in" / "Add an email" action).
- **Write / edit a review:** 1 to 5 stars with a label (Hated it … Loved it), posted under the **account name** ("Posting as …", with a link to change it — no name field on the review), optional text (2,000 characters, counter), the installed version is attached; one review per account and app, editable at any time; **delete** with confirmation. The rating and review are public.
- **Your review** is shown first on the app page with an edit button.
- **Recent reviews:** the 3 most recent reviews on the app page; **all reviews** screen with sort (most recent, highest, lowest), filter by stars, "load more" pagination, pull to refresh.
- **Developer replies:** shown under the review ("Reply from <developer account>"); the author is notified by email by the backend.
- **Report a review** (flag icon): reason (abusive, misleading / spam, other) → sent to the Kaskad moderation; no account needed.
- **Report an app:** dedicated screen with 6 reasons (malware, abusive content, copyright, misleading, doesn't work, other) with explanations, optional details; sent to the platform admin's moderation, no account needed.
- **Share an app:** native share sheet (Android / iOS), browser share or link copy (web / desktop). The link is the app's **public web page**, which opens the app in Kaskad when installed.
- **Deep links:** `kaskad://app/<id>` opens the app page (Android / iOS through the `kaskad` scheme, desktop through the registered protocol).
- Hidden reviews (moderation) are not shown and don't count in the rating.
- Rows in lists (search, category, favorites…) show the average rating.
- Demo mode: sample reviews and replies, and a working review / report flow in memory.

---

## 7. Downloads

- Download with progress, speed-independent **pause / resume** (resume after an interruption when the platform allows it), cancel, restart.
- Android: files saved to a user-chosen folder (Storage Access Framework, remembered) or the Downloads folder; iOS: Files › On My iPhone › Kaskad; desktop: the system Downloads folder (native download manager through Electron).
- Notifications / toasts when a download starts, finishes or fails.
- **Downloads** tab: in progress and history, per file — location, **verify the SHA-256** against the published fingerprint (match / mismatch), reveal in folder (desktop), share, save to Downloads, remove the file or only the history entry, "mark as installed"; clear history.
- Downloads are counted in the store statistics (a resumed download is counted once).

---

## 8. My apps and updates

- **Installed** apps: marked manually after installing (Kaskad never installs anything); shows installed version and whether an update is available.
- **Followed** apps (not installed): follow to be notified of new versions.
- Update check against the store ("Check now", last check time), automatic at start, when the app comes back to the foreground, and periodically on desktop. The check sends a random device identifier (hashed by the server) so developers see which versions are actually installed; no personal data.
- **Notifications:** per-app switch; push notifications (FCM on Android, APNs on iOS) when a new version is published for a followed app; local notification for updates found. Notifications are **off by default** and enabled from the profile.
- Beta versions never trigger update alerts (except for testers checking the app page).

---

## 9. Account (optional)

- The app works without an account.
- **Anonymous account** (device identifier, no personal data) or **email account** (register with a **name** — required, shown with the user's reviews — / sign in); an anonymous account can be upgraded to email.
- **Account name:** shown on the profile card (with the email) and editable from the profile (pencil) or the review screen; renaming updates all the user's reviews. Older accounts without a name use the part of the email before "@".
- **Favorites** require an account: a toast invites to sign in, with a "Sign in" action; favorites are cleared on sign-out and restored on sign-in.
- **Library sync** across devices: favorites, followed and installed apps are merged on sign-in and synchronized automatically.
- Sign out (the session is revoked, push token removed); **delete the account** and all its data (including its reviews).
- Being signed in with a tester's email unlocks the beta versions of the apps that invited this address.

---

## 10. Profile and settings

- Account section (sign in / anonymous / email, sync status, add an email).
- Library shortcuts: favorites, my apps (installed count), download history.
- Help: how to install an app, verify a file.
- **Preferences:** notifications (with system permission handling), appearance, language, download folder (Android).
- **Themes:** System, Light, Midnight (dark blue), Black (pure black for OLED).
- **Language:** System, French, English — the whole interface, plus app descriptions and release notes when translated; Favorites and My apps refresh their texts when the language changes.
- About: detected device, app version, demo mode indicator.

---

## 11. Help / FAQ

Built-in, per platform, with the section for the current device highlighted:
- How does Kaskad work?
- Installing an APK on Android (allowing unknown sources)
- Windows: SmartScreen warning
- macOS: Gatekeeper warning
- Installing on Linux (AppImage, DEB, RPM commands, copyable)
- Verifying a file's integrity: paste a SHA-256 or compute it from a file, compare with the expected fingerprint (match / mismatch)

---

## 12. Desktop specifics (Electron)

- Serves the app through an internal `kaskad://` protocol; single instance.
- **Registered as the `kaskad://` link handler** (runtime registration + installer `protocols`): `kaskad://app/<id>` (also `developer/<id>`, `category/<id>`) opens the matching page, at launch or in the running window (macOS `open-url`, Windows / Linux command line and second instance), without reloading the app.
- Native downloads (pause, resume, cancel) through the system, "show in folder", file existence checks.
- Periodic update checks (no native push on desktop).
- Installers built with electron-builder for Windows, macOS and Linux (the macOS app declares the `kaskad://` scheme).
- Electron 43 (security-patched line compatible with macOS 12+).

---

## 13. User experience

- Custom dialogs and toasts (no system alerts), consistent across platforms.
- Inter typeface, responsive grid (1 to 4 columns), tablet landscape layouts.
- French and English interface; dates and numbers localized.
- Error and empty states with retry; offline-friendly snapshots for favorites and my apps.
