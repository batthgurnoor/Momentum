# Momentum Fitness App

## Project Overview 

Momentum is a fitness app designed to help users stay motivated, set goals, and track their progress efficiently. The app provides a seamless experience for users to create workout plans, log workouts, monitor activity history, and set fitness goals. With a built-in goal tracker, Momentum ensures users stay consistent with their fitness journey.

## Implemented Features

- Workout Plan Customization – Users can select pre-designed workout plans or create personalized routines.

- Log Workout – Allows users to track the start and end of their workouts.

- Activity Monitoring – Provides users with access to their workout history for performance analysis.

- Fitness Goals – Users can set and track their fitness goals, such as weight loss or muscle gain.

- Update Information – Enables users to update their personal body metrics (e.g., weight, BMI).

- Notifications and Reminders – Sends in-app workout information reminders, such as error, success, and warning messages.

## Unimplemented Features (Future Enhancements)

- Community Challenges – Would allow users to participate in fitness challenges with friends and other users.

- Social Sharing – Would enable users to share fitness achievements on social media.

## Installation & Setup

### Prerequisites

- Node.js & npm installed

- Expo CLI installed globally

- EAS CLI installed globally:
  ```bash
  npm install -g eas-cli
  ```

- An Expo account (create at https://expo.dev/signup)

### Clone the Repository

```bash
git clone git@github.com:batthgurnoor/Momentum.git 
```

### Install Dependencies
```bash
npm install
```

### Run the App in Development Mode
```bash
npx expo start
```

## Creating a Development Build

A development build allows you to test native modules and run the app directly on your device without constantly using Expo Go.

### Prerequisites for Development Build

1. Make sure you have the EAS CLI installed:
   ```bash
   npm install -g eas-cli
   ```

2. Log in to your Expo account:
   ```bash
   eas login
   ```

3. Install the Expo Development Client package if not already installed:
   ```bash
   npx expo install expo-dev-client
   ```

### Android Development Build

1. Configure your project (if not already configured):
   ```bash
   eas build:configure
   ```

2. Build the development client for Android:
   ```bash
   eas build --platform android --profile development
   ```

3. Wait for the build to complete (it will take several minutes)

4. When finished, you'll receive a link to download the APK or install directly via QR code

5. Install the build on your Android device

### iOS Development Build (requires Apple Developer account)

1. Configure your project (if not already configured):
   ```bash
   eas build:configure
   ```

2. Build the development client for iOS:
   ```bash
   eas build --platform ios --profile development
   ```

3. Wait for the build to complete (it will take several minutes)

4. When finished, you'll receive a link to download and install the app on your iOS device

### Running with the Development Build

1. After installing the development build on your device, run:
   ```bash
   npx expo start --dev-client
   ```

2. This will provide a QR code to scan with your device's camera

3. Your development build will open and connect to your development server

4. Now you can make changes to your code and see them reflected in the app after reloading

### Troubleshooting

- If you encounter a permissions error, make sure you're logged in to the same Expo account that owns the project
  ```bash
  eas whoami
  ```

- If your account doesn't match the owner in app.json, either:
  1. Login to the correct account: `eas login`
  2. Update the "owner" field in app.json to match your current account

- If QR code scanning fails, ensure your phone and computer are on the same network

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.