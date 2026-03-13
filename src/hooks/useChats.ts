import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { RealtimeChannel } from '@supabase/supabase-js';
import { getUserFriendlyError } from '@/utils/errors';
import { compressImage } from '@/utils/image';
import { SecurityUtils } from '@/utils/performance-security';
import { sanitizeText } from '@/utils/sanitize';

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
  status: 'sending' | 'sent' | 'seen' | 'error';
  seen_at?: string | null;
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
  file_type?: string | null;
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
  local_preview_url?: string | null;
}

export function useChats() {
  const { user } = useAuth();
  const [chats, setChats] = useState<ChatData[]>([]);
  const [loading, setLoading] = useState(true);
  const isFetchingRef = useRef(false);

  const fetchChats = useCallback(async () => {
    if (!user?.id) return;
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
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

      if (participantError) throw participantError;

      if (!participantData || participantData.length === 0) {
        setChats([]);
        setLoading(false);
        return;
      }

      const chatIds = participantData.map(p => p.chat_id);

      // Fetch all participants and last messages in parallel
      const [participantsRes, lastMessagesRes] = await Promise.all([
        supabase
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
          .in('chat_id', chatIds),
        supabase
          .from('messages')
          .select('*')
          .in('chat_id', chatIds)
          .order('created_at', { ascending: false })
      ]);

      const allParticipants = participantsRes.data;
      const lastMessages = lastMessagesRes.data;

      const chatData: ChatData[] = participantData
        .map(p => {
          const chat = Array.isArray(p.chats) ? p.chats[0] : p.chats;
          if (!chat) return null;

          const participants = allParticipants?.filter(ap => ap.chat_id === p.chat_id) || [];
          const lastMessage = lastMessages?.find(m => m.chat_id === p.chat_id);

          return {
            id: chat.id,
            is_password_protected: chat.is_password_protected,
            created_at: chat.created_at,
            updated_at: chat.updated_at,
            participants: participants.map(part => ({
              user_id: part.user_id,
              profile: (Array.isArray(part.profiles) ? part.profiles[0] : part.profiles) as ProfileData,
              is_pinned: part.is_pinned,
              unread_count: part.unread_count
            })),
            last_message: lastMessage as MessageData | undefined,
            unread_count: p.unread_count,
            is_pinned: p.is_pinned
          } as ChatData;
        })
        .filter((chat): chat is ChatData => chat !== null);

      // Deduplicate chats by friend
      const friendChatMap = new Map<string, ChatData>();
      for (const chat of chatData) {
        const otherParticipant = chat.participants.find(p => p.user_id !== user.id);
        if (!otherParticipant) continue;
        const friendId = otherParticipant.user_id;
        const existingChat = friendChatMap.get(friendId);

        if (!existingChat) {
          friendChatMap.set(friendId, chat);
        } else {
          const existingTime = existingChat.last_message ? new Date(existingChat.last_message.created_at).getTime() : 0;
          const currentTime = chat.last_message ? new Date(chat.last_message.created_at).getTime() : 0;
          if (currentTime > existingTime) {
            chat.unread_count += existingChat.unread_count;
            friendChatMap.set(friendId, chat);
          } else {
            existingChat.unread_count += chat.unread_count;
          }
        }
      }

      setChats(Array.from(friendChatMap.values()).sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        const aTime = a.last_message ? new Date(a.last_message.created_at).getTime() : 0;
        const bTime = b.last_message ? new Date(b.last_message.created_at).getTime() : 0;
        return bTime - aTime;
      }));
    } catch (err) {
      console.error('Error fetching chats:', err);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setChats([]);
      setLoading(false);
      return;
    }

    fetchChats();

    const channelId = `user-updates-${user.id}-${Date.now()}`;
    const channel = supabase.channel(channelId);

    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_participants',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          console.log('[useChats] Participant update detected');
          fetchChats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const newMessage = payload.new as any;
          console.log('[useChats] New global message for chat:', newMessage.chat_id);
          
          setChats(prev => {
            const chatIndex = prev.findIndex(c => c.id === newMessage.chat_id);
            if (chatIndex === -1) {
              // If we don't have the chat info cached, refetch list to be safe
              fetchChats();
              return prev;
            }

            const newChats = [...prev];
            const updatedChat = { ...newChats[chatIndex] };
            
            if (!updatedChat.last_message || new Date(newMessage.created_at) >= new Date(updatedChat.last_message.created_at)) {
              updatedChat.last_message = newMessage;
              if (newMessage.sender_id !== user.id) {
                updatedChat.unread_count = (updatedChat.unread_count || 0) + 1;
              }
              newChats.splice(chatIndex, 1);
              return [updatedChat, ...newChats];
            }
            return prev;
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload) => {
          const updatedProfile = payload.new as any;
          setChats(prev => prev.map(chat => ({
            ...chat,
            participants: chat.participants.map(p =>
              p.user_id === updatedProfile.id
                ? { ...p, profile: { ...p.profile, ...updatedProfile } }
                : p
            )
          })));
        }
      )
      .subscribe((status) => {
        console.log(`[useChats] Sidebar status: ${status}`);
      });

    return () => {
      console.log('[useChats] Cleaning up sidebar channel');
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchChats]);

  const createChat = useCallback(async (friendId: string) => {
    if (!user?.id) return { error: new Error('Not authenticated'), chatId: null };

    try {
      // Validate profiles exist
      const { data: initialProfile, error: currentUserError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      let currentUserProfile = initialProfile;

      if (currentUserError || !currentUserProfile) {
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
          if (createError.code === '23505') {
            const retry = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle();
            currentUserProfile = retry.data;
          } else {
            return { error: new Error('Failed to create your profile.'), chatId: null };
          }
        } else {
          currentUserProfile = { id: user.id };
        }
      }

      if (!currentUserProfile) {
        return { error: new Error('Your profile does not exist.'), chatId: null };
      }

      const { data: friendProfile, error: friendError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', friendId)
        .maybeSingle();

      if (friendError || !friendProfile) {
        return { error: new Error('User profile not found.'), chatId: null };
      }

      // Check if chat already exists
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
          return { error: null, chatId: friendChats[0].chat_id };
        }
      }

      const newChatId = crypto.randomUUID();

      // Create chat
      const { error: chatError } = await supabase.from('chats').insert({ id: newChatId });
      if (chatError) return { error: chatError as Error, chatId: null };

      // Add participants
      const { error: selfParticipantError } = await supabase
        .from('chat_participants')
        .insert({ chat_id: newChatId, user_id: user.id });

      if (selfParticipantError) {
        await supabase.from('chats').delete().eq('id', newChatId);
        return { error: selfParticipantError as Error, chatId: null };
      }

      const { error: friendParticipantError } = await supabase
        .from('chat_participants')
        .insert({ chat_id: newChatId, user_id: friendId });

      if (friendParticipantError) {
        await supabase.from('chat_participants').delete().eq('chat_id', newChatId);
        await supabase.from('chats').delete().eq('id', newChatId);
        return { error: friendParticipantError as Error, chatId: null };
      }

      return { error: null, chatId: newChatId };
    } catch (err) {
      console.error('Unexpected error creating chat:', err);
      return { error: new Error(err instanceof Error ? err.message : 'Failed to create chat'), chatId: null };
    }
  }, [user?.id, user?.email]);

  const toggleChatPin = useCallback(async (chatId: string, currentlyPinned: boolean) => {
    if (!user?.id) return { error: new Error('Not authenticated') };

    try {
      const { error } = await supabase
        .from('chat_participants')
        .update({ is_pinned: !currentlyPinned })
        .eq('chat_id', chatId)
        .eq('user_id', user.id);

      if (error) throw error;
      return { error: null };
    } catch (err) {
      console.error('Unexpected error toggling chat pin:', err);
      return { error: new Error(err instanceof Error ? err.message : 'Failed to update pin state') };
    }
  }, [user?.id]);

  return { chats, loading, createChat, toggleChatPin };
}

export function useMessages(chatId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const lastFetchedChatId = useRef<string | null>(null);
  const messageLimiter = useRef(SecurityUtils.createRateLimiter(5, 3000));
  const MESSAGES_PER_PAGE = 50;

  const markMessagesAsSeen = useCallback(async (messageIds: string[]) => {
    const realIds = messageIds.filter(id => id && id.length > 20 && !id.startsWith('optimistic-'));
    if (!user || realIds.length === 0) return;

    try {
      const { error } = await supabase
        .from('messages')
        .update({
          status: 'seen',
          seen_at: new Date().toISOString(),
          is_read: true // Backward compatibility
        })
        .in('id', realIds)
        .neq('status', 'seen'); // Only update those not already seen

      if (error) {
        console.warn('[useMessages] Supabase error in markMessagesAsSeen:', error.message);
      }

      // Also reset unread_count for this user in this chat
      if (chatId) {
        await supabase
          .from('chat_participants')
          .update({ unread_count: 0 })
          .eq('chat_id', chatId)
          .eq('user_id', user.id);
      }
    } catch (err) {
      console.error('[useMessages] Unexpected error in markMessagesAsSeen:', err);
    }
  }, [user, chatId]);

  // 1. STABLE INITIAL FETCH
  useEffect(() => {
    if (!user?.id || !chatId || lastFetchedChatId.current === chatId) return;

    let isMounted = true;
    lastFetchedChatId.current = chatId;
    setLoading(true);

    const fetchInitial = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', chatId)
          .order('created_at', { ascending: false })
          .range(0, MESSAGES_PER_PAGE - 1);

        if (!isMounted) return;
        if (fetchError) throw fetchError;

        const fetchedMessages = data ? (data as MessageData[]).reverse() : [];
        setMessages(fetchedMessages);
        setHasMore(data ? data.length === MESSAGES_PER_PAGE : false);
        setError(null);
      } catch (err) {
        console.error('[useMessages] Fetch error:', err);
        setError(err instanceof Error ? err : new Error('Failed to load messages'));
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchInitial();
    return () => { isMounted = false; };
  }, [user?.id, chatId]);

  // 2. STABLE REAL-TIME SUBSCRIPTION
  useEffect(() => {
    if (!user?.id || !chatId) return;

    const channelId = `chat_msg_${chatId}_${Date.now()}`;
    const channel = supabase.channel(channelId);

    console.log(`[useMessages] Connecting to: ${channelId}`);

    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          console.log('[useMessages] Event received:', payload.eventType);
          if (payload.eventType === 'INSERT') {
            const newMessage = payload.new as MessageData;
            const isOwnMessage = newMessage.sender_id === user?.id;

            setMessages(prev => {
              const exists = prev.some(m => m.id === newMessage.id);
              if (exists) return prev;

              // Check for optimistic duplicate by content & time
              const isOptimisticDup = prev.find(m => 
                m.id.startsWith('optimistic-') && 
                m.content === newMessage.content &&
                m.sender_id === newMessage.sender_id
              );

              if (isOptimisticDup) {
                return prev.map(m => m.id === isOptimisticDup.id ? { ...newMessage, status: 'sent' } : m);
              }

              return [...prev, { ...newMessage, status: 'sent' }];
            });

            if (!isOwnMessage && user?.id) {
              supabase.from('chat_participants')
                .update({ unread_count: 0 })
                .eq('chat_id', chatId)
                .eq('user_id', user.id)
                .then();
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as MessageData;
            setMessages(prev => prev.map(m => m.id === updated.id ? { ...updated } : m));
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as { id: string }).id;
            setMessages(prev => prev.filter(m => m.id !== deletedId));
          }
        }
      )
      .subscribe((status) => {
        console.log(`[useMessages] Status: ${status}`);
        if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          console.error('[useMessages] Channel disconnected, retrying...');
          // Optional: implement manual retry logic here if needed
        }
      });

    return () => {
      console.log(`[useMessages] Disconnecting: ${channelId}`);
      supabase.removeChannel(channel);
    };
  }, [user?.id, chatId]);

  const loadMoreMessages = useCallback(async () => {
    if (loadingMore || !hasMore || !chatId || !user?.id) return;

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
      setError(err instanceof Error ? err : new Error('Failed to load more messages'));
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, chatId, user?.id, messages.length]);

  const retryFetch = useCallback(() => {
    if (!chatId || !user?.id) return;
    setError(null);
    setLoading(true);
    setMessages([]);
    setHasMore(true);
    lastFetchedChatId.current = null; // Force initial fetch effect to re-run
  }, [chatId, user?.id]);

  const uploadImage = async (file: File): Promise<{ url: string; metadata: Record<string, unknown> } | null> => {
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
      const imageMetadata: Record<string, unknown> = {
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

  const uploadMedia = useCallback(async (
    file: File,
    type: 'image' | 'video' | 'file' | 'audio'
  ): Promise<{ url: string; metadata: Record<string, unknown>; mediaType: string } | null> => {
    if (!user?.id) return null;
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const bucket = type === 'image' ? 'chat-images' : 'chat-media';
      const filePath = `${user.id}/${fileName}`;

      let uploadFile = file;
      if (type === 'image' && file.size > 1024 * 1024) { // Compress if > 1MB
        try {
          uploadFile = await compressImage(file);
        } catch (e) {
          console.warn('Compression failed, using original file', e);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, uploadFile, {
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

      const metadata: Record<string, unknown> = {
        name: file.name,
        size: file.size,
        type: file.type
      };

      if (type === 'image' && file.type.startsWith('image/')) {
        try {
          const dimensions = await getImageDimensions(file);
          metadata.width = dimensions.width;
          metadata.height = dimensions.height;
        } catch (e) { /* ignore */ }
      }

      return {
        url: publicUrl,
        metadata,
        mediaType: type
      };
    } catch (error) {
      console.error(`Error in uploadMedia (${type}):`, error);
      return null;
    }
  }, [user?.id]);

  const sendMessage = useCallback(async (
    content: string,
    isEphemeral = false,
    replyToId: string | null = null,
    mediaFile?: File,
    mediaType: 'image' | 'video' | 'file' | 'audio' = 'image'
  ) => {
    if (!user?.id || !chatId) return { error: new Error('Not authenticated or no chat') };

    if (!content.trim() && !mediaFile) {
      return { error: new Error('Message content or media is required') };
    }

    if (!messageLimiter.current('send_message')) {
      return { error: new Error('Rate limit exceeded. Please wait a moment.') };
    }

    const safeContent = sanitizeText(content.trim() || '');

    const optimisticId = `optimistic-${Date.now()}`;
    let localPreviewUrl: string | null = null;
    if (mediaFile && (mediaType === 'image' || mediaType === 'video')) {
      localPreviewUrl = URL.createObjectURL(mediaFile);
    }

    const optimisticMessage: MessageData = {
      id: optimisticId,
      chat_id: chatId,
      sender_id: user.id,
      content: safeContent,
      message_type: mediaFile ? mediaType : 'text',
      is_ephemeral: isEphemeral,
      is_read: false,
      created_at: new Date().toISOString(),
      reply_to_id: replyToId,
      edited_at: null,
      local_preview_url: localPreviewUrl,
      status: 'sending'
    };

    setMessages(prev => [...prev, optimisticMessage]);

    let imageUrl: string | null = null;
    let imageMetadata: Record<string, unknown> | null = null;
    let fileUrl: string | null = null;
    let fileMetadata: Record<string, unknown> | null = null;
    let videoUrl: string | null = null;
    let videoMetadata: Record<string, unknown> | null = null;
    let messageType: string = mediaFile ? mediaType : 'text';

    if (mediaFile) {
      try {
        const uploadResult = await uploadMedia(mediaFile, mediaType);
        if (!uploadResult) {
          setMessages(prev => prev.filter(m => m.id !== optimisticId));
          if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
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
        if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
        return { error: new Error(`Failed to upload ${mediaType}: ${error instanceof Error ? error.message : 'Unknown error'}`) };
      }
    }

    const expiresAt = isEphemeral ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null;

    try {
      const insertData: Record<string, unknown> = {
        chat_id: chatId,
        sender_id: user.id,
        content: safeContent,
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
        if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
        return { error: error as Error };
      }

      // Cleanup preview URL before replacing state
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);

      setMessages(prev => prev.map(m =>
        m.id === optimisticId ? { ...data as MessageData, status: 'sent' } : m
      ));
      return { error: null, data };
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== optimisticId));
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
      return { error: err as Error };
    }
  }, [user?.id, chatId, uploadMedia]);

  const deleteMessage = useCallback(async (messageId: string) => {
    if (!user?.id) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)
      .eq('sender_id', user.id);

    return { error };
  }, [user?.id]);

  const editMessage = useCallback(async (messageId: string, newContent: string) => {
    if (!user?.id) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('messages')
      .update({
        content: newContent,
        edited_at: new Date().toISOString()
      })
      .eq('id', messageId)
      .eq('sender_id', user.id);

    return { error };
  }, [user?.id]);

  const saveMessage = useCallback(async (messageId: string) => {
    if (!user?.id) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('messages')
      .update({
        is_ephemeral: false,
        expires_at: null
      })
      .eq('id', messageId);

    return { error };
  }, [user?.id]);

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
    markMessagesAsSeen,
    uploadMedia
  };
}
