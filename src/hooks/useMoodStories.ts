import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MoodStatus, getMoodById } from '@/types/mood';
import { StoryUploadData } from '@/components/story/StoryUploadOverlay';

export interface Story {
  id: string;
  user_id: string;
  type: 'image' | 'video' | 'text';
  content: string;
  caption?: string;
  created_at: string;
  expires_at: string;
  view_count: number;
  viewers: string[];
}

export interface UserMoodStory {
  mood?: MoodStatus;
  story?: Story;
  hasStory: boolean;
}

export function useMoodStories(userId?: string) {
  const [currentMood, setCurrentMood] = useState<MoodStatus | null>(null);
  const [userStory, setUserStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showMenu, setShowMenu] = useState(false);
  const [showStoryUpload, setShowStoryUpload] = useState(false);

  // Fetch user's current mood and story
  const fetchUserMoodStory = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);

      // Fetch current mood from profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('mood_status')
        .eq('id', userId)
        .single();

      if (profile?.mood_status) {
        const mood = getMoodById(profile.mood_status);
        setCurrentMood(mood || null);
      }

      // Fetch active story
      const now = new Date().toISOString();
      const { data: story } = await supabase
        .from('stories')
        .select('*')
        .eq('user_id', userId)
        .gte('expires_at', now)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      setUserStory(story);
    } catch (error) {
      console.error('Error fetching mood/story:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Update user mood
  const updateMood = useCallback(async (mood: MoodStatus) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          mood_status: mood.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      setCurrentMood(mood);
      
      // Broadcast mood change for real-time updates
      const channel = supabase.channel('mood_updates');
      await channel.send({
        type: 'broadcast',
        event: 'mood_changed',
        payload: {
          user_id: userId,
          mood: mood
        }
      });
    } catch (error) {
      console.error('Error updating mood:', error);
    }
  }, [userId]);

  // Upload story
  const uploadStory = useCallback(async (storyData: StoryUploadData) => {
    if (!userId) return;

    try {
      setLoading(true);
      let contentUrl = '';

      if (storyData.type !== 'text') {
        // Upload file to storage
        const file = storyData.content as File;
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('stories')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('stories')
          .getPublicUrl(fileName);

        contentUrl = publicUrl;
      } else {
        contentUrl = storyData.content as string;
      }

      // Create story record
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + storyData.duration);

      const { error: insertError } = await supabase
        .from('stories')
        .insert({
          user_id: userId,
          type: storyData.type,
          content: contentUrl,
          caption: storyData.caption,
          expires_at: expiresAt.toISOString(),
          view_count: 0,
          viewers: []
        });

      if (insertError) throw insertError;

      // Refresh user story
      await fetchUserMoodStory();
      
      // Broadcast story update
      const channel = supabase.channel('story_updates');
      await channel.send({
        type: 'broadcast',
        event: 'story_added',
        payload: {
          user_id: userId,
          has_story: true
        }
      });
    } catch (error) {
      console.error('Error uploading story:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, fetchUserMoodStory]);

  // Show cursor menu at position
  const showMoodMenu = useCallback((x: number, y: number) => {
    setMenuPosition({ x, y });
    setShowMenu(true);
  }, []);

  // Handle mood selection
  const handleMoodSelect = useCallback((mood: MoodStatus) => {
    updateMood(mood);
    setShowMenu(false);
  }, [updateMood]);

  // Handle story upload
  const handleStoryUpload = useCallback((storyData: StoryUploadData) => {
    uploadStory(storyData);
    setShowStoryUpload(false);
  }, [uploadStory]);

  // Close menu
  const closeMoodMenu = useCallback(() => {
    setShowMenu(false);
  }, []);

  // Real-time subscriptions
  useEffect(() => {
    if (!userId) return;

    // Listen for mood changes
    const moodChannel = supabase
      .channel('mood_updates')
      .on('broadcast', { event: 'mood_changed' }, (payload: any) => {
        if (payload.payload.user_id === userId) {
          setCurrentMood(payload.payload.mood);
        }
      })
      .subscribe();

    // Listen for story updates
    const storyChannel = supabase
      .channel('story_updates')
      .on('broadcast', { event: 'story_added' }, (payload: any) => {
        if (payload.payload.user_id === userId) {
          fetchUserMoodStory();
        }
      })
      .subscribe();

    return () => {
      moodChannel.unsubscribe();
      storyChannel.unsubscribe();
    };
  }, [userId, fetchUserMoodStory]);

  // Initial fetch
  useEffect(() => {
    fetchUserMoodStory();
  }, [fetchUserMoodStory]);

  return {
    currentMood,
    userStory,
    loading,
    showMenu,
    showStoryUpload,
    menuPosition,
    showMoodMenu,
    closeMoodMenu,
    handleMoodSelect,
    handleStoryUpload,
    setShowStoryUpload,
    updateMood,
    uploadStory,
    hasStory: !!userStory
  };
}
