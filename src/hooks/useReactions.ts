import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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

export function useReactions(chatId: string | null) {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<ReactionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !chatId) {
      setReactions([]);
      setLoading(false);
      return;
    }

    let channel: RealtimeChannel;

    const fetchReactions = async () => {
      try {
        // Get all message IDs for this chat first
        const { data: messages, error: messagesError } = await supabase
          .from('messages')
          .select('id')
          .eq('chat_id', chatId);

        if (messagesError) {
          console.error('Error fetching messages for reactions:', messagesError);
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

        const { data, error } = await supabase
          .from('message_reactions')
          .select('*')
          .in('message_id', messageIds);

        if (error) {
          console.error('Error fetching reactions:', error);
          setReactions([]);
        } else {
          // Filter reactions to only include those for messages in this chat
          const chatMessageIds = new Set(messageIds);
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
      }
    };

    fetchReactions();

    // Subscribe to realtime updates
    channel = supabase
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
          // Only add if it's for a message in this chat
          setReactions(prev => {
            // Check if reaction already exists (prevent duplicates)
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
          setReactions(prev => prev.filter(r => r.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, chatId]);

  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    // Check if user already reacted with this emoji
    const existingReaction = reactions.find(
      r => r.message_id === messageId && r.user_id === user.id && r.emoji === emoji
    );

    if (existingReaction) {
      // Remove reaction
      const { error } = await supabase
        .from('message_reactions')
        .delete()
        .eq('id', existingReaction.id);

      if (!error) {
        setReactions(prev => prev.filter(r => r.id !== existingReaction.id));
      }
      return { error };
    } else {
      // Add reaction
      const { data, error } = await supabase
        .from('message_reactions')
        .insert({
          message_id: messageId,
          user_id: user.id,
          emoji
        })
        .select()
        .maybeSingle();

      if (!error && data) {
        setReactions(prev => [...prev, data as ReactionData]);
      }
      return { error: error as Error | null };
    }
  };

  const getReactionsForMessage = (messageId: string): ReactionCount[] => {
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
  };

  return { reactions, loading, toggleReaction, getReactionsForMessage };
}

export const REACTION_EMOJIS = ['❤️', '🙏', '😂', '😮', '😢', '🔥'];
