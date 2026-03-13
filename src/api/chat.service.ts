import { supabase } from '@/integrations/supabase/client';
import { MessageData, ChatData } from '@/hooks/useChats';

export const chatService = {
  /**
   * Fetch messages for a specific chat with pagination
   */
  async getMessages(chatId: string, limit: number = 50, offset: number = 0) {
    const { data, error, count } = await supabase
      .from('messages')
      .select('*', { count: 'exact' })
      .eq('chat_id', chatId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return { data: data as MessageData[], count };
  },

  /**
   * Send a new message
   */
  async sendMessage(message: Partial<MessageData>) {
    const { data, error } = await supabase
      .from('messages')
      .insert([message])
      .select()
      .single();

    if (error) throw error;
    return data as MessageData;
  },

  /**
   * Mark messages as read
   */
  async markAsRead(chatId: string, userId: string) {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('chat_id', chatId)
      .neq('sender_id', userId)
      .eq('is_read', false);

    if (error) throw error;
  },

  /**
   * Get user's active chats
   */
  async getChats(userId: string) {
    const { data, error } = await supabase
      .from('chat_participants')
      .select(`
        chat_id,
        chats (*)
      `)
      .eq('user_id', userId);

    if (error) throw error;
    return data;
  }
};
