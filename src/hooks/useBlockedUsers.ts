import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface BlockedUser {
  id: string;
  username: string;
  avatar_url: string;
  created_at: string;
}

export function useBlockedUsers() {
  const { user } = useAuth();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);

  const fetchBlockedUsers = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('blocked_users')
        .select(`
          blocker_id,
          blocked_id,
          created_at,
          profiles!blocked_users_blocked_id_fkey (
            id,
            username,
            avatar_url
          )
        `)
        .eq('blocker_id', user.id);

      if (error) throw error;

      const blockedUsersData = (data || []).map(blocked => ({
        id: blocked.blocked_id,
        username: blocked.profiles?.username || 'Unknown User',
        avatar_url: blocked.profiles?.avatar_url || '',
        created_at: blocked.created_at
      }));

      setBlockedUsers(blockedUsersData);
    } catch (error) {
      console.error('Error fetching blocked users:', error);
    }
  };

  const blockUser = async (blockedId: string) => {
    if (!user?.id) return { error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('blocked_users')
        .insert({
          blocker_id: user.id,
          blocked_id: blockedId,
          created_at: new Date().toISOString(),
        });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error blocking user:', error);
      return { error: error.message };
    }
  };

  const unblockUser = async (blockedId: string) => {
    if (!user?.id) return { error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('blocker_id', user.id)
        .eq('blocked_id', blockedId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error unblocking user:', error);
      return { error: error.message };
    }
  };

  // Fetch blocked users on component mount
  useEffect(() => {
    fetchBlockedUsers();
  }, [user?.id]);

  return {
    blockedUsers,
    blockUser,
    unblockUser,
    fetchBlockedUsers,
  };
}
