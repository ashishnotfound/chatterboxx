import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

interface BackButtonOptions {
  /**
   * Custom handler for back button press
   * Return true to prevent default behavior
   */
  onBackPress?: () => boolean | Promise<boolean>;
  
  /**
   * Enable/disable back button handling
   * @default true
   */
  enabled?: boolean;
}

/**
 * Hook for handling Android back button with proper navigation behavior
 * Matches WhatsApp/Instagram back navigation behavior
 */
export function useBackButton(options: BackButtonOptions = {}) {
  const { onBackPress, enabled = true } = options;
  const navigate = useNavigate();
  const location = useLocation();
  const historyRef = useRef<string[]>([location.pathname]);

  // Track navigation history
  useEffect(() => {
    historyRef.current.push(location.pathname);
    
    // Keep only last 50 entries to prevent memory issues
    if (historyRef.current.length > 50) {
      historyRef.current = historyRef.current.slice(-50);
    }
  }, [location.pathname]);

  useEffect(() => {
    // Only handle back button on native platforms
    if (!enabled || Capacitor.getPlatform() === 'web') {
      return;
    }

    const handleBackButton = async () => {
      // Check if there's a custom handler
      if (onBackPress) {
        const handled = await onBackPress();
        if (handled) {
          return; // Custom handler prevented default behavior
        }
      }

      const currentPath = location.pathname;
      const history = historyRef.current;
      
      // Remove current path from history to get previous
      const currentIndex = history.lastIndexOf(currentPath);
      const previousPath = currentIndex > 0 ? history[currentIndex - 1] : null;

      // Check if there are any modals or overlays open
      const modals = document.querySelectorAll('[data-modal="true"], [role="dialog"]');
      const overlays = document.querySelectorAll('[data-overlay="true"]');
      
      // Close modals/overlays first
      if (modals.length > 0 || overlays.length > 0) {
        // Try to close the topmost modal/overlay
        const topmost = modals[modals.length - 1] || overlays[overlays.length - 1];
        const closeButton = topmost.querySelector('[data-close="true"], button[aria-label="Close"]');
        
        if (closeButton) {
          (closeButton as HTMLElement).click();
          return;
        }
        
        // Fallback: dispatch escape key event
        const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
        document.dispatchEvent(escapeEvent);
        return;
      }

      // Check if we're on the home/root screen
      const isRootScreen = currentPath === '/' || currentPath === '/home';
      
      if (isRootScreen && history.length <= 2) {
        // On home screen with no history - exit app
        // Show confirmation dialog first (Android standard)
        if (confirm('Exit Divine Chat?')) {
          App.exitApp();
        }
        return;
      }

      // Navigate to previous screen if available
      if (previousPath && previousPath !== currentPath) {
        navigate(-1);
        return;
      }

      // If no previous path, go to home
      if (!isRootScreen) {
        navigate('/');
        return;
      }

      // Fallback: exit app
      if (confirm('Exit Divine Chat?')) {
        App.exitApp();
      }
    };

    // Add back button listener
    const backButtonListener = App.addListener('backButton', handleBackButton);

    return () => {
      // Clean up listener
      backButtonListener.then(listener => listener.remove());
    };
  }, [enabled, onBackPress, navigate, location.pathname]);

  // Utility function to check if app can go back
  const canGoBack = () => {
    const currentPath = location.pathname;
    const history = historyRef.current;
    const currentIndex = history.lastIndexOf(currentPath);
    const previousPath = currentIndex > 0 ? history[currentIndex - 1] : null;
    
    return previousPath !== null && previousPath !== currentPath;
  };

  // Utility function to get previous path
  const getPreviousPath = () => {
    const currentPath = location.pathname;
    const history = historyRef.current;
    const currentIndex = history.lastIndexOf(currentPath);
    return currentIndex > 0 ? history[currentIndex - 1] : null;
  };

  return {
    canGoBack,
    getPreviousPath,
  };
}
