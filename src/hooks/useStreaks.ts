import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  streakHistory: StreakDay[];
  isStreakActive: boolean;
  nextDayReset: string | null;
}

interface StreakDay {
  date: string;
  messageCount: number;
  isActive: boolean;
}

/**
 * Hook for managing chat streaks
 * Awards daily streaks for meaningful chat activity
 */
export function useStreaks() {
  const { user, profile } = useAuth();
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: null,
    streakHistory: [],
    isStreakActive: false,
    nextDayReset: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load streak data on mount
  useEffect(() => {
    if (user?.id) {
      fetchStreakData();
    }
  }, [user?.id]);

  // Update streak when user is active
  const updateStreak = async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          last_opened_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      // Refresh streak data
      await fetchStreakData();
    } catch (err) {
      console.error('Error updating streak:', err);
    }
  };

  // Increment app open count
  const incrementAppOpenCount = async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase.rpc('increment_app_open_count', {
        user_uuid: user.id
      });

      if (error) throw error;
    } catch (err) {
      console.error('Error incrementing app open count:', err);
    }
  };

  const fetchStreakData = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      // Get streak data from profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('streak_count, last_seen, total_session_time, last_session_start, app_open_count, last_opened_at')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      const currentStreak = profileData.streak_count || 0;
      const lastActiveDate = profileData.last_opened_at;
      
      // Calculate if streak is active
      const now = new Date();
      const lastActive = lastActiveDate ? new Date(lastActiveDate) : null;
      const daysDiff = lastActive ? Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)) : Infinity;
      const isStreakActive = daysDiff <= 1;

      // Calculate next day reset time
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const nextDayReset = tomorrow.toISOString();

      setStreakData(prev => ({
        ...prev,
        currentStreak,
        longestStreak: Math.max(currentStreak, prev.longestStreak),
        lastActiveDate,
        isStreakActive,
        nextDayReset,
      }));

      // Fetch streak history
      await fetchStreakHistory();
    } catch (err) {
      console.error('Error fetching streak data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load streak data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStreakHistory = async () => {
    if (!user?.id) return;

    try {
      // Get message activity for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('created_at')
        .eq('sender_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      // Group messages by date
      const messagesByDate: Record<string, number> = {};
      (messages || []).forEach(message => {
        const date = new Date(message.created_at).toDateString();
        messagesByDate[date] = (messagesByDate[date] || 0) + 1;
      });

      // Create streak history
      const streakHistory: StreakDay[] = [];
      const now = new Date();

      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toDateString();
        const messageCount = messagesByDate[dateStr] || 0;
        const isActive = messageCount > 0;

        streakHistory.push({
          date: date.toISOString(),
          messageCount,
          isActive,
        });
      }

      setStreakData(prev => ({
        ...prev,
        streakHistory,
      }));
    } catch (err) {
      console.error('Error fetching streak history:', err);
    }
  };

  const incrementStreak = async (messageContent: string): Promise<void> => {
    if (!user?.id) return;

    // Validate message is meaningful (not empty, not just spam)
    if (!messageContent || messageContent.trim().length < 1) {
      return;
    }

    // Check if it's spam (repeated characters, etc.)
    const trimmedContent = messageContent.trim();
    if (trimmedContent.length > 100) {
      const uniqueChars = new Set(trimmedContent).size;
      if (uniqueChars < trimmedContent.length * 0.3) {
        return; // Likely spam
      }
    }

    try {
      const today = new Date().toDateString();
      const lastActive = streakData.lastActiveDate ? new Date(streakData.lastActiveDate) : null;
      const lastActiveDateStr = lastActive?.toDateString();

      let newStreak = streakData.currentStreak;

      // Check if this is a new day
      if (lastActiveDateStr !== today) {
        // Check if streak is still active (yesterday)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        if (lastActiveDateStr === yesterdayStr) {
          // Continue streak
          newStreak += 1;
        } else if (lastActiveDateStr === today) {
          // Same day, don't increment
          return;
        } else {
          // Streak broken, start new one
          newStreak = 1;
        }
      }

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          streak_count: newStreak,
          last_seen: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update local state
      setStreakData(prev => ({
        ...prev,
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, prev.longestStreak),
        lastActiveDate: new Date().toISOString(),
        isStreakActive: true,
      }));

      // Show celebration for milestones
      if (newStreak > 0 && [7, 30, 100, 365].includes(newStreak)) {
        celebrateStreakMilestone(newStreak);
      }
    } catch (err) {
      console.error('Error incrementing streak:', err);
      setError(err instanceof Error ? err.message : 'Failed to update streak');
    }
  };

  const resetStreak = async (): Promise<void> => {
    if (!user?.id) return;

    try {
      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          streak_count: 0,
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update local state
      setStreakData(prev => ({
        ...prev,
        currentStreak: 0,
        isStreakActive: false,
      }));
    } catch (err) {
      console.error('Error resetting streak:', err);
    }
  };

  const celebrateStreakMilestone = (streak: number) => {
    // Create celebration animation or notification
    const messages = {
      7: '🔥 One week streak!',
      30: '🔥🔥 One month streak!',
      100: '🔥🔥🔥 100 days streak!',
      365: '🔥🔥🔥🔥 One year streak!',
    };

    const message = messages[streak as keyof typeof messages] || `🔥 ${streak} day streak!`;

    // You could integrate with your toast system here
    console.log(message);

    // Or trigger a celebration animation
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('streakMilestone', { detail: { streak, message } }));
    }
  };

  const getStreakEmoji = (streak: number): string => {
    const emojis = ['🔥', '⚡', '💫', '🌟', '✨', '🎯', '🏆', '👑', '🌈', '💎'];
    if (streak === 0) return '�';
    if (streak < 3) return emojis[0];
    if (streak < 7) return emojis[1];
    if (streak < 14) return emojis[2];
    if (streak < 30) return emojis[3];
    if (streak < 60) return emojis[4];
    if (streak < 100) return emojis[5];
    if (streak < 200) return emojis[6];
    if (streak < 365) return emojis[7];
    return emojis[8];
  };

  const getStreakColor = (streak: number): string => {
    if (streak === 0) return 'text-muted-foreground';
    if (streak < 3) return 'text-orange-500';
    if (streak < 7) return 'text-red-500';
    if (streak < 14) return 'text-purple-500';
    if (streak < 30) return 'text-blue-500';
    if (streak < 60) return 'text-green-500';
    if (streak < 100) return 'text-yellow-500';
    return 'text-pink-500';
  };

  const getTimeUntilReset = (): string => {
    if (!streakData.nextDayReset) return 'Unknown';
    
    const now = new Date();
    const resetTime = new Date(streakData.nextDayReset);
    const diffMs = resetTime.getTime() - now.getTime();

    if (diffMs <= 0) return 'Soon';

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return {
    streakData,
    loading,
    error,
    updateStreak,
    incrementAppOpenCount,
    incrementStreak,
    fetchStreakData,
    getStreakEmoji,
    getStreakColor,
    getTimeUntilReset,
  };
}
