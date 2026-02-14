-- Drop all existing story-related policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view stories" ON stories;
DROP POLICY IF EXISTS "Users can insert own stories" ON stories;
DROP POLICY IF EXISTS "Users can update own stories" ON stories;
DROP POLICY IF EXISTS "Users can delete own stories" ON stories;

DROP POLICY IF EXISTS "Users can view viewers of own stories" ON story_viewers;
DROP POLICY IF EXISTS "Users can insert viewing records" ON story_viewers;
DROP POLICY IF EXISTS "Users can update viewing records" ON story_viewers;
DROP POLICY IF EXISTS "Users can delete viewing records" ON story_viewers;

-- Ensure RLS is enabled
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_viewers ENABLE ROW LEVEL SECURITY;

-- Stories table policies
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

CREATE POLICY "Users can insert own stories" ON stories
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own stories" ON stories
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own stories" ON stories
  FOR DELETE USING (user_id = auth.uid());

-- Story viewers table policies
CREATE POLICY "Users can view viewers of own stories" ON story_viewers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM stories 
      WHERE stories.id = story_viewers.story_id 
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert viewing records" ON story_viewers
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update viewing records" ON story_viewers
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete viewing records" ON story_viewers
  FOR DELETE USING (user_id = auth.uid());
