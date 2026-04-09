# Contributing to Momentum

Thanks for your interest in contributing. This guide covers how to set up a **working local environment**, what **credentials and config** you must provide (these are not committed to the repo), and how we prefer changes to be submitted.

For product context, architecture, and build commands, see **[README.md](./README.md)**.

---

## Prerequisites

- **Node.js** (LTS) and **npm**
- **Git**
- **Expo CLI** (via `npx`) and, for device testing with native modules, a **development build** ([Expo dev client](https://docs.expo.dev/develop/development-builds/introduction/))
- **Firebase** project with **Authentication** (email/password), **Firestore**, and **Storage** enabled
- For **Android** native runs or EAS local builds: Android SDK, **`ANDROID_HOME`**, and `android/local.properties` with `sdk.dir=...` when using Gradle directly

---

## Required credentials and configuration

The app will not authenticate, load data, or upload media until the following are filled in on **your machine**. **Do not commit real API keys, `google-services.json` contents, or service accounts** to a public branch; use a private fork or local-only changes.

### 1. Firebase web app config — `Firebase/config.js`

Edit **`Firebase/config.js`** and set `firebaseConfig` with values from the Firebase console:

**Project settings → Your apps → Web app → Firebase SDK snippet (config).**

| Field | Notes |
|--------|--------|
| `apiKey` | Web API key |
| `authDomain` | Usually `your-project-id.firebaseapp.com` |
| `projectId` | GCP / Firebase project ID |
| `storageBucket` | Storage bucket (often `your-project-id.appspot.com`) |
| `messagingSenderId` | From the same config object |
| `appId` | Mobile/web app ID from Firebase |

The repo may ship with **empty strings** as placeholders. Replace them locally so `initializeApp`, Auth, Firestore, and Storage work.

### 2. Android push (FCM) — `google-services.json`

For **push notifications** on Android (and for Gradle to apply the Google Services plugin correctly):

1. In Firebase: **Project settings → Your apps → Android app** (package name must match `app.json` → `expo.android.package`, e.g. `com.batth.gurnoor.momentum`).
2. Download **`google-services.json`**.
3. Place it at **`android/app/google-services.json`** (path expected by **`app.json`** → `android.googleServicesFile` when set).

If you use **`npx expo prebuild`**, ensure `app.json` still points at the correct file path after regeneration.

### 3. Firebase security rules

Deploy rules that match this app’s model (see **`firestore.rules`** and **`storage.rules`** in the repo). Without deployed rules, Firestore/Storage calls may fail with permission errors even when the client config is correct.

Use the Firebase CLI (`firebase deploy --only firestore:rules,storage`) or the Firebase console.

### 4. Optional: EAS / Expo

- **`app.json`** may reference an **`extra.eas.projectId`** for EAS Build. Use your own Expo account and project if you run `eas build`.
- Do not commit **EAS secrets** or **upload keystore passwords** in source; use [EAS credentials](https://docs.expo.dev/app-signing/app-credentials/) and CI secrets.

### 5. Local Android SDK path — `android/local.properties` (local only)

If you run **`expo run:android`** or **`./gradlew`** from `android/`, create **`android/local.properties`** (ignored from team templates in many setups; add to `.gitignore` locally if it isn’t already):

```properties
sdk.dir=/absolute/path/to/Android/sdk
```

---

## Getting started

```bash
git clone <your-fork-or-upstream-url>
cd Momentum
npm install
```

1. Complete **Firebase/config.js** (and **`google-services.json`** if you build Android with FCM).
2. Start Metro:

   ```bash
   npx expo start
   ```

3. For a **dev client** (recommended for this project’s native stack):

   ```bash
   npx expo start --dev-client
   ```

4. Run tests when relevant:

   ```bash
   npm test
   ```

---

## How to contribute

1. **Open an issue first** for large features or ambiguous behaviour so direction is agreed early (optional but helpful).
2. **Branch** from the main development branch with a short, descriptive name (e.g. `fix/session-timer`, `feat/plan-export`).
3. **Keep PRs focused** — one logical change per pull request when possible.
4. **Describe the PR** — what changed, how to test it, and any updates to **Firestore/Storage rules** or **native** (`android/`) files reviewers must apply manually.
5. **Do not** commit filled-in **`Firebase/config.js`** with real keys to shared/public repos; use placeholders or document “configure locally” for reviewers.

### Code style

- Match existing patterns in nearby files (imports, naming, `StyleSheet` / theme usage).
- Avoid unrelated refactors in the same PR as a bugfix or small feature.
- Prefer clear, user-visible copy and accessible labels where you touch UI.

---

## Firebase and native changes

- If you change **data shapes** or **paths** under `users/{uid}`, update **Firestore rules** and any **Storage** paths in **`storage.rules`** in the same PR or document the required deploy step.
- If you add **native dependencies**, run **`npx expo prebuild`** when appropriate and document any **manual** `android/` edits that prebuild would overwrite.

---

## Questions

Open a discussion or issue in the repository, or refer to [Expo](https://docs.expo.dev/) and [Firebase](https://firebase.google.com/docs) documentation for SDK-specific behaviour.

Thank you for helping improve Momentum.
