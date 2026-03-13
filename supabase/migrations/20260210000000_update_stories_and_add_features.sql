-- Update stories table to match the new implementation
ALTER TABLE stories RENAME COLUMN type TO media_type;
ALTER TABLE stories RENAME COLUMN content TO media_url;

-- Add new columns to stories table
ALTER TABLE stories 
ADD COLUMN IF NOT EXISTS emoji TEXT,
ADD COLUMN IF NOT EXISTS story_viewers TEXT[] DEFAULT '{}';

-- Update media_type check constraint
ALTER TABLE stories DROP CONSTRAINT IF EXISTS stories_type_check;
ALTER TABLE stories ADD CONSTRAINT stories_media_type_check 
  CHECK (media_type IN ('image', 'video'));

-- Create proper story_viewers table
CREATE TABLE IF NOT EXISTS story_viewers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(story_id, user_id)
);

-- Add indexes for story_viewers
CREATE INDEX IF NOT EXISTS idx_story_viewers_story_id ON story_viewers(story_id);
CREATE INDEX IF NOT EXISTS idx_story_viewers_user_id ON story_viewers(user_id);

-- Migrate existing viewers data from stories.viewers to story_viewers table
INSERT INTO story_viewers (story_id, user_id, viewed_at)
SELECT 
  s.id as story_id,
  v.user_id,
  NOW() as viewed_at
FROM stories s, 
     unnest(s.viewers) as v(user_id)
WHERE NOT EXISTS (
  SELECT 1 FROM story_viewers sv 
  WHERE sv.story_id = s.id AND sv.user_id = v.user_id
);

-- Drop the old viewers column from stories
ALTER TABLE stories DROP COLUMN IF EXISTS viewers;

-- Update comments
COMMENT ON COLUMN stories.media_type IS 'Story media type: image or video';
COMMENT ON COLUMN stories.media_url IS 'URL to the media file in storage';
COMMENT ON COLUMN stories.emoji IS 'Optional emoji to display with the story';
COMMENT ON TABLE story_viewers IS 'Track which users have viewed which stories';

-- Add Spotify integration columns to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS spotify_track_title TEXT,
ADD COLUMN IF NOT EXISTS spotify_track_artist TEXT,
ADD COLUMN IF NOT EXISTS spotify_is_playing BOOLEAN DEFAULT FALSE;

-- Add indexes for Spotify columns
CREATE INDEX IF NOT EXISTS idx_profiles_spotify_playing ON profiles(spotify_is_playing) WHERE spotify_is_playing = TRUE;

-- Add comments for Spotify columns
COMMENT ON COLUMN profiles.spotify_track_title IS 'Title of currently playing Spotify track';
COMMENT ON COLUMN profiles.spotify_track_artist IS 'Artist of currently playing Spotify track';
COMMENT ON COLUMN profiles.spotify_is_playing IS 'Whether user is currently listening to Spotify';

-- Ensure streak_count column exists and is properly indexed
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS streak_count INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_profiles_streak_count ON profiles(streak_count DESC);

-- Add comment for streak_count
COMMENT ON COLUMN profiles.streak_count IS 'Current chat streak count (days of consecutive activity)';

-- Add app usage tracking columns to profiles (local-only, but stored for backup)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS uptime_minutes INTEGER DEFAULT 0;

-- Add index for uptime
CREATE INDEX IF NOT EXISTS idx_profiles_uptime ON profiles(uptime_minutes DESC);

-- Add comment for uptime_minutes
COMMENT ON COLUMN profiles.uptime_minutes IS 'Total app usage time in minutes (local tracking)';

-- Create function to update last_seen and handle presence
CREATE OR REPLACE FUNCTION update_user_presence(
  user_id_param UUID,
  is_online_param BOOLEAN DEFAULT TRUE,
  presence_status_param public.presence_status DEFAULT 'online'
)
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET 
    is_online = is_online_param,
    presence_status = presence_status_param,
    last_seen = NOW(),
    uptime_minutes = CASE 
      WHEN is_online_param = TRUE THEN uptime_minutes + 1
      ELSE uptime_minutes
    END
  WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql;

-- Create function to increment user streak
CREATE OR REPLACE FUNCTION increment_user_streak(user_id_param UUID)
RETURNS void AS $$
DECLARE
  current_streak INTEGER;
  last_active TIMESTAMPTZ;
  today DATE := CURRENT_DATE;
  yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
BEGIN
  -- Get current streak and last active date
  SELECT streak_count, last_seen INTO current_streak, last_active
  FROM profiles 
  WHERE id = user_id_param;
  
  -- Check if user already has activity today
  IF DATE(last_active) = today THEN
    -- Already active today, don't increment
    RETURN;
  END IF;
  
  -- Check if user was active yesterday
  IF DATE(last_active) = yesterday THEN
    -- Continue streak
    current_streak := current_streak + 1;
  ELSE
    -- Start new streak
    current_streak := 1;
  END IF;
  
  -- Update streak
  UPDATE profiles 
  SET 
    streak_count = current_streak,
    last_seen = NOW()
  WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically clean up expired stories (can be called by cron)
CREATE OR REPLACE FUNCTION auto_cleanup_expired_stories()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM stories WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies for stories
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- Users can only see their own stories and friends' stories
CREATE POLICY "Users can view stories" ON stories
  FOR SELECT USING (
    user_id = auth.uid() OR
    user_id IN (
      SELECT friend_id FROM friends 
      WHERE user_id = auth.uid() AND status = 'accepted'
      UNION
      SELECT user_id FROM friends 
      WHERE friend_id = auth.uid() AND status = 'accepted'
    )
  );

-- Users can only insert their own stories
CREATE POLICY "Users can insert own stories" ON stories
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can only update their own stories
CREATE POLICY "Users can update own stories" ON stories
  FOR UPDATE USING (user_id = auth.uid());

-- Users can only delete their own stories
CREATE POLICY "Users can delete own stories" ON stories
  FOR DELETE USING (user_id = auth.uid());

-- Add RLS policies for story_viewers
ALTER TABLE story_viewers ENABLE ROW LEVEL SECURITY;

-- Users can view story viewers for their own stories
CREATE POLICY "Users can view viewers of own stories" ON story_viewers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM stories 
      WHERE stories.id = story_viewers.story_id 
      AND stories.user_id = auth.uid()
    )
  );

-- Users can insert their own viewing records
CREATE POLICY "Users can insert viewing records" ON story_viewers
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

-- Users can update their own viewing records
CREATE POLICY "Users can update viewing records" ON story_viewers
  FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own viewing records
CREATE POLICY "Users can delete viewing records" ON story_viewers
  FOR DELETE USING (user_id = auth.uid());
