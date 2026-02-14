import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SearchResult {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  chat_id: string;
  sender_username: string;
}

export function useMessageSearch(chatId: string | null) {
  const { user } = useAuth();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  const search = useCallback(async (searchQuery: string) => {
    if (!user || !chatId || !searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setQuery(searchQuery);

    try {
      // Search messages in the current chat
      const { data: messages, error } = await supabase
        .from('messages')
        .select('id, content, sender_id, created_at, chat_id')
        .eq('chat_id', chatId)
        .ilike('content', `%${searchQuery}%`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error searching messages:', error);
        setResults([]);
        setLoading(false);
        return;
      }

      if (!messages || messages.length === 0) {
        setResults([]);
        setLoading(false);
        return;
      }

      // Get unique sender IDs
      const senderIds = [...new Set(messages.map(m => m.sender_id))];

      // Fetch profiles for all senders
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', senderIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.username]) || []);

      // Map results with sender usernames
      const searchResults: SearchResult[] = messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        sender_id: msg.sender_id,
        created_at: msg.created_at,
        chat_id: msg.chat_id,
        sender_username: msg.sender_id === user.id 
          ? 'You' 
          : (profileMap.get(msg.sender_id) || 'Unknown')
      }));

      setResults(searchResults);
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
    }

    setLoading(false);
  }, [user, chatId]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
  }, []);

  return { results, loading, query, search, clearSearch };
}
