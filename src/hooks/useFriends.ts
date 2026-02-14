import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';

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
        .eq('user_id', user.id);

      const { data: receivedFriends, error: receivedError } = await supabase
        .from('friends')
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
        .eq('friend_id', user.id);

      if (sentError || receivedError) {
        console.error('Error fetching friends:', sentError || receivedError);
        setLoading(false);
        return;
      }

      const allFriends: FriendData[] = [];
      const allRequests: FriendData[] = [];
      const allBlocked: FriendData[] = [];

      // Process sent friendships
      sentFriends?.forEach(f => {
        // Handle case where profiles might be an array or single object
        const profile = Array.isArray(f.profiles) ? f.profiles[0] : f.profiles;
        if (!profile) return; // Skip if no profile found

        const profileData = profile as any;
        // Add cache busting to avatar URL if it exists and doesn't already have a timestamp
        if (profileData.avatar_url && !profileData.avatar_url.includes('?t=')) {
          profileData.avatar_url = `${profileData.avatar_url}?t=${Date.now()}`;
        }

        const friendData: FriendData = {
          id: f.id,
          user_id: f.user_id,
          friend_id: f.friend_id,
          status: f.status as any,
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
        // Handle case where profiles might be an array or single object
        const profile = Array.isArray(f.profiles) ? f.profiles[0] : f.profiles;
        if (!profile) return; // Skip if no profile found

        const profileData = profile as any;
        // Add cache busting to avatar URL if it exists and doesn't already have a timestamp
        if (profileData.avatar_url && !profileData.avatar_url.includes('?t=')) {
          profileData.avatar_url = `${profileData.avatar_url}?t=${Date.now()}`;
        }

        const friendData: FriendData = {
          id: f.id,
          user_id: f.user_id,
          friend_id: f.friend_id,
          status: f.status as any,
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
      setLoading(false);
    };

    fetchFriends();

    // Subscribe to realtime updates
    channel = supabase
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
  }, [user]);

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
            return { error: new Error('Failed to create your profile. Please try again or contact support.') };
          }
        } else {
          // Profile created, set it
          currentUserProfile = { id: user.id };
        }
      }

      if (currentUserError || !currentUserProfile) {
        return { error: new Error('Your profile does not exist. Please contact support.') };
      }

      const { data: friendProfile, error: friendError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', friendId)
        .maybeSingle();

      if (friendError || !friendProfile) {
        return { error: new Error('User profile not found. The user may not exist.') };
      }

      // Check if friendship already exists
      const { data: existing, error: existingError } = await supabase
        .from('friends')
        .select('id, status')
        .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)
        .maybeSingle();

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
      }

      const { error } = await supabase
        .from('friends')
        .insert({
          user_id: user.id,
          friend_id: friendId,
          status: 'pending'
        });

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
    }
  };

  const acceptRequest = async (friendshipId: string) => {
    if (!user) return { error: new Error('Not authenticated') };

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
    }
  };

  const declineRequest = async (friendshipId: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { error } = await supabase
        .from('friends')
        .update({ status: 'declined' })
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
  };

  const blockUser = async (friendId: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { error } = await supabase
        .from('blocked_users')
        .insert({
          blocker_id: user.id,
          blocked_id: friendId,
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
    removeFriend,
    unblockFriend,
    blockUser,
  };
}

export function useSearchUsers(query: string) {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
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
        .select('id, username, avatar_url, is_online, presence_status, is_stealth_mode, subscription_tier, last_seen')
        .neq('id', user.id)
        .ilike('username', `%${query}%`)
        .limit(10);

      if (!error && data) {
        setUsers(data);
      }
      setLoading(false);
    };

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [user, query]);

  return { users, loading };
}
