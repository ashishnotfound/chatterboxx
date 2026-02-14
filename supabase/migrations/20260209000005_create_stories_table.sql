-- Create stories table
CREATE TABLE stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image', 'video', 'text')),
  content TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  view_count INTEGER DEFAULT 0 NOT NULL,
  viewers TEXT[] DEFAULT '{}' NOT NULL
);

-- Add indexes
CREATE INDEX idx_stories_user_id ON stories(user_id);
CREATE INDEX idx_stories_expires_at ON stories(expires_at);
CREATE INDEX idx_stories_created_at ON stories(created_at);

-- Add comments
COMMENT ON TABLE stories IS 'User stories that expire after a set duration';
COMMENT ON COLUMN stories.type IS 'Story type: image, video, or text';
COMMENT ON COLUMN stories.content IS 'Story content: URL for image/video, text content for text stories';
COMMENT ON COLUMN stories.caption IS 'Optional story caption';
COMMENT ON COLUMN stories.expires_at IS 'When the story expires and is automatically deleted';
COMMENT ON COLUMN stories.view_count IS 'Number of times the story has been viewed';
COMMENT ON COLUMN stories.viewers IS 'Array of user IDs who have viewed the story';

-- Create function to automatically delete expired stories
CREATE OR REPLACE FUNCTION delete_expired_stories()
RETURNS void AS $$
BEGIN
  DELETE FROM stories WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Note: This function can be called manually or via a scheduled job
-- to clean up expired stories periodically
