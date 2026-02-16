module.exports = {
  appId: "com.example.app",
  appName: "My App",
  webDir: "www",
  bundledWebRuntime: false,
  plugins: {
    // Existing plugin configurations
    BarcodeScanner: {},
    // Insert the plugin configuration for mobile network on Android
    MobileNetwork: { 
      // proper server settings
      server: {
        url: "https://example.com/api",
        timeout: 5000,
      },
      // Add additional settings as needed
    },
  },
  // Mobile network configuration for Android builds
  android: {
    network_security_config: {
      domain_configs: [
        {
          domain: "example.com",
          cleartextTrafficPermitted: false
        },
      ],
    },
  },
};