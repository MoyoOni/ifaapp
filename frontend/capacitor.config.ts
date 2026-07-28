import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ilease.app',
  appName: 'Ìlú Àṣẹ',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    // For local dev (live reload on device):
    // url: 'http://192.168.1.xxx:5173', // your local IP
    // cleartext: true,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    BarcodeScanner: {
      formats: ['QR_CODE', 'CODE_128', 'CODE_39', 'EAN_13', 'UPC_A'],
    },
  },
};

export default config;