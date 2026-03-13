import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
<<<<<<< HEAD
import { useAuth } from '@/contexts/AuthContext';
=======
import { useAuth } from '@/hooks/useAuth';
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)

interface TypingUser {
  id: string;
  username: string;
}

<<<<<<< HEAD
export function useTypingIndicator(chatId: string | null) {
  const { user } = useAuth();
=======
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
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastBroadcastRef = useRef<number>(0);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
<<<<<<< HEAD
=======
  const isTypingRef = useRef(false);

  // Cache the username from the user's profile (already loaded in AuthContext)
  const cachedUsernameRef = useRef<string>('User');
  useEffect(() => {
    if (profile?.username) {
      cachedUsernameRef.current = profile.username;
    }
  }, [profile?.username]);
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)

  useEffect(() => {
    if (!chatId || !user) return;

    const channel = supabase.channel(`typing:${chatId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        const typingUser = payload.payload as TypingUser & { isTyping: boolean };
<<<<<<< HEAD
        
=======

>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
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
<<<<<<< HEAD
            // Add user if not already in list
=======
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
            if (!prev.find(u => u.id === typingUser.id)) {
              return [...prev, { id: typingUser.id, username: typingUser.username }];
            }
            return prev;
          } else {
<<<<<<< HEAD
            // Remove user from list
=======
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
            return prev.filter(u => u.id !== typingUser.id);
          }
        });

<<<<<<< HEAD
        // Auto-remove typing indicator after 3 seconds of no updates
=======
        // Auto-remove typing indicator after 4 seconds of no updates
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
        if (typingUser.isTyping) {
          const timeoutId = setTimeout(() => {
            setTypingUsers(prev => prev.filter(u => u.id !== typingUser.id));
            typingTimeoutsRef.current.delete(typingUser.id);
<<<<<<< HEAD
          }, 3000);
=======
          }, 4000);
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
          typingTimeoutsRef.current.set(typingUser.id, timeoutId);
        }
      })
      .subscribe();

    channelRef.current = channel;

<<<<<<< HEAD
    return () => {
      channel.unsubscribe();
      channelRef.current = null;
      // Clear all typing timeouts
      typingTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      typingTimeoutsRef.current.clear();
    };
  }, [chatId, user]);

  const sendTypingIndicator = useCallback(async (isTyping: boolean) => {
    if (!chatId || !user || !channelRef.current) return;

    // Throttle typing broadcasts to max once per 1 second
    const now = Date.now();
    if (isTyping && now - lastBroadcastRef.current < 1000) return;
    lastBroadcastRef.current = now;

    try {
      // Fetch current user's username
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile for typing indicator:', error);
      }

      await channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          id: user.id,
          username: profile?.username || 'User',
          isTyping
        }
      });
    } catch (err) {
      console.error('Error sending typing indicator:', err);
    }
  }, [chatId, user]);

  const startTyping = useCallback(() => {
    // Clear any existing timeout
=======
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
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

<<<<<<< HEAD
    sendTypingIndicator(true);

    // Auto-stop typing after 2 seconds of no input
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingIndicator(false);
    }, 2000);
=======
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
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
  }, [sendTypingIndicator]);

  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
<<<<<<< HEAD
    sendTypingIndicator(false);
=======
    if (isTypingRef.current) {
      isTypingRef.current = false;
      sendTypingIndicator(false);
    }
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
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
