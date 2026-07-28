# Ìlú Àṣẹ - Mobile App Setup with Capacitor

This document outlines the setup and configuration of the Ìlú Àṣẹ mobile app using Capacitor to wrap the existing React web application.

## Overview

The Ìlú Àṣẹ mobile app is built using Capacitor to wrap the existing React web application, enabling native features like push notifications and camera access while maintaining the same codebase for web and mobile.

## Features Implemented

### 1. Push Notifications
- Integrated with the existing backend DeviceToken system
- Uses Capacitor's PushNotifications plugin on native platforms
- Falls back to web FCM for browser environments
- Properly registers device tokens with the backend via `/notifications/register-device-token`

### 2. Camera Access
- Native camera functionality using Capacitor's Camera plugin
- Gallery selection capability
- QR code scanning using Capacitor's BarcodeScanner plugin
- Conditional logic to use native features only on mobile platforms

### 3. Platform Detection
- Uses `Capacitor.isNativePlatform()` to determine runtime environment
- Web functionality preserved for browser/PWA usage
- Native plugins only activated on iOS/Android

## Installation & Setup

### Prerequisites
- Node.js and npm
- Android Studio for Android development
- Xcode for iOS development (requires macOS)

### Setup Steps

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install @capacitor/core @capacitor/cli @capacitor/push-notifications @capacitor/camera @capacitor/device @capacitor/barcode-scanner
   ```

2. **Initialize Capacitor**
   ```bash
   npx cap init "Ìlú Àṣẹ" "com.ilease.app" --web-dir=dist
   ```

3. **Add Platforms**
   ```bash
   npx cap add android
   # iOS requires macOS with Xcode:
   # npx cap add ios
   ```

4. **Build and Sync**
   ```bash
   npm run build
   npx cap sync
   ```

## Key Configuration Files

### capacitor.config.ts
Located at `frontend/capacitor.config.ts`, configured with:
- `appId`: com.ilease.app
- `appName`: Ìlú Àṣẹ
- `webDir`: dist
- PushNotifications plugin with alert, sound, and badge permissions
- BarcodeScanner plugin with common formats

### Push Notifications Integration
Modified `frontend/src/lib/firebase-messaging.ts` to:
- Conditionally use Capacitor's PushNotifications plugin on native platforms
- Maintain existing web FCM functionality for browsers
- Properly register device tokens with the backend

### Camera Utilities
Created `frontend/src/utils/camera-utils.ts` with:
- `takePhoto()` - Capture photos using native camera
- `selectPhotoFromGallery()` - Select from device gallery
- `scanQRCode()` - Scan QR codes using native camera
- `checkCameraPermission()` - Verify camera permissions

### Avatar Upload Enhancement
Updated `frontend/src/components/AvatarUploadStep.tsx` to:
- Use native camera functionality when running on mobile
- Fall back to file input on web
- Maintain existing cropping and upload workflow

## Platform-Specific Behavior

### Native Platforms (iOS/Android)
- Push notifications handled by native Capacitor plugins
- Camera access through native APIs
- QR code scanning via native camera
- Proper permission handling

### Web/Browser
- Traditional web technologies maintained
- FCM service worker for push notifications
- Standard file inputs for image uploads
- Progressive Web App (PWA) capabilities

## Development Workflow

### Local Development
1. Make changes to the React application in `frontend/src/`
2. Build the application: `npm run build`
3. Sync with Capacitor: `npx cap sync`
4. Open in native IDE:
   - Android: `npx cap open android` (in Android Studio)
   - iOS: `npx cap open ios` (in Xcode)

### Testing Push Notifications
- Backend endpoint `/notifications/register-device-token` receives tokens from both web and native
- DeviceToken table in database tracks all registered tokens
- Use backend admin panel to send test notifications

### Testing Camera Features
- Use the avatar upload feature to test camera functionality
- Camera permissions are automatically requested
- Gallery selection works alongside camera capture

## Security Considerations

- Camera permissions are properly requested and handled
- Push notification tokens are securely transmitted to backend
- All native plugin usage is behind platform detection checks
- Web fallback maintains existing security practices

## Troubleshooting

### Common Issues
- **"No such file or directory"**: Ensure you're in the frontend directory when running Capacitor commands
- **Push token doesn't arrive**: Verify FCM credentials in backend environment variables
- **Camera permissions denied**: Check platform-specific permission configurations in AndroidManifest.xml or Info.plist

### Platform Verification
Always use `Capacitor.isNativePlatform()` to check the runtime environment before accessing native features.

## Future Enhancements

- App icon and splash screen generation using `@capacitor/assets`
- App Store/Play Store signing and distribution
- Deep linking support with `@capacitor/app` and `@capacitor/deeplink`
- Additional native plugins as needed for enhanced mobile experience

## Maintaining Web Compatibility

The existing web application (`iluase.com`) remains completely intact and functional. The Capacitor wrapper does not modify any web-specific functionality, ensuring both versions can be maintained from the same codebase.