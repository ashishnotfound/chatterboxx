import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.chatterbox.app',
  appName: 'Chatter Box',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#1a0a2e",
      showSpinner: true,
      spinnerStyle: "large",
      spinnerColor: "#ffffff"
    }
  }
};

export default config;
