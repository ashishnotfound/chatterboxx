import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { getUserFriendlyError } from '@/utils/errors';

export interface FriendData {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  streak_count: number;
  profile: {
    id: string;
    username: string;
    avatar_url: string | null;
    is_online: boolean;
    presence_status: 'online' | 'idle' | 'dnd' | 'invisible';
    is_stealth_mode: boolean;
    subscription_tier: 'free' | 'pro';
    last_seen: string | null;
  };
}

export function useFriends() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<FriendData[]>([]);
  const [requests, setRequests] = useState<FriendData[]>([]);
  const [blocked, setBlocked] = useState<FriendData[]>([]);
  const [loading, setLoading] = useState(true);
  const isFetchingRef = useRef(false);

  const fetchFriends = useCallback(async () => {
    if (!user?.id) return;
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;
    setLoading(true);

    try {
      // Fetch friendships where user is either user_id or friend_id
      const { data: sentFriends, error: sentError } = await supabase
        .from('friends')
        .select(`*, profiles!friends_friend_id_fkey (*)`)
        .eq('user_id', user.id);

      const { data: receivedFriends, error: receivedError } = await supabase
        .from('friends')
        .select(`*, profiles!friends_user_id_fkey (*)`)
        .eq('friend_id', user.id);

      if (sentError || receivedError) {
        console.error('Error fetching friends:', sentError || receivedError);
        return;
      }

      const allFriends: FriendData[] = [];
      const allRequests: FriendData[] = [];
      const allBlocked: FriendData[] = [];

      // Process sent friendships
      sentFriends?.forEach(f => {
        const profile = Array.isArray(f.profiles) ? f.profiles[0] : f.profiles;
        if (!profile) return;

        const profileData = profile as FriendData['profile'];
        if (profileData.avatar_url && !profileData.avatar_url.includes('?t=')) {
          profileData.avatar_url = `${profileData.avatar_url}?t=${Date.now()}`;
        }

        const friendData: FriendData = {
          id: f.id,
          user_id: f.user_id,
          friend_id: f.friend_id,
          status: f.status as FriendData['status'],
          streak_count: f.streak_count,
          profile: profileData
        };

        if (f.status === 'accepted') {
          allFriends.push(friendData);
        } else if (f.status === 'blocked') {
          allBlocked.push(friendData);
        }
      });

      // Process received friendships
      receivedFriends?.forEach(f => {
        const profile = Array.isArray(f.profiles) ? f.profiles[0] : f.profiles;
        if (!profile) return;

        const profileData = profile as FriendData['profile'];
        if (profileData.avatar_url && !profileData.avatar_url.includes('?t=')) {
          profileData.avatar_url = `${profileData.avatar_url}?t=${Date.now()}`;
        }

        const friendData: FriendData = {
          id: f.id,
          user_id: f.user_id,
          friend_id: f.friend_id,
          status: f.status as FriendData['status'],
          streak_count: f.streak_count,
          profile: profileData
        };

        if (f.status === 'accepted') {
          allFriends.push(friendData);
        } else if (f.status === 'pending') {
          allRequests.push(friendData);
        } else if (f.status === 'blocked') {
          allBlocked.push(friendData);
        }
      });

      setFriends(allFriends);
      setRequests(allRequests);
      setBlocked(allBlocked);
    } catch (err) {
      console.error('Error in fetchFriends:', err);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setFriends([]);
      setRequests([]);
      setLoading(false);
      return;
    }

    fetchFriends();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('friends-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'friends' },
        () => fetchFriends()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => fetchFriends()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchFriends]);


  const sendFriendRequest = async (friendId: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      // Check if user is trying to friend someone they've blocked
      const { data: blockedCheck, error: blockedCheckError } = await supabase
        .from('blocked_users')
        .select('blocked_id')
        .eq('blocker_id', user.id)
        .eq('blocked_id', friendId)
        .maybeSingle();

      if (blockedCheckError) {
        console.error('Error checking blocked status:', blockedCheckError);
      }

      if (blockedCheck) {
        return { error: new Error('Cannot send friend request to a blocked user') };
      }

      // Validate that both users have profiles
      const { data: profileCheck, error: currentUserError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      let currentUserProfile = profileCheck;

      if (currentUserError || !currentUserProfile) {
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
          if (createError.code === '23505') {
            const retry = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle();
            currentUserProfile = retry.data;
          } else {
            return { error: new Error('Failed to create your profile.') };
          }
        } else {
          currentUserProfile = { id: user.id };
        }
      }

      const { data: friendProfile, error: friendError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', friendId)
        .maybeSingle();

      if (friendError || !friendProfile) {
        return { error: new Error('User profile not found.') };
      }

      const { data: existing } = await supabase
        .from('friends')
        .select('id, status')
        .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)
        .maybeSingle();

      if (existing) {
        if (existing.status === 'accepted') return { error: new Error('Already friends') };
        if (existing.status === 'pending') return { error: new Error('Request already pending') };
      }

      const { error } = await supabase
        .from('friends')
        .insert({
          user_id: user.id,
          friend_id: friendId,
          status: 'pending'
        });

      if (error) return { error };

      return { error: null };
    } catch (err) {
      return { error: new Error('Failed to send friend request') };
    }
  };

  const acceptRequest = async (friendshipId: string) => {
    if (!user) return { error: new Error('Not authenticated') };
    
    console.log('Accepting friendship:', friendshipId);
    try {
      // 1. Fetch the request
      const { data: request, error: fetchError } = await supabase
        .from('friends')
        .select('*')
        .eq('id', friendshipId)
        .maybeSingle();

      if (fetchError) {
        console.error('Fetch request error:', fetchError);
        throw fetchError;
      }
      
      if (!request) {
        throw new Error('Friend request not found or already processed');
      }

      if (request.status === 'accepted') {
        return { error: null }; // Already done
      }

      const senderId = request.user_id;

      // 2. Update the status
      const { error: updateError } = await supabase
        .from('friends')
        .update({ status: 'accepted' })
        .eq('id', friendshipId);

      if (updateError) {
        console.error('Update status error:', updateError);
        throw updateError;
      }

      // 3. Create a chat if it doesn't exist
      const { data: participantData, error: pFetchError } = await supabase
        .from('chat_participants')
        .select('*')
        .eq('user_id', user.id);
      
      if (pFetchError) console.warn('Could not fetch existing chats:', pFetchError);
      
      let chatAlreadyExists = false;

      if (participantData && participantData.length > 0) {
        const chatIds = participantData.map(p => p.chat_id);
        const { data: friendParticipant, error: fFetchError } = await supabase
          .from('chat_participants')
          .select('*')
          .eq('user_id', senderId)
          .in('chat_id', chatIds)
          .maybeSingle();
        
        if (fFetchError) console.warn('Could not check friend participation:', fFetchError);
        if (friendParticipant) chatAlreadyExists = true;
      }

      if (!chatAlreadyExists) {
        // Create new chat
        console.log('Creating new chat for friendship...');
        const { data: newChat, error: chatError } = await supabase
          .from('chats')
          .insert({ 
            is_group: false,
            created_by: user.id 
          })
          .select()
          .single();
        
        if (chatError) {
          console.error('Chat creation error:', chatError);
          toast.error('Friend added, but failed to create chat room');
        } else if (!newChat) {
          console.error('Chat creation succeeded but no data returned');
          toast.error('Friend added, but chat room initialization failed');
        } else {
          console.log('Chat created successfully:', newChat.id);
          // Add yourself first - this is required by RLS to add others next
          console.log('Adding self as participant...');
          const { error: s1 } = await supabase
            .from('chat_participants')
            .insert({ chat_id: newChat.id, user_id: user.id });
          
          if (s1) {
            console.error('Error adding self to chat:', s1);
          } else {
            console.log('Self added successfully. Adding friend...');
            // Only add the friend if adding yourself succeeded
            const { error: s2 } = await supabase
              .from('chat_participants')
              .insert({ chat_id: newChat.id, user_id: senderId });
            
            if (s2) {
              console.error('Error adding friend to chat:', s2);
            } else {
              console.log('Friend added to chat successfully.');
            }
          }
        }
      }

      await fetchFriends();
      return { error: null };
    } catch (err: unknown) {
      console.error('Critical failure in acceptRequest:', err);
      // Ensure we get a string message
      const errorObject = err as { code?: string; message?: string };
      return { error: new Error(getUserFriendlyError(errorObject)) };
    }
  };

  const declineRequest = async (friendshipId: string) => {
    if (!user) return { error: new Error('Not authenticated') };
    
    try {
      const { error } = await supabase
        .from('friends')
        .update({ status: 'declined' })
        .eq('id', friendshipId);
      
      if (error) throw error;
      
      await fetchFriends();
      return { error: null };
    } catch (err) {
      console.error('Error declining friend request:', err);
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  const removeFriend = async (friendshipId: string) => {
    const { error } = await supabase
      .from('friends')
      .delete()
      .eq('id', friendshipId);
    return { error };
  };

  const unblockFriend = async (friendshipId: string) => {
    if (!user) return { error: new Error('Not authenticated') };
    const { error } = await supabase
      .from('friends')
      .update({ status: 'declined' })
      .eq('id', friendshipId);
    return { error };
  };

  const blockUser = async (friendId: string) => {
    if (!user) return { error: new Error('Not authenticated') };
    try {
      const { error } = await supabase
        .from('blocked_users')
        .insert({
          blocker_id: user.id,
          blocked_id: friendId,
        });
      if (error) return { error };
      await supabase
        .from('friends')
        .delete()
        .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`);
      return { error: null };
    } catch (err) {
      return { error: new Error('Failed to block user') };
    }
  };

  return {
    friends,
    requests,
    blocked,
    loading,
    sendFriendRequest,
    acceptRequest,
    declineRequest,
    removeFriend,
    unblockFriend,
    blockUser,
  };
}

export function useSearchUsers(query: string) {
  const { user } = useAuth();
  const [users, setUsers] = useState<Partial<FriendData['profile']>[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !query || query.length < 2) {
      setUsers([]);
      return;
    }

    const search = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)
        .ilike('username', `%${query}%`)
        .limit(10);

      if (!error && data) {
        setUsers(data as FriendData['profile'][]);
      }
      setLoading(false);
    };

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [user, query]);

  return { users, loading };
}
