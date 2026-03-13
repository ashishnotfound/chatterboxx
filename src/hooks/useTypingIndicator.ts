import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface TypingUser {
  id: string;
  username: string;
}

/**
 * useTypingIndicator — Optimized Typing Detection
 *
 * Key improvements:
 * - Caches username to avoid DB query on every keystroke
 * - Throttles broadcasts to max once per 1.5 seconds
 * - Auto-removes stale typing indicators after 4 seconds
 * - Properly cleans up all timeouts and channels on unmount
 */
export function useTypingIndicator(chatId: string | null) {
  const { user, profile } = useAuth();
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastBroadcastRef = useRef<number>(0);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const isTypingRef = useRef(false);

  // Cache the username from the user's profile (already loaded in AuthContext)
  const cachedUsernameRef = useRef<string>('User');
  useEffect(() => {
    if (profile?.username) {
      cachedUsernameRef.current = profile.username;
    }
  }, [profile?.username]);

  useEffect(() => {
    if (!chatId || !user) return;

    const channel = supabase.channel(`typing:${chatId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        const typingUser = payload.payload as TypingUser & { isTyping: boolean };

        // Ignore own typing events
        if (typingUser.id === user.id) return;

        // Clear existing timeout for this user
        const existingTimeout = typingTimeoutsRef.current.get(typingUser.id);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
          typingTimeoutsRef.current.delete(typingUser.id);
        }

        setTypingUsers(prev => {
          if (typingUser.isTyping) {
            if (!prev.find(u => u.id === typingUser.id)) {
              return [...prev, { id: typingUser.id, username: typingUser.username }];
            }
            return prev;
          } else {
            return prev.filter(u => u.id !== typingUser.id);
          }
        });

        // Auto-remove typing indicator after 4 seconds of no updates
        if (typingUser.isTyping) {
          const timeoutId = setTimeout(() => {
            setTypingUsers(prev => prev.filter(u => u.id !== typingUser.id));
            typingTimeoutsRef.current.delete(typingUser.id);
          }, 4000);
          typingTimeoutsRef.current.set(typingUser.id, timeoutId);
        }
      })
      .subscribe();

    channelRef.current = channel;

    // Capture ref value for cleanup
    const timeoutsMap = typingTimeoutsRef.current;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
      timeoutsMap.forEach(timeout => clearTimeout(timeout));
      timeoutsMap.clear();
    };
  }, [chatId, user]);

  // Send typing indicator — uses cached username, no DB query
  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (!chatId || !user || !channelRef.current) return;

    // Throttle typing broadcasts to max once per 1.5 seconds
    const now = Date.now();
    if (isTyping && now - lastBroadcastRef.current < 1500) return;
    lastBroadcastRef.current = now;

    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        id: user.id,
        username: cachedUsernameRef.current,
        isTyping
      }
    }).catch((err: Error) => {
      console.error('Error sending typing indicator:', err);
    });
  }, [chatId, user]);

  const startTyping = useCallback(() => {
    // Clear any existing stop timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Only broadcast if not already marked as typing
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      sendTypingIndicator(true);
    } else {
      // Refresh the throttle window for subsequent keystrokes
      sendTypingIndicator(true);
    }

    // Auto-stop typing after 2.5 seconds of no input
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      sendTypingIndicator(false);
    }, 2500);
  }, [sendTypingIndicator]);

  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (isTypingRef.current) {
      isTypingRef.current = false;
      sendTypingIndicator(false);
    }
  }, [sendTypingIndicator]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    typingUsers,
    startTyping,
    stopTyping,
    isOtherUserTyping: typingUsers.length > 0
  };
}
