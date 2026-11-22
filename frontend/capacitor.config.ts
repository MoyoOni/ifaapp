import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.iluase.app',
  appName: 'Ìlú Àṣẹ',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // For local dev (live reload on device):
    // url: 'http://192.168.1.xxx:5173', // your local IP
    // cleartext: true,
  },
  ios: {
    // Keep the web view below the status bar / Dynamic Island / home indicator.
    // Fixes every sticky/fixed header at once, scrolled or not (12 components use top-0).
    contentInset: 'always',
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;