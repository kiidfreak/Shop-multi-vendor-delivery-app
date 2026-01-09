---
description: Build Android APK
---

# Build Android APK

To build the APK for Android devices, follow these steps using EAS (Expo Application Services).

## Prerequisites

1.  **Install EAS CLI**:
    ```bash
    npm install -g eas-cli
    ```

2.  **Login to Expo**:
    ```bash
    eas login
    ```

3.  **Configure EAS Build**:
    If you haven't already, run this to create `eas.json`:
    ```bash
    eas build:configure
    ```

## Build APK (Preview)

To generate an installable `.apk` file (not for Play Store, but for testing on device):

1.  **Run the build command**:
    ```bash
    eas build -p android --profile preview
    ```

    *Note: Ensure your `eas.json` has a `preview` profile configured with `"buildType": "apk"`.*

    **Example `eas.json` configuration:**
    ```json
    {
      "build": {
        "preview": {
          "android": {
            "buildType": "apk"
          }
        },
        "production": {
          "android": {
            "buildType": "app-bundle"
          }
        }
      }
    }
    ```

2.  **Wait for the build**:
    EAS will upload your project and build it in the cloud. Once finished, it will provide a direct download link for the `.apk` file.

3.  **Install on Device**:
    Download the APK to your Android device and install it.
