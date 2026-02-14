import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TypingUser {
  id: string;
  username: string;
}

export function useTypingIndicator(chatId: string | null) {
  const { user } = useAuth();
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastBroadcastRef = useRef<number>(0);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

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
            // Add user if not already in list
            if (!prev.find(u => u.id === typingUser.id)) {
              return [...prev, { id: typingUser.id, username: typingUser.username }];
            }
            return prev;
          } else {
            // Remove user from list
            return prev.filter(u => u.id !== typingUser.id);
          }
        });

        // Auto-remove typing indicator after 3 seconds of no updates
        if (typingUser.isTyping) {
          const timeoutId = setTimeout(() => {
            setTypingUsers(prev => prev.filter(u => u.id !== typingUser.id));
            typingTimeoutsRef.current.delete(typingUser.id);
          }, 3000);
          typingTimeoutsRef.current.set(typingUser.id, timeoutId);
        }
      })
      .subscribe();

    channelRef.current = channel;

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
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    sendTypingIndicator(true);

    // Auto-stop typing after 2 seconds of no input
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingIndicator(false);
    }, 2000);
  }, [sendTypingIndicator]);

  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    sendTypingIndicator(false);
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
