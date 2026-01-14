'use client';

import { useState, useEffect, useCallback } from 'react';

interface OnlineStatusState {
  isOnline: boolean;
  wasOffline: boolean;
  lastOnlineAt: Date | null;
}

/**
 * Hook to detect and track online/offline status
 * Uses navigator.onLine and online/offline events for real-time updates
 *
 * IMPORTANT: Initial state is always `isOnline: true` to prevent hydration mismatch.
 * The actual online status is determined in useEffect after mount.
 */
export function useOnlineStatus() {
  // Always start with isOnline: true to avoid hydration mismatch
  // The actual status is checked in useEffect after mount
  const [state, setState] = useState<OnlineStatusState>({
    isOnline: true,
    wasOffline: false,
    lastOnlineAt: null,
  });

  const handleOnline = useCallback(() => {
    setState((prev) => ({
      isOnline: true,
      wasOffline: !prev.isOnline ? true : prev.wasOffline,
      lastOnlineAt: new Date(),
    }));
  }, []);

  const handleOffline = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isOnline: false,
    }));
  }, []);

  // Reset the wasOffline flag (useful after showing reconnection message)
  const resetWasOffline = useCallback(() => {
    setState((prev) => ({
      ...prev,
      wasOffline: false,
    }));
  }, []);

  useEffect(() => {
    // Set initial state on mount (handles SSR)
    if (typeof navigator !== 'undefined') {
      setState((prev) => ({
        ...prev,
        isOnline: navigator.onLine,
      }));
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return {
    ...state,
    resetWasOffline,
  };
}
