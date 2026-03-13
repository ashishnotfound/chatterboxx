import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.chatterbox.app',
  appName: 'ChatterBox',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;