import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fixtray.app',
  appName: 'FixTray',
  webDir: 'out',
  // Load straight to login — skip the marketing landing page
  server: {
    url: 'https://fixtray.app/login',
    cleartext: false, // HTTPS only
  },
  android: {
    allowMixedContent: false,
  },
  ios: {
    contentInset: 'automatic',
  },
};

export default config;
