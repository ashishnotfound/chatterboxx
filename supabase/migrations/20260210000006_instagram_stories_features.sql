-- Create story_likes table
CREATE TABLE IF NOT EXISTS story_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(story_id, user_id)
);

-- Create story_comments table
CREATE TABLE IF NOT EXISTS story_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create story_replies table
CREATE TABLE IF NOT EXISTS story_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES story_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_story_likes_story_id ON story_likes(story_id);
CREATE INDEX IF NOT EXISTS idx_story_likes_user_id ON story_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_story_comments_story_id ON story_comments(story_id);
CREATE INDEX IF NOT EXISTS idx_story_comments_user_id ON story_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_story_comments_created_at ON story_comments(created_at);
CREATE INDEX IF NOT EXISTS idx_story_replies_comment_id ON story_replies(comment_id);
CREATE INDEX IF NOT EXISTS idx_story_replies_user_id ON story_replies(user_id);

-- Add RLS policies for story_likes
ALTER TABLE story_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view story likes" ON story_likes;
DROP POLICY IF EXISTS "Users can like stories" ON story_likes;
DROP POLICY IF EXISTS "Users can unlike stories" ON story_likes;

CREATE POLICY "Users can view story likes" ON story_likes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM stories 
      WHERE stories.id = story_likes.story_id 
      AND stories.user_id = auth.uid()
    ) OR
    story_likes.user_id = auth.uid()
  );

CREATE POLICY "Users can like stories" ON story_likes
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

CREATE POLICY "Users can unlike stories" ON story_likes
  FOR DELETE USING (
    user_id = auth.uid()
  );

-- Add RLS policies for story_comments
ALTER TABLE story_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view story comments" ON story_comments;
DROP POLICY IF EXISTS "Users can comment on stories" ON story_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON story_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON story_comments;

CREATE POLICY "Users can view story comments" ON story_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM stories 
      WHERE stories.id = story_comments.story_id 
      AND stories.user_id = auth.uid()
    ) OR
    story_comments.user_id = auth.uid()
  );

CREATE POLICY "Users can comment on stories" ON story_comments
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

CREATE POLICY "Users can update own comments" ON story_comments
  FOR UPDATE USING (
    user_id = auth.uid()
  );

CREATE POLICY "Users can delete own comments" ON story_comments
  FOR DELETE USING (
    user_id = auth.uid()
  );

-- Add RLS policies for story_replies
ALTER TABLE story_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view story replies" ON story_replies;
DROP POLICY IF EXISTS "Users can reply to story comments" ON story_replies;
DROP POLICY IF EXISTS "Users can update own replies" ON story_replies;
DROP POLICY IF EXISTS "Users can delete own replies" ON story_replies;

CREATE POLICY "Users can view story replies" ON story_replies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM story_comments 
      WHERE story_comments.id = story_replies.comment_id 
      AND EXISTS (
        SELECT 1 FROM stories 
        WHERE stories.id = story_comments.story_id 
        AND stories.user_id = auth.uid()
      )
    ) OR
    story_replies.user_id = auth.uid()
  );

CREATE POLICY "Users can reply to story comments" ON story_replies
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

CREATE POLICY "Users can update own replies" ON story_replies
  FOR UPDATE USING (
    user_id = auth.uid()
  );

CREATE POLICY "Users can delete own replies" ON story_replies
  FOR DELETE USING (
    user_id = auth.uid()
  );

-- Function to auto-update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for auto-updating updated_at
CREATE TRIGGER update_story_comments_updated_at 
BEFORE UPDATE ON story_comments 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_story_replies_updated_at 
BEFORE UPDATE ON story_replies 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE story_likes IS 'Track likes on stories';
COMMENT ON TABLE story_comments IS 'Track comments on stories';
COMMENT ON TABLE story_replies IS 'Track replies to story comments';
