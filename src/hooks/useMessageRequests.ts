import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MessageRequest {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  createdAt: string;
  sender: {
    id: string;
    username: string;
    avatar_url: string;
  };
}

export function useMessageRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<MessageRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch message requests
  const fetchRequests = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('message_requests')
        .select(`
          *,
          profiles!message_requests_sender_id_fkey (
            id,
            username,
            avatar_url
          )
        `)
        .eq('receiver_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const transformedRequests: MessageRequest[] = (data || []).map(req => ({
        id: req.id,
        senderId: req.sender_id,
        receiverId: req.receiver_id,
        message: req.message,
        createdAt: req.created_at,
        sender: req.profiles,
      }));

      setRequests(transformedRequests);
    } catch (err) {
      console.error('Error fetching message requests:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  // Accept a message request
  const acceptRequest = async (requestId: string) => {
    if (!user?.id) return;

    try {
      // Get the request details
      const { data: request, error: getRequestError } = await supabase
        .from('message_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (getRequestError) throw getRequestError;

      // Create a chat between the users
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .insert({
          created_by: user.id,
          is_group: false,
        })
        .select()
        .single();

      if (chatError) throw chatError;

      const chatId = chatData.id;

      // Add both users to the chat
      const { error: participantsError } = await supabase
        .from('chat_participants')
        .insert([
          { chat_id: chatId, user_id: user.id },
          { chat_id: chatId, user_id: request.sender_id },
        ]);

      if (participantsError) throw participantsError;

      // Send the initial message
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: request.sender_id,
          content: request.message,
        });

      if (messageError) throw messageError;

      // Delete the request
      const { error: deleteError } = await supabase
        .from('message_requests')
        .delete()
        .eq('id', requestId);

      if (deleteError) throw deleteError;

      // Update local state
      setRequests(prev => prev.filter(req => req.id !== requestId));
      
      toast.success('Message request accepted! Chat created.');
    } catch (err) {
      console.error('Error accepting request:', err);
      toast.error('Failed to accept request');
      throw err;
    }
  };

  // Deny a message request
  const denyRequest = async (requestId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('message_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      // Update local state
      setRequests(prev => prev.filter(req => req.id !== requestId));
      
      toast.success('Message request denied.');
    } catch (err) {
      console.error('Error denying request:', err);
      toast.error('Failed to deny request');
      throw err;
    }
  };

  // Create a message request
  const createRequest = async (receiverId: string, message: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('message_requests')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          message,
        });

      if (error) throw error;

      toast.success('Message request sent!');
    } catch (err) {
      console.error('Error creating request:', err);
      toast.error('Failed to send message request');
      throw err;
    }
  };

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('message_requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_requests',
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Initial fetch
  useEffect(() => {
    fetchRequests();
  }, [user?.id]);

  return {
    requests,
    loading,
    error,
    acceptRequest,
    denyRequest,
    createRequest,
    refetch: fetchRequests,
  };
}
