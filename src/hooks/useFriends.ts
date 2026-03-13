<<<<<<< HEAD
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';
=======
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { getUserFriendlyError } from '@/utils/errors';
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)

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
<<<<<<< HEAD

  useEffect(() => {
    if (!user) {
      setFriends([]);
      setRequests([]);
      setLoading(false);
      return;
    }

    let channel: RealtimeChannel;

    const fetchFriends = async () => {
      // Fetch friendships where user is either user_id or friend_id
      const { data: sentFriends, error: sentError } = await supabase
        .from('friends')
        .select(`
          id,
          user_id,
          friend_id,
          status,
          streak_count,
          profiles!friends_friend_id_fkey (
            id,
            username,
            avatar_url,
            is_online,
            presence_status,
            is_stealth_mode,
            subscription_tier,
            last_seen
          )
        `)
=======
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
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
        .eq('user_id', user.id);

      const { data: receivedFriends, error: receivedError } = await supabase
        .from('friends')
<<<<<<< HEAD
        .select(`
          id,
          user_id,
          friend_id,
          status,
          streak_count,
          profiles!friends_user_id_fkey (
            id,
            username,
            avatar_url,
            is_online,
            presence_status,
            is_stealth_mode,
            subscription_tier,
            last_seen
          )
        `)
=======
        .select(`*, profiles!friends_user_id_fkey (*)`)
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
        .eq('friend_id', user.id);

      if (sentError || receivedError) {
        console.error('Error fetching friends:', sentError || receivedError);
<<<<<<< HEAD
        setLoading(false);
=======
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
        return;
      }

      const allFriends: FriendData[] = [];
      const allRequests: FriendData[] = [];
      const allBlocked: FriendData[] = [];

      // Process sent friendships
      sentFriends?.forEach(f => {
<<<<<<< HEAD
        // Handle case where profiles might be an array or single object
        const profile = Array.isArray(f.profiles) ? f.profiles[0] : f.profiles;
        if (!profile) return; // Skip if no profile found

        const profileData = profile as any;
        // Add cache busting to avatar URL if it exists and doesn't already have a timestamp
=======
        const profile = Array.isArray(f.profiles) ? f.profiles[0] : f.profiles;
        if (!profile) return;

        const profileData = profile as FriendData['profile'];
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
        if (profileData.avatar_url && !profileData.avatar_url.includes('?t=')) {
          profileData.avatar_url = `${profileData.avatar_url}?t=${Date.now()}`;
        }

        const friendData: FriendData = {
          id: f.id,
          user_id: f.user_id,
          friend_id: f.friend_id,
<<<<<<< HEAD
          status: f.status as any,
=======
          status: f.status as FriendData['status'],
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
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
<<<<<<< HEAD
        // Handle case where profiles might be an array or single object
        const profile = Array.isArray(f.profiles) ? f.profiles[0] : f.profiles;
        if (!profile) return; // Skip if no profile found

        const profileData = profile as any;
        // Add cache busting to avatar URL if it exists and doesn't already have a timestamp
=======
        const profile = Array.isArray(f.profiles) ? f.profiles[0] : f.profiles;
        if (!profile) return;

        const profileData = profile as FriendData['profile'];
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
        if (profileData.avatar_url && !profileData.avatar_url.includes('?t=')) {
          profileData.avatar_url = `${profileData.avatar_url}?t=${Date.now()}`;
        }

        const friendData: FriendData = {
          id: f.id,
          user_id: f.user_id,
          friend_id: f.friend_id,
<<<<<<< HEAD
          status: f.status as any,
=======
          status: f.status as FriendData['status'],
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
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
<<<<<<< HEAD
      setLoading(false);
    };
=======
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
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)

    fetchFriends();

    // Subscribe to realtime updates
<<<<<<< HEAD
    channel = supabase
=======
    const channel = supabase
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
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
<<<<<<< HEAD
  }, [user]);
=======
  }, [user?.id, fetchFriends]);

>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)

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

<<<<<<< HEAD
      // Validate that both users have profiles (required for foreign key constraint)
      // First, try to ensure current user's profile exists
      let { data: currentUserProfile, error: currentUserError } = await supabase
=======
      // Validate that both users have profiles
      const { data: profileCheck, error: currentUserError } = await supabase
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

<<<<<<< HEAD
      if (currentUserError || !currentUserProfile) {
        // Try to create the profile if it doesn't exist
        console.log('Current user profile not found, attempting to create...');
        const defaultUsername = user.email?.split('@')[0] || `user_${user.id.substring(0, 8)}`;
        const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`;
        
=======
      let currentUserProfile = profileCheck;

      if (currentUserError || !currentUserProfile) {
        console.log('Current user profile not found, attempting to create...');
        const defaultUsername = user.email?.split('@')[0] || `user_${user.id.substring(0, 8)}`;
        const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`;

>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
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
<<<<<<< HEAD
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
            return { error: new Error('Failed to create your profile. Please try again or contact support.') };
          }
        } else {
          // Profile created, set it
=======
          if (createError.code === '23505') {
            const retry = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle();
            currentUserProfile = retry.data;
          } else {
            return { error: new Error('Failed to create your profile.') };
          }
        } else {
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
          currentUserProfile = { id: user.id };
        }
      }

<<<<<<< HEAD
      if (currentUserError || !currentUserProfile) {
        return { error: new Error('Your profile does not exist. Please contact support.') };
      }

=======
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
      const { data: friendProfile, error: friendError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', friendId)
        .maybeSingle();

      if (friendError || !friendProfile) {
<<<<<<< HEAD
        return { error: new Error('User profile not found. The user may not exist.') };
      }

      // Check if friendship already exists
      const { data: existing, error: existingError } = await supabase
=======
        return { error: new Error('User profile not found.') };
      }

      const { data: existing } = await supabase
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
        .from('friends')
        .select('id, status')
        .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)
        .maybeSingle();

<<<<<<< HEAD
      if (existingError) {
        console.error('Error checking existing friendship:', existingError);
        // Continue anyway, as this might be a permission issue
      }

      if (existing) {
        if (existing.status === 'accepted') {
          return { error: new Error('Already friends') };
        } else if (existing.status === 'pending') {
          return { error: new Error('Friend request already sent or pending') };
        }
=======
      if (existing) {
        if (existing.status === 'accepted') return { error: new Error('Already friends') };
        if (existing.status === 'pending') return { error: new Error('Request already pending') };
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
      }

      const { error } = await supabase
        .from('friends')
        .insert({
          user_id: user.id,
          friend_id: friendId,
          status: 'pending'
        });

<<<<<<< HEAD
      if (error) {
        // Handle foreign key constraint violation
        if (error.code === '23503' || error.message?.includes('foreign key') || error.message?.includes('violates foreign key constraint')) {
          return { error: new Error('User profile not found. Please ensure both users have profiles.') };
        }
        // Handle duplicate key error
        if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
          return { error: new Error('Friend request already sent') };
        }
        console.error('Error inserting friend request:', error);
        return { error: error as Error };
      }

      return { error: null };
    } catch (err) {
      console.error('Error sending friend request:', err);
      return { error: new Error(err instanceof Error ? err.message : 'Failed to send friend request') };
=======
      if (error) return { error };

      return { error: null };
    } catch (err) {
      return { error: new Error('Failed to send friend request') };
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
    }
  };

  const acceptRequest = async (friendshipId: string) => {
    if (!user) return { error: new Error('Not authenticated') };
<<<<<<< HEAD

    try {
      const { error } = await supabase
        .from('friends')
        .update({ status: 'accepted' })
        .eq('id', friendshipId)
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`); // Only allow accepting requests where user is involved

      if (error) {
        console.error('Error accepting friend request:', error);
        return { error: error as Error };
      }

      return { error: null };
    } catch (err) {
      console.error('Unexpected error accepting friend request:', err);
      return { error: new Error(err instanceof Error ? err.message : 'Failed to accept friend request') };
=======
    
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
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
    }
  };

  const declineRequest = async (friendshipId: string) => {
    if (!user) return { error: new Error('Not authenticated') };
<<<<<<< HEAD

=======
    
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
    try {
      const { error } = await supabase
        .from('friends')
        .update({ status: 'declined' })
<<<<<<< HEAD
        .eq('id', friendshipId)
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`); // Only allow declining requests where user is involved

      if (error) {
        console.error('Error declining friend request:', error);
        return { error: error as Error };
      }

      return { error: null };
    } catch (err) {
      console.error('Unexpected error declining friend request:', err);
      return { error: new Error(err instanceof Error ? err.message : 'Failed to decline friend request') };
=======
        .eq('id', friendshipId);
      
      if (error) throw error;
      
      await fetchFriends();
      return { error: null };
    } catch (err) {
      console.error('Error declining friend request:', err);
      return { error: err instanceof Error ? err : new Error(String(err)) };
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
    }
  };

  const removeFriend = async (friendshipId: string) => {
    const { error } = await supabase
      .from('friends')
      .delete()
      .eq('id', friendshipId);
<<<<<<< HEAD

=======
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
    return { error };
  };

  const unblockFriend = async (friendshipId: string) => {
    if (!user) return { error: new Error('Not authenticated') };
<<<<<<< HEAD

    try {
      const { error } = await supabase
        .from('friends')
        .update({ status: 'declined' })
        .eq('id', friendshipId)
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

      if (error) {
        console.error('Error unblocking user:', error);
        return { error: error as Error };
      }

      return { error: null };
    } catch (err) {
      console.error('Unexpected error unblocking user:', err);
      return { error: new Error(err instanceof Error ? err.message : 'Failed to unblock user') };
    }
=======
    const { error } = await supabase
      .from('friends')
      .update({ status: 'declined' })
      .eq('id', friendshipId);
    return { error };
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
  };

  const blockUser = async (friendId: string) => {
    if (!user) return { error: new Error('Not authenticated') };
<<<<<<< HEAD

=======
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
    try {
      const { error } = await supabase
        .from('blocked_users')
        .insert({
          blocker_id: user.id,
          blocked_id: friendId,
<<<<<<< HEAD
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error blocking user:', error);
        return { error: error as Error };
      }

      // Also remove any existing friendship
      const { error: friendshipError } = await supabase
        .from('friends')
        .delete()
        .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`);

      if (friendshipError) {
        console.error('Error removing friendship after blocking:', friendshipError);
      }

      return { error: null };
    } catch (err) {
      console.error('Unexpected error blocking user:', err);
      return { error: new Error(err instanceof Error ? err.message : 'Failed to block user') };
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
=======
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
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
    removeFriend,
    unblockFriend,
    blockUser,
  };
}

export function useSearchUsers(query: string) {
  const { user } = useAuth();
<<<<<<< HEAD
  const [users, setUsers] = useState<any[]>([]);
=======
  const [users, setUsers] = useState<Partial<FriendData['profile']>[]>([]);
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
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
<<<<<<< HEAD
        .select('id, username, avatar_url, is_online, presence_status, is_stealth_mode, subscription_tier, last_seen')
=======
        .select('*')
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
        .neq('id', user.id)
        .ilike('username', `%${query}%`)
        .limit(10);

      if (!error && data) {
<<<<<<< HEAD
        setUsers(data);
=======
        setUsers(data as FriendData['profile'][]);
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
      }
      setLoading(false);
    };

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [user, query]);

  return { users, loading };
}
