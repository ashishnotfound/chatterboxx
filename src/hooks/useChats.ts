import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';
import { getUserFriendlyError } from '@/utils/errors';

export interface ChatData {
  id: string;
  is_password_protected: boolean;
  created_at: string;
  updated_at: string;
  participants: ParticipantData[];
  last_message?: MessageData;
  unread_count: number;
  is_pinned: boolean;
}

export interface ParticipantData {
  user_id: string;
  profile: ProfileData;
  is_pinned: boolean;
  unread_count: number;
}

export interface ProfileData {
  id: string;
  username: string;
  avatar_url: string | null;
  is_online: boolean;
  presence_status: 'online' | 'idle' | 'dnd' | 'invisible';
  streak_count: number;
  subscription_tier: 'free' | 'pro';
  last_seen: string | null;
}

export interface MessageData {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  is_ephemeral: boolean;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
  reply_to_id: string | null;
  edited_at: string | null;
  image_url?: string | null;
  image_metadata?: {
    name: string;
    size: number;
    type: string;
    width?: number;
    height?: number;
  } | null;
  file_url?: string | null;
  file_metadata?: {
    name: string;
    size: number;
    type: string;
  } | null;
  video_url?: string | null;
  video_metadata?: {
    name: string;
    size: number;
    type: string;
    duration?: number;
    thumbnail?: string;
  } | null;
  status?: 'sending' | 'sent' | 'error';
}

export function useChats() {
  const { user } = useAuth();
  const [chats, setChats] = useState<ChatData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setChats([]);
      setLoading(false);
      return;
    }

    let channel: RealtimeChannel;

    const fetchChats = async () => {
      // Fetch chat participants for current user
      const { data: participantData, error: participantError } = await supabase
        .from('chat_participants')
        .select(`
          chat_id,
          is_pinned,
          unread_count,
          chats (
            id,
            is_password_protected,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', user.id);

      if (participantError) {
        console.error('Error fetching chats:', participantError);
        setLoading(false);
        return;
      }

      if (!participantData || participantData.length === 0) {
        setChats([]);
        setLoading(false);
        return;
      }

      // Get all chat IDs
      const chatIds = participantData.map(p => p.chat_id);

      // Fetch all participants for these chats
      const { data: allParticipants } = await supabase
        .from('chat_participants')
        .select(`
          chat_id,
          user_id,
          is_pinned,
          unread_count,
          profiles (
            id,
            username,
            avatar_url,
            is_online,
            presence_status,
            streak_count,
            subscription_tier,
            last_seen
          )
        `)
        .in('chat_id', chatIds);

      // Fetch last message for each chat
      const { data: lastMessages } = await supabase
        .from('messages')
        .select('*')
        .in('chat_id', chatIds)
        .order('created_at', { ascending: false });

      // Build chat data
      const chatData: ChatData[] = participantData
        .map(p => {
          // Handle case where chats might be an array or single object
          const chat = Array.isArray(p.chats) ? p.chats[0] : p.chats;
          if (!chat) return null; // Skip if no chat found
          
          const participants = allParticipants?.filter(ap => ap.chat_id === p.chat_id) || [];
          const lastMessage = lastMessages?.find(m => m.chat_id === p.chat_id);

          return {
            id: chat.id,
            is_password_protected: chat.is_password_protected,
            created_at: chat.created_at,
            updated_at: chat.updated_at,
            participants: participants.map(part => {
              // Handle case where profiles might be an array or single object
              const profile = Array.isArray(part.profiles) ? part.profiles[0] : part.profiles;
              const profileData = (profile || {}) as ProfileData;
              // Add cache busting to avatar URL if it exists and doesn't already have a timestamp
              if (profileData.avatar_url && !profileData.avatar_url.includes('?t=')) {
                profileData.avatar_url = `${profileData.avatar_url}?t=${Date.now()}`;
              }
              return {
                user_id: part.user_id,
                profile: profileData,
                is_pinned: part.is_pinned,
                unread_count: part.unread_count
              };
            }),
            last_message: lastMessage as MessageData | undefined,
            unread_count: p.unread_count,
            is_pinned: p.is_pinned
          } as ChatData;
        })
        .filter((chat): chat is ChatData => chat !== null);

      // Deduplicate chats by friend (for 1:1 chats, keep the one with latest message)
      const friendChatMap = new Map<string, ChatData>();
      
      for (const chat of chatData) {
        // Find the other participant (friend)
        const otherParticipant = chat.participants.find(p => p.user_id !== user.id);
        if (!otherParticipant) continue;
        
        const friendId = otherParticipant.user_id;
        const existingChat = friendChatMap.get(friendId);
        
        if (!existingChat) {
          friendChatMap.set(friendId, chat);
        } else {
          // Keep the chat with the latest message
          const existingTime = existingChat.last_message 
            ? new Date(existingChat.last_message.created_at).getTime() 
            : 0;
          const currentTime = chat.last_message 
            ? new Date(chat.last_message.created_at).getTime() 
            : 0;
          
          if (currentTime > existingTime) {
            // Merge unread counts when deduplicating
            chat.unread_count += existingChat.unread_count;
            friendChatMap.set(friendId, chat);
          } else {
            // Keep existing but add unread count from current
            existingChat.unread_count += chat.unread_count;
          }
        }
      }

      // Convert map to array and sort: pinned first, then by latest message time
      const uniqueChats = Array.from(friendChatMap.values()).sort((a, b) => {
        // Pinned chats come first
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        
        // Then sort by latest message time (most recent first)
        const aTime = a.last_message ? new Date(a.last_message.created_at).getTime() : 0;
        const bTime = b.last_message ? new Date(b.last_message.created_at).getTime() : 0;
        return bTime - aTime;
      });

      setChats(uniqueChats);
      setLoading(false);
    };

    fetchChats();

    // Subscribe to realtime updates
    channel = supabase
      .channel('chats-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => fetchChats()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_participants' },
        () => fetchChats()
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload) => {
          // Update chat participants' profiles when they change
          const updatedProfile = payload.new as Partial<ProfileData> & { id?: string };
          // Only update if avatar changed or presence status changed (affects ordering)
          const shouldUpdate = updatedProfile.avatar_url || updatedProfile.presence_status || updatedProfile.last_seen;
          
          if (shouldUpdate && updatedProfile.id) {
            // Add cache busting to avatar URL if it exists and doesn't already have a timestamp
            if (updatedProfile.avatar_url && !updatedProfile.avatar_url.includes('?t=')) {
              updatedProfile.avatar_url = `${updatedProfile.avatar_url}?t=${Date.now()}`;
            }
            
            // Update local state for immediate UI update
            setChats(prev => prev.map(chat => ({
              ...chat,
              participants: chat.participants.map(participant => 
                participant.user_id === updatedProfile.id
                  ? { ...participant, profile: { ...participant.profile, ...updatedProfile } as ProfileData }
                  : participant
              )
            })));
            
            // Only refetch if last_seen changed (affects chat ordering)
            if (updatedProfile.last_seen) {
              fetchChats();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const createChat = async (friendId: string) => {
    if (!user) return { error: new Error('Not authenticated'), chatId: null };

    try {
      // Validate that both users have profiles (required for foreign key constraint)
      // First, try to ensure current user's profile exists
      let { data: currentUserProfile, error: currentUserError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (currentUserError || !currentUserProfile) {
        // Try to create the profile if it doesn't exist
        console.log('Current user profile not found, attempting to create...');
        const defaultUsername = user.email?.split('@')[0] || `user_${user.id.substring(0, 8)}`;
        const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`;
        
        const { error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            username: defaultUsername,
            email: user.email || null,
            avatar_url: defaultAvatar,
            is_online: true,
            presence_status: 'online',
            is_stealth_mode: false,
            subscription_tier: 'free',
            theme_background: 'purple',
            theme_bubble_color: 'pink',
            theme_avatar_border: 'pink'
          });

        if (createError) {
          // If it's a unique constraint, profile might exist now
          if (createError.code === '23505' || createError.message?.includes('duplicate') || createError.message?.includes('unique')) {
            // Retry fetching
            const retry = await supabase
              .from('profiles')
              .select('id')
              .eq('id', user.id)
              .maybeSingle();
            currentUserProfile = retry.data;
            currentUserError = retry.error;
          } else {
            console.error('Error creating profile:', createError);
            return { error: new Error('Failed to create your profile. Please try again or contact support.'), chatId: null };
          }
        } else {
          // Profile created, set it
          currentUserProfile = { id: user.id };
        }
      }

      if (currentUserError || !currentUserProfile) {
        return { error: new Error('Your profile does not exist. Please contact support.'), chatId: null };
      }

      const { data: friendProfile, error: friendError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', friendId)
        .maybeSingle();

      if (friendError || !friendProfile) {
        return { error: new Error('User profile not found. The user may not exist.'), chatId: null };
      }

      // Check if chat already exists with this friend
      const { data: existingChats } = await supabase
        .from('chat_participants')
        .select('chat_id')
        .eq('user_id', user.id);

      if (existingChats && existingChats.length > 0) {
        const chatIds = existingChats.map(c => c.chat_id);
        const { data: friendChats } = await supabase
          .from('chat_participants')
          .select('chat_id')
          .eq('user_id', friendId)
          .in('chat_id', chatIds);

        if (friendChats && friendChats.length > 0) {
          // Chat already exists, return existing chat ID
          return { error: null, chatId: friendChats[0].chat_id };
        }
      }

      // Generate chat id client-side so we don't need a SELECT RETURNING (which can be blocked by RLS
      // before participants exist).
      const newChatId = (globalThis.crypto && 'randomUUID' in globalThis.crypto)
        ? globalThis.crypto.randomUUID()
        : `${user.id}-${Date.now()}-${Math.random().toString(36).substring(2)}`;

      // Create chat
      const { error: chatError } = await supabase
        .from('chats')
        .insert({ id: newChatId });

      if (chatError) {
        console.error('Error creating chat:', chatError);
        return { error: chatError as Error, chatId: null };
      }

      // Add participants (insert self first, then friend)
      const { error: selfParticipantError } = await supabase
        .from('chat_participants')
        .insert({ chat_id: newChatId, user_id: user.id });

      if (selfParticipantError) {
        console.error('Error adding self participant:', selfParticipantError);
        // Handle foreign key constraint violation
        if (selfParticipantError.code === '23503' || selfParticipantError.message?.includes('foreign key') || selfParticipantError.message?.includes('violates foreign key constraint')) {
          // Try to clean up the chat if participant insert fails
          await supabase.from('chats').delete().eq('id', newChatId);
          return { error: new Error('Your profile does not exist. Please contact support.'), chatId: null };
        }
        // Try to clean up the chat if participant insert fails
        await supabase.from('chats').delete().eq('id', newChatId);
        return { error: selfParticipantError as Error, chatId: null };
      }

      const { error: friendParticipantError } = await supabase
        .from('chat_participants')
        .insert({ chat_id: newChatId, user_id: friendId });

      if (friendParticipantError) {
        console.error('Error adding friend participant:', friendParticipantError);
        // Handle foreign key constraint violation
        if (friendParticipantError.code === '23503' || friendParticipantError.message?.includes('foreign key') || friendParticipantError.message?.includes('violates foreign key constraint')) {
          // Try to clean up the chat and self participant if friend insert fails
          await supabase.from('chat_participants').delete().eq('chat_id', newChatId);
          await supabase.from('chats').delete().eq('id', newChatId);
          return { error: new Error('User profile not found. Please ensure both users have profiles.'), chatId: null };
        }
        // Try to clean up the chat and self participant if friend insert fails
        await supabase.from('chat_participants').delete().eq('chat_id', newChatId);
        await supabase.from('chats').delete().eq('id', newChatId);
        return { error: friendParticipantError as Error, chatId: null };
      }

      return { error: null, chatId: newChatId };
    } catch (err) {
      console.error('Unexpected error creating chat:', err);
      return { error: new Error(err instanceof Error ? err.message : 'Failed to create chat'), chatId: null };
    }
  };

  const toggleChatPin = async (chatId: string, currentlyPinned: boolean) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { error } = await supabase
        .from('chat_participants')
        .update({ is_pinned: !currentlyPinned })
        .eq('chat_id', chatId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error toggling chat pin:', error);
        return { error: error as Error };
      }

      return { error: null };
    } catch (err) {
      console.error('Unexpected error toggling chat pin:', err);
      return { error: new Error(err instanceof Error ? err.message : 'Failed to update pin state') };
    }
  };

  return { chats, loading, createChat, toggleChatPin };
}

export function useMessages(chatId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const MESSAGES_PER_PAGE = 50;

  const markMessagesAsRead = useCallback(async (messageIds: string[]) => {
    if (!user || messageIds.length === 0) return;

    try {
      // Update messages to read with read_at timestamp
      // The trigger will automatically set read_at, but we can also set it explicitly
      await supabase
        .from('messages')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .in('id', messageIds)
        .eq('is_read', false); // Only update if not already read
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [user]);

  useEffect(() => {
    if (!user || !chatId) {
      setMessages([]);
      setLoading(false);
      setHasMore(true);
      setError(null);
      return;
    }

    let channel: RealtimeChannel;
    let isMounted = true;

    const fetchMessages = async (limit = MESSAGES_PER_PAGE, offset = 0, retryCount = 0) => {
      try {
        setError(null);
        
        const { data, error: fetchError } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', chatId)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (!isMounted) return;

        if (fetchError) {
          console.error('Error fetching messages:', fetchError);
          
          // If it's a permission error, check if user is a participant
          if (fetchError.code === 'PGRST116' || fetchError.code === '42P17' || fetchError.message?.includes('permission') || fetchError.message?.includes('RLS')) {
            // Retry once after a short delay in case it's a timing issue
            if (retryCount < 1) {
              setTimeout(() => {
                if (isMounted) {
                  fetchMessages(limit, offset, retryCount + 1);
                }
              }, 1000);
              return;
            }
          }
          
          const errorMessage = getUserFriendlyError(fetchError);
          setError(new Error(errorMessage));
          setMessages([]); // Clear messages on error
          setLoading(false);
          setLoadingMore(false);
          setHasMore(false);
          return;
        }

        // Always set messages, even if data is null or empty
        const fetchedMessages = data ? (data as MessageData[]).reverse() : []; // Reverse to get chronological order
        
        if (offset === 0) {
          // Initial load
          setMessages(fetchedMessages);
        } else {
          // Load more - prepend older messages
          setMessages(prev => [...fetchedMessages, ...prev]);
        }
        
        setHasMore(data ? data.length === limit : false);
        setError(null);
        
    // Mark unread messages from other users as read
    if (fetchedMessages.length > 0) {
      const unreadFromOthers = fetchedMessages.filter(
        m => m.sender_id !== user.id && !m.is_read
      );
      if (unreadFromOthers.length > 0) {
        try {
          await markMessagesAsRead(unreadFromOthers.map(m => m.id));
        } catch (err) {
          console.error('Error marking messages as read:', err);
        }
      }
    }
      } catch (err) {
        if (!isMounted) return;
        console.error('Unexpected error fetching messages:', err);
        setError(new Error(err instanceof Error ? err.message : 'Failed to load messages'));
        setMessages([]); // Clear messages on error
        setLoading(false);
        setLoadingMore(false);
        setHasMore(false);
      } finally {
        if (isMounted) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    };

    fetchMessages();

    // Subscribe to realtime updates for this specific chat
    channel = supabase
      .channel(`chat_room:${chatId}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          const newMessage = payload.new as MessageData;
          // Optimistic UI check: if message already exists (sent by us), just update status
          setMessages(prev => {
            const index = prev.findIndex(m => m.id === newMessage.id || (m.id.startsWith('optimistic-') && m.content === newMessage.content && m.sender_id === newMessage.sender_id));
            if (index !== -1) {
              const updated = [...prev];
              updated[index] = { ...newMessage, status: 'sent' };
              return updated;
            }
            return [...prev, { ...newMessage, status: 'sent' }];
          });
          
          // Auto-mark as read if from other user
          if (newMessage.sender_id !== user.id && !newMessage.is_read) {
            (async () => {
              try {
                await markMessagesAsRead([newMessage.id]);
              } catch (err) {
                console.error('Error marking message as read in realtime:', err);
              }
            })();
          }
        }
      )
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          const updatedMessage = payload.new as MessageData;
          setMessages(prev => 
            prev.map(m => m.id === updatedMessage.id ? { ...updatedMessage, status: 'sent' } : m)
          );
        }
      )
      .on(
        'postgres_changes',
        { 
          event: 'DELETE', 
          schema: 'public', 
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          const deletedMessage = payload.old as { id: string };
          setMessages(prev => prev.filter(m => m.id !== deletedMessage.id));
        }
      )
      .subscribe((status) => {
        // Log connection in debug mode only
      });

    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user, chatId, markMessagesAsRead]);

  const loadMoreMessages = async () => {
    if (loadingMore || !hasMore || !chatId || !user) return;
    
    setLoadingMore(true);
    setError(null);
    
    try {
      const { data, error: loadError } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: false })
        .range(messages.length, messages.length + MESSAGES_PER_PAGE - 1);

      if (loadError) {
        console.error('Error loading more messages:', loadError);
        setError(new Error(getUserFriendlyError(loadError)));
        setLoadingMore(false);
        return;
      }

      if (data && data.length > 0) {
        const fetchedMessages = (data as MessageData[]).reverse();
        setMessages(prev => [...fetchedMessages, ...prev]);
        setHasMore(data.length === MESSAGES_PER_PAGE);
        setError(null);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Unexpected error loading more messages:', err);
      setError(new Error(err instanceof Error ? err.message : 'Failed to load more messages'));
    } finally {
      setLoadingMore(false);
    }
  };

  const retryFetch = useCallback(() => {
    if (!chatId || !user) return;
    setError(null);
    setLoading(true);
    setMessages([]);
    setHasMore(true);
    
    const fetchMessages = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', chatId)
          .order('created_at', { ascending: false })
          .range(0, MESSAGES_PER_PAGE - 1);

        if (fetchError) {
          setError(new Error(getUserFriendlyError(fetchError)));
          setMessages([]);
          return;
        }

        const fetchedMessages = data ? (data as MessageData[]).reverse() : [];
        setMessages(fetchedMessages);
        setHasMore(data ? data.length === MESSAGES_PER_PAGE : false);
        setError(null);
        
        // Mark unread messages as read
        if (fetchedMessages.length > 0) {
          const unreadFromOthers = fetchedMessages.filter(
            m => m.sender_id !== user.id && !m.is_read
          );
          if (unreadFromOthers.length > 0) {
            try {
              await markMessagesAsRead(unreadFromOthers.map(m => m.id));
            } catch (err) {
              console.error('Error marking messages as read in retryFetch:', err);
            }
          }
        }
      } catch (err) {
        setError(new Error(err instanceof Error ? err.message : 'Failed to load messages'));
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [chatId, user, markMessagesAsRead]);

  const uploadImage = async (file: File): Promise<{ url: string; metadata: any } | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user!.id}/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('chat-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('chat-images')
        .getPublicUrl(filePath);

      // Get image dimensions if it's an image
      let imageMetadata: any = {
        name: file.name,
        size: file.size,
        type: file.type
      };

      if (file.type.startsWith('image/')) {
        try {
          const dimensions = await getImageDimensions(file);
          imageMetadata.width = dimensions.width;
          imageMetadata.height = dimensions.height;
        } catch (e) {
          // Ignore dimension errors
        }
      }

      return {
        url: publicUrl,
        metadata: imageMetadata
      };
    } catch (error) {
      console.error('Error in uploadImage:', error);
      return null;
    }
  };

  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  const uploadMedia = async (
    file: File, 
    type: 'image' | 'video' | 'file' | 'audio'
  ): Promise<{ url: string; metadata: any; mediaType: string } | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const bucket = type === 'image' ? 'chat-images' : 'chat-media';
      // Audio files also go to chat-media bucket
      const filePath = `${user!.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error(`Error uploading ${type}:`, uploadError);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      let metadata: any = {
        name: file.name,
        size: file.size,
        type: file.type
      };

      // Get dimensions for images
      if (type === 'image' && file.type.startsWith('image/')) {
        try {
          const dimensions = await getImageDimensions(file);
          metadata.width = dimensions.width;
          metadata.height = dimensions.height;
        } catch (e) {
          // Ignore dimension errors
        }
      }

      // Get video duration if it's a video (would need video processing library)
      // For now, we'll just store basic metadata

      return {
        url: publicUrl,
        metadata,
        mediaType: type
      };
    } catch (error) {
      console.error(`Error in uploadMedia (${type}):`, error);
      return null;
    }
  };

  const sendMessage = async (
    content: string, 
    isEphemeral = false, 
    replyToId: string | null = null,
    mediaFile?: File,
    mediaType: 'image' | 'video' | 'file' | 'audio' = 'image'
  ) => {
    if (!user || !chatId) return { error: new Error('Not authenticated or no chat') };

    // Validate content or media
    if (!content.trim() && !mediaFile) {
      return { error: new Error('Message content or media is required') };
    }

    // Create optimistic message
    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticMessage: MessageData = {
      id: optimisticId,
      chat_id: chatId,
      sender_id: user.id,
      content: content.trim() || '',
      message_type: mediaFile ? mediaType : 'text',
      is_ephemeral: isEphemeral,
      is_read: false,
      created_at: new Date().toISOString(),
      reply_to_id: replyToId,
      edited_at: null,
      status: 'sending' as any // Adding a temporary status field for UI feedback
    };

    // Update state immediately
    setMessages(prev => [...prev, optimisticMessage]);

    let imageUrl: string | null = null;
    let imageMetadata: any = null;
    let fileUrl: string | null = null;
    let fileMetadata: any = null;
    let videoUrl: string | null = null;
    let videoMetadata: any = null;
    let messageType: string = mediaFile ? mediaType : 'text';

    // Upload media if provided
    if (mediaFile) {
      try {
        const uploadResult = await uploadMedia(mediaFile, mediaType);
        if (!uploadResult) {
          setMessages(prev => prev.filter(m => m.id !== optimisticId));
          return { error: new Error(`Failed to upload ${mediaType}`) };
        }

        if (mediaType === 'image') {
          imageUrl = uploadResult.url;
          imageMetadata = uploadResult.metadata;
          messageType = 'image';
        } else if (mediaType === 'video') {
          videoUrl = uploadResult.url;
          videoMetadata = uploadResult.metadata;
          messageType = 'video';
        } else if (mediaType === 'audio') {
          fileUrl = uploadResult.url;
          fileMetadata = uploadResult.metadata;
          messageType = 'audio';
        } else {
          fileUrl = uploadResult.url;
          fileMetadata = uploadResult.metadata;
          messageType = 'file';
        }
      } catch (error) {
        setMessages(prev => prev.filter(m => m.id !== optimisticId));
        console.error('Error uploading media:', error);
        return { error: new Error(`Failed to upload ${mediaType}: ${error instanceof Error ? error.message : 'Unknown error'}`) };
      }
    }

    const expiresAt = isEphemeral ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null;

    try {
      // Build insert object
      const insertData: any = {
        chat_id: chatId,
        sender_id: user.id,
        content: content.trim() || '',
        message_type: messageType,
        is_ephemeral: isEphemeral,
      };

      if (expiresAt) insertData.expires_at = expiresAt;
      if (replyToId) insertData.reply_to_id = replyToId;
      if (imageUrl) {
        insertData.image_url = imageUrl;
        if (imageMetadata) insertData.image_metadata = imageMetadata;
      }
      if (fileUrl) {
        insertData.file_url = fileUrl;
        if (fileMetadata) insertData.file_metadata = fileMetadata;
      }
      if (videoUrl) {
        insertData.video_url = videoUrl;
        if (videoMetadata) insertData.video_metadata = videoMetadata;
      }

      const { error, data } = await supabase
        .from('messages')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        setMessages(prev => prev.filter(m => m.id !== optimisticId));
        return { error: error as Error };
      }

      // Replace optimistic message with actual data
      setMessages(prev => prev.map(m => m.id === optimisticId ? (data as MessageData) : m));
      return { error: null, data };
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== optimisticId));
      return { error: err as Error };
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)
      .eq('sender_id', user.id);

    return { error };
  };

  const editMessage = async (messageId: string, newContent: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('messages')
      .update({ 
        content: newContent,
        edited_at: new Date().toISOString()
      })
      .eq('id', messageId)
      .eq('sender_id', user.id);

    return { error };
  };

  const saveMessage = async (messageId: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('messages')
      .update({
        is_ephemeral: false,
        expires_at: null
      })
      .eq('id', messageId);

    return { error };
  };

  // Check if a message can be deleted (within 15-minute window)
  const canDeleteMessage = (message: MessageData) => {
    if (message.sender_id !== user?.id) return false;
    const messageTime = new Date(message.created_at).getTime();
    const now = Date.now();
    const fifteenMinutes = 15 * 60 * 1000;
    return now - messageTime < fifteenMinutes;
  };

  // Check if a message can be edited (within 15-minute window, own message)
  const canEditMessage = (message: MessageData) => {
    if (message.sender_id !== user?.id) return false;
    const messageTime = new Date(message.created_at).getTime();
    const now = Date.now();
    const fifteenMinutes = 15 * 60 * 1000;
    return now - messageTime < fifteenMinutes;
  };

  return { 
    messages, 
    loading, 
    loadingMore, 
    hasMore, 
    error, 
    loadMoreMessages, 
    retryFetch, 
    sendMessage, 
    deleteMessage, 
    editMessage, 
    saveMessage,
    canDeleteMessage, 
    canEditMessage,
    markMessagesAsRead,
    uploadMedia
  };
}
