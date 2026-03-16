import type { CapacitorConfig } from '@capacitor/cli';

const isLocalDev = process.env.CAPACITOR_LOCAL === 'true';

const config: CapacitorConfig = {
  appId: 'com.fixtray.app',
  appName: 'FixTray',
  // webDir is required by Capacitor but unused when server.url is set.
  // It must point to an existing folder — capacitor-fallback contains a
  // minimal offline splash that shows while the remote app loads.
  webDir: 'capacitor-fallback',
  server: isLocalDev
    ? {
        // For local dev: point to your dev machine's IP
        // Run: CAPACITOR_LOCAL=true npx cap copy android
        url: 'http://10.0.2.2:3000/auth/login',
        cleartext: true,
      }
    : {
        // Production: load the live site
        url: 'https://fixtray.app/auth/login',
        cleartext: false,
      },
  android: {
    allowMixedContent: false,
    overrideUserAgent: 'FixTray-Android-App',
  },
  ios: {
    contentInset: 'automatic',
    overrideUserAgent: 'FixTray-iOS-App',
  },
  plugins: {
    StatusBar: {
      style: 'dark',
      backgroundColor: '#020608',
      overlaysWebView: false,
    },
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: '#020608',
    },
  },
};

export default config;
