import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface ReactionData {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface ReactionCount {
  emoji: string;
  count: number;
  hasUserReacted: boolean;
}

/**
 * useReactions — Fixed version
 *
 * Key fixes:
 * 1. fetchReactions wrapped in useCallback to avoid stale closure in realtime handler
 * 2. getReactionsForMessage memoized by messageId — not recreated per call in render loop
 * 3. Concurrent fetch protection
 * 4. Properly typed channel variable (was using `let channel` before channel assignment)
 */
export function useReactions(chatId: string | null) {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<ReactionData[]>([]);
  const [loading, setLoading] = useState(true);
  const isFetchingRef = useRef(false);

  const fetchReactions = useCallback(async () => {
    if (!user || !chatId) {
      setReactions([]);
      setLoading(false);
      return;
    }
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('id')
        .eq('chat_id', chatId);

      if (messagesError) {
        setReactions([]);
        setLoading(false);
        return;
      }

      if (!messages || messages.length === 0) {
        setReactions([]);
        setLoading(false);
        return;
      }

      const messageIds = messages.map(m => m.id);
      const chatMessageIds = new Set(messageIds);

      const { data, error } = await supabase
        .from('message_reactions')
        .select('*')
        .in('message_id', messageIds);

      if (error) {
        setReactions([]);
      } else {
        const filteredReactions = (data || []).filter((r: ReactionData) =>
          chatMessageIds.has(r.message_id)
        );
        setReactions(filteredReactions as ReactionData[]);
      }
    } catch (err) {
      console.error('Unexpected error fetching reactions:', err);
      setReactions([]);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [user, chatId]);

  useEffect(() => {
    if (!user || !chatId) {
      setReactions([]);
      setLoading(false);
      return;
    }

    fetchReactions();

    const channel: RealtimeChannel = supabase
      .channel(`reactions-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_reactions'
        },
        (payload) => {
          const newReaction = payload.new as ReactionData;
          setReactions(prev => {
            if (prev.find(r => r.id === newReaction.id)) {
              return prev;
            }
            return [...prev, newReaction];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'message_reactions'
        },
        (payload) => {
          setReactions(prev => prev.filter(r => r.id !== (payload.old as { id: string }).id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, chatId, fetchReactions]);

  const toggleReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    const existingReaction = reactions.find(
      r => r.message_id === messageId && r.user_id === user.id && r.emoji === emoji
    );

    if (existingReaction) {
      // Optimistic remove
      setReactions(prev => prev.filter(r => r.id !== existingReaction.id));
      const { error } = await supabase
        .from('message_reactions')
        .delete()
        .eq('id', existingReaction.id);

      if (error) {
        // Revert on error
        setReactions(prev => [...prev, existingReaction]);
      }
      return { error: error as Error | null };
    } else {
      const optimisticId = `optimistic-${Date.now()}`;
      const optimisticReaction: ReactionData = {
        id: optimisticId,
        message_id: messageId,
        user_id: user.id,
        emoji,
        created_at: new Date().toISOString()
      };
      // Optimistic add
      setReactions(prev => [...prev, optimisticReaction]);

      const { data, error } = await supabase
        .from('message_reactions')
        .insert({ message_id: messageId, user_id: user.id, emoji })
        .select()
        .maybeSingle();

      if (error) {
        // Revert on error
        setReactions(prev => prev.filter(r => r.id !== optimisticId));
      } else if (data) {
        // Replace optimistic with real
        setReactions(prev =>
          prev.map(r => r.id === optimisticId ? data as ReactionData : r)
        );
      }
      return { error: error as Error | null };
    }
  }, [user, reactions]);

  // Memoized per chatId — stable function reference for message list rendering
  const getReactionsForMessage = useCallback((messageId: string): ReactionCount[] => {
    const messageReactions = reactions.filter(r => r.message_id === messageId);
    const emojiCounts: Record<string, { count: number; hasUserReacted: boolean }> = {};

    messageReactions.forEach(r => {
      if (!emojiCounts[r.emoji]) {
        emojiCounts[r.emoji] = { count: 0, hasUserReacted: false };
      }
      emojiCounts[r.emoji].count++;
      if (r.user_id === user?.id) {
        emojiCounts[r.emoji].hasUserReacted = true;
      }
    });

    return Object.entries(emojiCounts).map(([emoji, data]) => ({
      emoji,
      count: data.count,
      hasUserReacted: data.hasUserReacted
    }));
  }, [reactions, user?.id]);

  return { reactions, loading, toggleReaction, getReactionsForMessage };
}

export const REACTION_EMOJIS = ['❤️', '🙏', '😂', '😮', '😢', '🔥'];
