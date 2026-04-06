# Momentum

Momentum is a Android fitness application for people who want to plan workouts, run guided sessions, and see progress in one place. It is built as a production-oriented Expo app with a custom development client, backed by Firebase for authentication and user data. The interface emphasises a dark, minimal aesthetic with teal accents and clear hierarchy across training, analytics, and account management.


---

## Audience

The app targets users who train on their own schedule: they can browse exercises with visual references, assemble routines by day, start a timed session with sets and rest periods, and review history alongside simple body metrics. Account creation is email-based; profile details, workouts, and media preferences stay tied to the signed-in user in the cloud.

---

## Technical overview

| Area | Choice |
|------|--------|
| Runtime | Expo SDK 52, React Native 0.76, React 18 |
| Navigation | Expo Router entry with React Navigation (native stack + bottom tabs) |
| Backend | Firebase (Authentication, Firestore, Storage) via the modular JS SDK |
| Styling | React Native `StyleSheet` with a shared theme (`src/theme/colors.js` and related modules); NativeWind / Tailwind are present in devDependencies for optional utility styling |
| Media | Exercise GIFs and images under `assets/`; optional audio for timers / feedback where used |
| Notifications | `expo-notifications` for local scheduling and push token registration (Android FCM requires `google-services.json` and native Gradle setup as in Expo’s push documentation) |

The repository includes generated **Android** native sources (`android/`). iOS may be generated or maintained similarly depending on your workflow. **New Architecture** is enabled in app configuration (`newArchEnabled`).

---

## Application structure

### Authentication and onboarding

Users sign in or sign up with email and password. After registration, profile setup captures name, contact, and body metrics where applicable. The main app shell is only reachable once the user is authenticated; navigation resets appropriately on logout or account deletion.

### Main tabs

- **Today** — Home-style workout hub: daily highlights, workout of the day, category browsing, and entry points into logging or featured content.
- **Train** — Start or resume training: access to **Routines** (saved weekly templates), **Session** for a live workout flow, repetition of the last session where supported, and related tools.
- **Progress** — Aggregated activity and metrics over time (sessions, activities, and weight entries where implemented).
- **Profile** — Editable profile (including optional profile photo stored in Firebase Storage), vitals, shortcuts to notifications, BMI calculator, metrics history, recent activity preview, and account controls (logout, delete account in edit mode).

### Stack screens 

Beyond the tab bar, a native stack provides modal-style flows: live **Session** with exercise picker and completion, **Exercise** and **Category** browsers, **Workout of the Day**, **Activity monitoring** (full history with actions such as delete where supported), **Metrics** and **Calculation** (BMI), **Plans** (list, setup, detail), **Routine** list and **Routine editor**, **Log workout**, **Notifications** settings, **Profile setup**, and **Login** / **Signup**.

Navigation is declared in `app/(tabs)/index.tsx`, which composes the tab navigator and stack screens around the shared `Firebase/config` auth instance.

### Data model 

Firestore data is organised per user under `users/{uid}`:

- Profile fields and metadata on the user document.
- Subcollections such as **activities**, **sessions**, **metrics**, **routines**, and **workoutPlans**, as used by the training and progress features.

Security rules in the repository (`firestore.rules`, `storage.rules`) restrict reads and writes to the owning user. Deploy rules with the Firebase CLI or console when you change them.

Client-side helpers (for example `src/utils/sessionFirestoreWrite.js`) coordinate writing completed sessions and queuing when offline where implemented.

---

## Notable features in the current codebase

- **Routines** — Create and edit named routines with days of the week and exercise lists, then use them from Train.
- **Session flow** — Guided workout session with exercise selection, sets, timing, and persistence to Firestore.
- **Exercise catalogue** — Large `exercise_data.json` and GIF assets under `assets/gifs/` for discovery and demonstration.
- **Profile photo** — Picked via `expo-image-picker`, uploaded to Storage under a per-user path; Firestore stores a download URL.
- **Notifications** — User-configurable workout and hydration reminders (local scheduling); push depends on platform credentials and FCM setup on Android.
- **Account deletion** — Available from profile edit mode: removes known user subcollections, profile document, optional Storage avatar, local notification preferences, and the Firebase Auth user (subject to Firebase “recent login” requirements).

---

## Repository layout 

```
app/                 Expo Router entry and navigation shell
Firebase/            Firebase web SDK initialisation (auth, Firestore, storage)
src/screens/         Screen components
src/components/      Shared UI (e.g. back button, error boundary)
src/theme/           Colours, auth styles, constants
src/utils/           Catalog, GIF URLs, session writes, streaks, etc.
src/notifications/   Push registration and local notification helpers
assets/              Images, fonts, audio, exercise GIFs
android/             Native Android project (Gradle, manifests, google-services.json when configured)
```

---

## Prerequisites

- **Node.js** (LTS recommended) and **npm**
- An **Expo** account for EAS builds and project ownership as referenced in `app.json`
- For local **Android** builds: Android Studio or SDK, `ANDROID_HOME`, and `android/local.properties` with `sdk.dir` if you run `expo run:android` or Gradle directly
- **Firebase** project with Authentication (email/password), Firestore, and Storage enabled; download client config only through the Firebase console (never commit server keys or service account secrets intended for CI in public repos)

---

## Installation and local development

Clone the repository, install dependencies, and start the bundler:

```bash
git clone https://github.com/batthgurnoor/Momentum.git
cd Momentum
npm install
npx expo start
```

Use **`npx expo start --dev-client`** when you are running a **development build** you installed on a device or emulator (required for native modules that are not included in Expo Go).

Web preview (where supported):

```bash
npx expo start --web
```

Tests use Jest with the Expo preset:

```bash
npm test
```

---

## Development and production builds (EAS)

Install and log in to EAS:

```bash
npm install -g eas-cli
eas login
```

Configure the project if prompted:

```bash
eas build:configure
```

Typical Android development client build:

```bash
eas build --platform android --profile development
```

iOS development builds require Apple developer credentials. After installing a dev client on a device, connect it to your machine’s dev server with `npx expo start --dev-client` as described in the Expo documentation.

If Gradle or autolinking errors appear on clean CI builds, try **`eas build ... --clear-cache`** and ensure `android/` matches your current Expo SDK (regenerate with `npx expo prebuild --clean` when necessary, then re-apply any manual native changes such as Firebase Gradle entries).

---

## Configuration notes

- **`app.json`** — Expo application identifier, icons, splash, Android package name, plugins (`expo-router`, `expo-font`, `expo-notifications`, `expo-image-picker`), and optional `android.googleServicesFile` pointing at your `google-services.json` for FCM-related setup.
- **`eas.json`** — EAS build profiles (development, preview, production, etc.).
- **`firebase.json`** — Firebase CLI targets for Firestore rules and Storage rules in this repo.

Replace placeholder repository URLs in this README if you fork or move the project.

---

## Roadmap and limitations

Features such as community challenges or social sharing are not implemented in the current tree; they remain reasonable extensions on top of the existing auth and Firestore model. Push delivery on Android depends on correct FCM credentials and native configuration—see [Expo’s FCM credentials guide](https://docs.expo.dev/push-notifications/fcm-credentials/) for the authoritative steps.

---

## License

This project is licensed under the **0BSD** license (see `package.json`). Third-party dependencies carry their own licenses.

---

## Contributing

Contributions are welcome. Please use focused pull requests with clear descriptions of behaviour changes and any impacts on Firebase rules or native projects. If you introduce a formal contributing guide, you may link it here in place of this paragraph.
