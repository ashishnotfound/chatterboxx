import { useEffect, useState, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

interface UsageStats {
  currentSession: number; // Current session time in seconds
  totalLifetime: number; // Total lifetime usage in seconds
  sessionStartTime: number | null; // Timestamp when current session started
  lastActiveTime: number | null; // Timestamp when app was last active
}

const STORAGE_KEY = 'divine_chat_usage_stats';

/**
 * Hook for tracking app usage time (local, offline-first)
 * Tracks current session and total lifetime usage
 */
export function useAppUsage() {
  const [usageStats, setUsageStats] = useState<UsageStats>({
    currentSession: 0,
    totalLifetime: 0,
    sessionStartTime: null,
    lastActiveTime: null,
  });
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(true);

  // Load usage stats from localStorage on mount
  useEffect(() => {
    loadUsageStats();
  }, []);

  // Save usage stats to localStorage whenever they change
  useEffect(() => {
    saveUsageStats();
  }, [usageStats]);

  // Handle app state changes (foreground/background)
  useEffect(() => {
    // Only handle app state on native platforms
    if (Capacitor.getPlatform() === 'web') {
      return;
    }

    const handleAppStateChange = (state: { isActive: boolean }) => {
      if (state.isActive && !isActiveRef.current) {
        // App coming to foreground
        handleAppForeground();
      } else if (!state.isActive && isActiveRef.current) {
        // App going to background
        handleAppBackground();
      }
      isActiveRef.current = state.isActive;
    };

    // Add app state listener
    const appStateListener = App.addListener('appStateChange', handleAppStateChange);

    // Also handle visibility change for web
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      if (isVisible && !isActiveRef.current) {
        handleAppForeground();
      } else if (!isVisible && isActiveRef.current) {
        handleAppBackground();
      }
      isActiveRef.current = isVisible;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      appStateListener.then(listener => listener.remove());
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cleanupTimer();
    };
  }, []);

  const loadUsageStats = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setUsageStats(prev => ({
          ...prev,
          ...parsed,
          currentSession: 0, // Reset current session on app start
          sessionStartTime: Date.now(),
        }));
      } else {
        // Initialize with current time as session start
        setUsageStats(prev => ({
          ...prev,
          sessionStartTime: Date.now(),
          lastActiveTime: Date.now(),
        }));
      }
    } catch (error) {
      console.error('Error loading usage stats:', error);
      setUsageStats(prev => ({
        ...prev,
        sessionStartTime: Date.now(),
        lastActiveTime: Date.now(),
      }));
    }
  };

  const saveUsageStats = () => {
    try {
      const toSave = {
        ...usageStats,
        lastActiveTime: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (error) {
      console.error('Error saving usage stats:', error);
    }
  };

  const handleAppForeground = () => {
    console.log('App came to foreground');
    isActiveRef.current = true;
    
    setUsageStats(prev => ({
      ...prev,
      sessionStartTime: Date.now(),
      lastActiveTime: Date.now(),
    }));

    // Start tracking current session
    startTimer();
  };

  const handleAppBackground = () => {
    console.log('App went to background');
    isActiveRef.current = false;
    
    // Add current session time to total lifetime
    setUsageStats(prev => {
      const sessionTime = prev.sessionStartTime ? 
        Math.floor((Date.now() - prev.sessionStartTime) / 1000) : 0;
      
      return {
        ...prev,
        totalLifetime: prev.totalLifetime + sessionTime,
        currentSession: 0,
        sessionStartTime: null,
        lastActiveTime: Date.now(),
      };
    });

    // Stop tracking
    cleanupTimer();
  };

  const startTimer = () => {
    cleanupTimer();
    
    intervalRef.current = setInterval(() => {
      if (isActiveRef.current) {
        setUsageStats(prev => {
          const sessionTime = prev.sessionStartTime ? 
            Math.floor((Date.now() - prev.sessionStartTime) / 1000) : 0;
          
          return {
            ...prev,
            currentSession: sessionTime,
          };
        });
      }
    }, 1000); // Update every second
  };

  const cleanupTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Format seconds to human readable format
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  // Reset usage stats (for testing or user request)
  const resetStats = () => {
    setUsageStats({
      currentSession: 0,
      totalLifetime: 0,
      sessionStartTime: Date.now(),
      lastActiveTime: Date.now(),
    });
  };

  return {
    currentSession: usageStats.currentSession,
    totalLifetime: usageStats.totalLifetime,
    currentSessionFormatted: formatTime(usageStats.currentSession),
    totalLifetimeFormatted: formatTime(usageStats.totalLifetime),
    isActive: isActiveRef.current,
    resetStats,
  };
}
