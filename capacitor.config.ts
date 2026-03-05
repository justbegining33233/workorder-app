import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fixtray.app',
  appName: 'FixTray',
  webDir: 'out',
  // Load straight to login — skip the marketing landing page
  server: {
    url: 'https://fixtray.app/auth/login',
    cleartext: false, // HTTPS only
  },
  android: {
    allowMixedContent: false,
  },
  ios: {
    contentInset: 'automatic',
  },
  plugins: {
    StatusBar: {
      style: 'dark',         // dark background = light icons in status bar
      backgroundColor: '#020608',
      overlaysWebView: false, // keep status bar OUT of the web content area
    },
  },
};

export default config;
