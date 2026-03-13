import { Capacitor } from '@capacitor/core';

/**
 * Capacitor utility functions for production deployment
 */

export const isCapacitorNative = () => {
  return Capacitor.isNativePlatform();
};

export const isAndroid = () => {
  return Capacitor.getPlatform() === 'android';
};

export const isIOS = () => {
  return Capacitor.getPlatform() === 'ios';
};

export const isWeb = () => {
  return Capacitor.getPlatform() === 'web';
};

/**
 * Get platform-specific safe area insets
 */
export const getSafeAreaInsets = () => {
  if (isCapacitorNative()) {
    return {
      top: 'env(safe-area-inset-top)',
      bottom: 'env(safe-area-inset-bottom)',
      left: 'env(safe-area-inset-left)',
      right: 'env(safe-area-inset-right)',
    };
  }
  
  return {
    top: '0px',
    bottom: '0px',
    left: '0px',
    right: '0px',
  };
};

/**
 * Handle Android back button safely
 */
export const handleBackButton = (callback: () => boolean) => {
  if (isCapacitorNative()) {
    // Add back button listener logic here if needed
    return true;
  }
  return false;
};

/**
 * Get device info for debugging
 */
export const getDeviceInfo = () => {
  return {
    platform: Capacitor.getPlatform(),
    isNative: Capacitor.isNativePlatform(),
    isPluginAvailable: Capacitor.isPluginAvailable,
  };
};
