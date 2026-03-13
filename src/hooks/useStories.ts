<<<<<<< HEAD
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
=======
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { validateFile, checkRateLimit } from '@/utils/fileValidation';

export interface Story {
  id: string;
  userId: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption?: string;
  emoji?: string;
  createdAt: string;
  expiresAt: string;
  viewers: StoryViewer[];
  isViewed?: boolean;
  profile?: {
    id: string;
    username: string;
    avatar_url: string;
  };
  likes?: StoryLike[];
  comments?: StoryComment[];
  likeCount?: number;
  commentCount?: number;
  isLiked?: boolean;
}

export interface StoryViewer {
  userId: string;
  viewedAt: string;
}

export interface StoryLike {
  id: string;
  storyId: string;
  userId: string;
  createdAt: string;
}

export interface StoryComment {
  id: string;
  storyId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    username: string;
    avatar_url: string;
  };
  replies?: StoryReply[];
}

export interface StoryReply {
  id: string;
  commentId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    username: string;
    avatar_url: string;
  };
}

export interface StoryUploadData {
  file: File;
  caption?: string;
  emoji?: string;
}

/**
<<<<<<< HEAD
 * Hook for managing 24-hour photo/video status (Stories)
 * WhatsApp/Instagram-style Stories system
=======
 * useStories — Fixed version
 *
 * Key fixes applied:
 * 1. fetchStories moved out to useCallback to avoid stale closure in realtime listener
 * 2. All debug console.log() calls removed from production code (were logging on every fetch)
 * 3. Concurrent fetch protection via isFetchingRef to prevent race conditions
 * 4. Cleanup interval properly tracked and removed
 * 5. fetchStories no longer re-created on every render (was captured stale in channel subscription)
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
 */
export function useStories() {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [userStories, setUserStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
<<<<<<< HEAD

  // Fetch stories for current user's friends
  const fetchStories = async () => {
    console.log('🔍 fetchStories called, user.id:', user?.id);
    if (!user?.id) {
      console.log('❌ No user ID, returning');
      return;
    }

=======
  const isFetchingRef = useRef(false);

  // Stable fetch function via useCallback — prevents stale closure in realtime handler
  const fetchStories = useCallback(async () => {
    if (!user?.id) return;
    if (isFetchingRef.current) return; // Prevent concurrent fetches

    isFetchingRef.current = true;
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
    setLoading(true);
    setError(null);

    try {
      // Get friends list (bidirectional friendship logic)
      const { data: friends, error: friendsError } = await supabase
        .from('friends')
        .select('user_id, friend_id')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq('status', 'accepted');

      if (friendsError) throw friendsError;

      // Get blocked users list
      const { data: blockedUsers, error: blockedError } = await supabase
        .from('blocked_users')
        .select('blocked_id')
        .eq('blocker_id', user.id);

      if (blockedError) throw blockedError;

<<<<<<< HEAD
      // Extract friend IDs (bidirectional)
      const friendIds = friends?.map(f => {
        // If current user is user_id, friend is friend_id
        // If current user is friend_id, friend is user_id
        return f.user_id === user.id ? f.friend_id : f.user_id;
      }) || [];
      
      // Extract blocked user IDs
      const blockedUserIds = blockedUsers?.map(b => b.blocked_id) || [];
      
      // Always include current user's ID first, but exclude blocked users
      const allUserIds = [user.id, ...friendIds].filter(id => !blockedUserIds.includes(id));
      console.log('👥 Fetching stories for user IDs:', allUserIds);
      console.log('🚫 Blocked user IDs:', blockedUserIds);

      // Fetch active stories (not expired) - simplified for testing
=======
      const friendIds = friends?.map(f =>
        f.user_id === user.id ? f.friend_id : f.user_id
      ) || [];

      const blockedUserIds = blockedUsers?.map(b => b.blocked_id) || [];
      const allUserIds = [user.id, ...friendIds].filter(id => !blockedUserIds.includes(id));

>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
      const now = new Date().toISOString();
      const { data: storiesData, error: storiesError } = await supabase
        .from('stories')
        .select('*')
        .in('user_id', allUserIds)
        .gt('expires_at', now)
        .order('created_at', { ascending: false });

      if (storiesError) throw storiesError;

<<<<<<< HEAD
      console.log('📚 Raw storiesData from Supabase:', storiesData);
      console.log('📊 storiesData length:', storiesData?.length || 0);

      // Transform data - simplified for testing
      const transformedStories: Story[] = (storiesData || []).map(story => ({
        id: story.id,
        userId: story.user_id,
        mediaUrl: story.content, // Use 'content' column instead of 'media_url'
        mediaType: story.type,   // Use 'type' column instead of 'media_type'
        caption: story.caption,
        createdAt: story.created_at,
        expiresAt: story.expires_at,
        profile: undefined, // Simplified - no profile join
        viewers: [],         // Simplified - no viewers join
        likes: [],           // Simplified - no likes join
        comments: [],        // Simplified - no comments join
        isViewed: false,     // Simplified - no viewers data
        likeCount: 0,        // Simplified - no likes data
        commentCount: 0,     // Simplified - no comments data
        isLiked: false,      // Simplified - no likes data
      }));

      console.log('🔄 Transformed stories:', transformedStories);
      console.log('📈 transformedStories length:', transformedStories.length);
      
      const userStoriesFiltered = transformedStories.filter(s => s.userId === user.id);
      console.log('👤 User stories (filtered):', userStoriesFiltered);
      console.log('👤 User stories length:', userStoriesFiltered.length);

      setStories(transformedStories);
      setUserStories(userStoriesFiltered);
      
      console.log('✅ State updated - stories set:', transformedStories.length, 'userStories set:', userStoriesFiltered.length);
    } catch (err) {
      console.error('❌ Error fetching stories:', err);
      setError(err instanceof Error ? err.message : 'Failed to load stories');
    } finally {
      setLoading(false);
    }
  };

  // Realtime updates for stories
  useEffect(() => {
    console.log('🚀 useEffect triggered, user.id:', user?.id);
    if (!user?.id) {
      console.log('❌ No user ID in useEffect, skipping');
      return;
    }

    // Initial fetch on component mount
    console.log('📞 Calling fetchStories from useEffect');
=======
      const transformedStories: Story[] = (storiesData || []).map(story => ({
        id: story.id,
        userId: story.user_id,
        mediaUrl: story.content,
        mediaType: story.type,
        caption: story.caption,
        createdAt: story.created_at,
        expiresAt: story.expires_at,
        profile: undefined,
        viewers: [],
        likes: [],
        comments: [],
        isViewed: false,
        likeCount: 0,
        commentCount: 0,
        isLiked: false,
      }));

      const userStoriesFiltered = transformedStories.filter(s => s.userId === user.id);
      setStories(transformedStories);
      setUserStories(userStoriesFiltered);
    } catch (err) {
      console.error('Error fetching stories:', err);
      setError(err instanceof Error ? err.message : 'Failed to load stories');
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [user?.id]);

  // Realtime updates for stories
  useEffect(() => {
    if (!user?.id) return;

>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
    fetchStories();

    const channel = supabase
      .channel('stories-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'stories' },
        () => {
<<<<<<< HEAD
          console.log('🔄 Realtime update received, refetching stories');
=======
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
          fetchStories();
        }
      )
      .subscribe();

    return () => {
<<<<<<< HEAD
      console.log('🧹 Cleaning up realtime channel');
      supabase.removeChannel(channel);
    };
  }, [user?.id]); // Only depend on user.id changes
=======
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchStories]);
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)

  // Upload a new story
  const uploadStory = async (data: StoryUploadData) => {
    if (!user?.id) throw new Error('Not authenticated');

<<<<<<< HEAD
    // Rate limiting check
    if (!checkRateLimit(user.id, 3, 60000)) { // 3 uploads per minute
=======
    if (!checkRateLimit(user.id, 3, 60000)) {
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
      throw new Error('Too many upload attempts. Please try again later.');
    }

    setUploading(true);

    try {
<<<<<<< HEAD
      // Validate file
=======
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
      const validation = validateFile(data.file, 'stories');
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

<<<<<<< HEAD
      // Upload file to Supabase Storage
=======
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
      const fileExt = data.file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('stories')
        .upload(fileName, data.file);

      if (uploadError) {
<<<<<<< HEAD
        console.error('=== SUPABASE STORAGE UPLOAD ERROR ===');
        console.error('Error message:', uploadError.message);
        console.error('Error status:', uploadError.statusCode || uploadError.status);
        console.error('Full error object:', uploadError);
        console.error('File name:', fileName);
        console.error('File size:', data.file.size);
        console.error('File type:', data.file.type);
        console.error('=====================================');
        throw uploadError;
      }

      // Get public URL
=======
        throw uploadError;
      }

>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
      const { data: { publicUrl } } = supabase.storage
        .from('stories')
        .getPublicUrl(fileName);

<<<<<<< HEAD
      // Create story record matching database schema
=======
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const storyData = {
        user_id: user.id,
        type: data.file.type.startsWith('image/') ? 'image' : 'video',
<<<<<<< HEAD
        content: publicUrl, // Use content column for file URL
=======
        content: publicUrl,
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
        caption: data.caption,
        expires_at: expiresAt,
      };

<<<<<<< HEAD
      console.log('Inserting story data:', storyData);

=======
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
      const { data: insertResult, error: insertError } = await supabase
        .from('stories')
        .insert(storyData)
        .select()
        .single();

<<<<<<< HEAD
      console.log('Supabase insert response:', { data: insertResult, error: insertError });

      if (insertError) {
        console.error('Insert error details:', insertError);
=======
      if (insertError) {
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
        throw new Error(`Failed to insert story: ${insertError.message}`);
      }

      if (!insertResult) {
        throw new Error('Story insert returned no data but reported success');
      }

<<<<<<< HEAD
      // Refresh stories immediately
      await fetchStories();
      
=======
      await fetchStories();
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
      toast.success('Story uploaded successfully!');
      return insertResult;
    } catch (err) {
      console.error('Error uploading story:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to upload story');
      throw err;
    } finally {
      setUploading(false);
    }
  };

  // Like/unlike story
  const toggleStoryLike = async (storyId: string) => {
    if (!user?.id) return;

    try {
      const story = stories.find(s => s.id === storyId);
      if (!story) return;

      if (story.isLiked) {
<<<<<<< HEAD
        // Unlike
=======
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
        const { error } = await supabase
          .from('story_likes')
          .delete()
          .eq('story_id', storyId)
          .eq('user_id', user.id);

        if (error) throw error;

<<<<<<< HEAD
        setStories(prev => prev.map(s => 
          s.id === storyId 
            ? { 
                ...s, 
                isLiked: false, 
                likeCount: Math.max(0, (s.likeCount || 0) - 1),
                likes: s.likes?.filter(l => l.userId !== user.id)
              }
            : s
        ));
      } else {
        // Like
=======
        setStories(prev => prev.map(s =>
          s.id === storyId
            ? {
              ...s,
              isLiked: false,
              likeCount: Math.max(0, (s.likeCount || 0) - 1),
              likes: s.likes?.filter(l => l.userId !== user.id)
            }
            : s
        ));
      } else {
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
        const { error } = await supabase
          .from('story_likes')
          .insert({
            story_id: storyId,
            user_id: user.id,
          });

        if (error) throw error;

<<<<<<< HEAD
        setStories(prev => prev.map(s => 
          s.id === storyId 
            ? { 
                ...s, 
                isLiked: true, 
                likeCount: (s.likeCount || 0) + 1,
                likes: [...(s.likes || []), {
                  id: crypto.randomUUID(),
                  storyId,
                  userId: user.id,
                  createdAt: new Date().toISOString()
                }]
              }
=======
        setStories(prev => prev.map(s =>
          s.id === storyId
            ? {
              ...s,
              isLiked: true,
              likeCount: (s.likeCount || 0) + 1,
              likes: [...(s.likes || []), {
                id: crypto.randomUUID(),
                storyId,
                userId: user.id,
                createdAt: new Date().toISOString()
              }]
            }
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
            : s
        ));
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      toast.error('Failed to update like');
    }
  };

  // Add comment to story
  const addStoryComment = async (storyId: string, content: string) => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('story_comments')
        .insert({
          story_id: storyId,
          user_id: user.id,
          content,
        })
        .select(`
          *,
          profiles!story_comments_user_id_fkey (
            id,
            username,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

<<<<<<< HEAD
      // Update local state
      setStories(prev => prev.map(s => 
        s.id === storyId 
          ? { 
              ...s, 
              commentCount: (s.commentCount || 0) + 1,
              comments: [data, ...(s.comments || [])]
            }
=======
      setStories(prev => prev.map(s =>
        s.id === storyId
          ? {
            ...s,
            commentCount: (s.commentCount || 0) + 1,
            comments: [data, ...(s.comments || [])]
          }
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
          : s
      ));

      toast.success('Comment added!');
    } catch (err) {
      console.error('Error adding comment:', err);
      toast.error('Failed to add comment');
    }
  };

  // Delete comment
  const deleteStoryComment = async (commentId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('story_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;

<<<<<<< HEAD
      // Update local state
=======
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
      setStories(prev => prev.map(s => ({
        ...s,
        comments: s.comments?.filter(c => c.id !== commentId),
        commentCount: Math.max(0, (s.commentCount || 0) - 1)
      })));

      toast.success('Comment deleted');
    } catch (err) {
      console.error('Error deleting comment:', err);
      toast.error('Failed to delete comment');
    }
  };

  // Mark story as viewed
  const markStoryAsViewed = async (storyId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('story_viewers')
        .insert({
          story_id: storyId,
          user_id: user.id,
        });

<<<<<<< HEAD
      if (error && error.code !== '23505') { // Ignore duplicate key error
        throw error;
      }

      // Update local state
      setStories(prev => prev.map(s => 
=======
      if (error && error.code !== '23505') {
        throw error;
      }

      setStories(prev => prev.map(s =>
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
        s.id === storyId ? { ...s, isViewed: true } : s
      ));
    } catch (err) {
      console.error('Error marking story as viewed:', err);
    }
  };

  // Delete a story (only owner can delete)
  const deleteStory = async (storyId: string): Promise<void> => {
    if (!user?.id) return;

    try {
<<<<<<< HEAD
      // Get story details
=======
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
      const { data: story } = await supabase
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .single();

      if (!story) throw new Error('Story not found');
      if (story.user_id !== user.id) throw new Error('Not authorized');

<<<<<<< HEAD
      // Delete from storage
      const filePath = story.media_url.split('/').pop();
=======
      // Use content column (not media_url — schema fix)
      const contentUrl: string = story.content || '';
      const filePath = contentUrl.split('/').pop();
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
      if (filePath) {
        await supabase.storage
          .from('stories')
          .remove([`${user.id}/${filePath}`]);
      }

<<<<<<< HEAD
      // Delete from database
=======
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
      const { error: deleteError } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId);

      if (deleteError) throw deleteError;

<<<<<<< HEAD
      // Update local state
=======
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
      setStories(prev => prev.filter(s => s.id !== storyId));
      setUserStories(prev => prev.filter(s => s.id !== storyId));
    } catch (err) {
      console.error('Error deleting story:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete story');
      throw err;
    }
  };

  // Get stories grouped by user
<<<<<<< HEAD
  const getStoriesByUser = () => {
    const grouped: Record<string, Story[]> = {};
    
=======
  const getStoriesByUser = useCallback(() => {
    const grouped: Record<string, Story[]> = {};
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
    stories.forEach(story => {
      if (!grouped[story.userId]) {
        grouped[story.userId] = [];
      }
      grouped[story.userId].push(story);
    });
<<<<<<< HEAD

    return grouped;
  };

  // Check if a user has active stories
  const hasActiveStories = (userId: string) => {
    return stories.some(story => story.userId === userId);
  };
=======
    return grouped;
  }, [stories]);

  // Check if a user has active stories
  const hasActiveStories = useCallback((userId: string) => {
    return stories.some(story => story.userId === userId);
  }, [stories]);
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)

  // Get story viewers (only for story owner)
  const getStoryViewers = async (storyId: string): Promise<StoryViewer[]> => {
    if (!user?.id) return [];

    try {
<<<<<<< HEAD
      // Verify ownership
=======
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
      const { data: story } = await supabase
        .from('stories')
        .select('user_id')
        .eq('id', storyId)
        .single();

      if (!story || story.user_id !== user.id) {
        return [];
      }

<<<<<<< HEAD
      // Get viewers with profile info
=======
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
      const { data: viewers } = await supabase
        .from('story_viewers')
        .select(`
          user_id,
          viewed_at,
          profiles!story_viewers_user_id_fkey (
            username,
            avatar_url
          )
        `)
        .eq('story_id', storyId)
        .order('viewed_at', { ascending: false });

      return (viewers || []).map(viewer => ({
        userId: viewer.user_id,
        viewedAt: viewer.viewed_at,
      }));
    } catch (err) {
      console.error('Error fetching story viewers:', err);
      return [];
    }
  };

<<<<<<< HEAD
  // Clean up expired stories (runs periodically)
  const cleanupExpiredStories = async () => {
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('stories')
        .delete()
        .lt('expires_at', now);

      if (error) throw error;
    } catch (err) {
      console.error('Error cleaning up expired stories:', err);
    }
  };

  // Run cleanup every hour
  useEffect(() => {
    const interval = setInterval(cleanupExpiredStories, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
=======
  // Clean up expired stories — runs every hour (once per instance, not per render)
  useEffect(() => {
    const cleanupExpiredStories = async () => {
      try {
        const now = new Date().toISOString();
        await supabase
          .from('stories')
          .delete()
          .lt('expires_at', now);
      } catch (err) {
        // Non-critical, silently fail
      }
    };

    const interval = setInterval(cleanupExpiredStories, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []); // Empty deps — only register once per mount
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)

  return {
    stories,
    userStories,
    loading,
    error,
    uploading,
    uploadStory,
    markStoryAsViewed,
    deleteStory,
    getStoriesByUser,
    hasActiveStories,
    getStoryViewers,
    refetch: fetchStories,
<<<<<<< HEAD
=======
    toggleStoryLike,
    addStoryComment,
    deleteStoryComment,
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
  };
}
