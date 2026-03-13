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
  // Stable refs for handlers so the event-listener useEffect never needs to re-run
  const foregroundRef = useRef<() => void>(() => { });
  const backgroundRef = useRef<() => void>(() => { });
  const startTimerRef = useRef<() => void>(() => { });
  const cleanupTimerRef = useRef<() => void>(() => { });

  // Load usage stats from localStorage on mount
  useEffect(() => {
    loadUsageStats();
  }, []);

  // NOTE: We do NOT watch usageStats in a useEffect for saving.
  // That would save to localStorage every second (timer updates state every 1s).
  // Instead we save directly inside each mutation function below.

  // Handle app state changes (foreground/background)
  useEffect(() => {
    if (Capacitor.getPlatform() === 'web') return;

    const handleAppStateChange = (state: { isActive: boolean }) => {
      if (state.isActive && !isActiveRef.current) {
        foregroundRef.current();
      } else if (!state.isActive && isActiveRef.current) {
        backgroundRef.current();
      }
      isActiveRef.current = state.isActive;
    };

    const appStateListener = App.addListener('appStateChange', handleAppStateChange);

    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      if (isVisible && !isActiveRef.current) {
        foregroundRef.current();
      } else if (!isVisible && isActiveRef.current) {
        backgroundRef.current();
      }
      isActiveRef.current = isVisible;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      appStateListener.then(listener => listener.remove());
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Capture current value to avoid lint: 'ref value will have changed'
      const cleanup = cleanupTimerRef.current;
      cleanup();
    };
  }, []); // intentionally empty — uses stable refs for all callbacks

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
    isActiveRef.current = true;

    setUsageStats(prev => ({
      ...prev,
      sessionStartTime: Date.now(),
      lastActiveTime: Date.now(),
    }));

    startTimer();
  };
  // Keep ref in sync so the event listener useEffect always calls latest version
  foregroundRef.current = handleAppForeground;

  const handleAppBackground = () => {
    isActiveRef.current = false;

    setUsageStats(prev => {
      const sessionTime = prev.sessionStartTime ?
        Math.floor((Date.now() - prev.sessionStartTime) / 1000) : 0;

      const next = {
        ...prev,
        totalLifetime: prev.totalLifetime + sessionTime,
        currentSession: 0,
        sessionStartTime: null,
        lastActiveTime: Date.now(),
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...next, lastActiveTime: Date.now() }));
      } catch (_e) { /* non-critical */ }

      return next;
    });

    cleanupTimer();
  };
  backgroundRef.current = handleAppBackground;

  const startTimer = () => {
    cleanupTimer();

    intervalRef.current = setInterval(() => {
      if (isActiveRef.current) {
        setUsageStats(prev => {
          const sessionTime = prev.sessionStartTime ?
            Math.floor((Date.now() - prev.sessionStartTime) / 1000) : 0;

          return { ...prev, currentSession: sessionTime };
        });
      }
    }, 1000);
  };
  startTimerRef.current = startTimer;

  const cleanupTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };
  cleanupTimerRef.current = cleanupTimer;

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
