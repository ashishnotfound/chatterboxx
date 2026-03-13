-- Ensure streak_count column exists and has proper default
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS streak_count INTEGER DEFAULT 0;

-- Add app usage tracking columns if they don't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS total_session_time INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_session_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS app_open_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_opened_at TIMESTAMPTZ;

-- Create function to update streak
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
BEGIN
    -- Get current user's streak data
    DECLARE 
        current_streak INTEGER;
        last_active DATE;
        today DATE := CURRENT_DATE;
    
    SELECT streak_count, last_opened_at::DATE INTO current_streak, last_active
    FROM profiles 
    WHERE id = NEW.user_id;
    
    -- If this is the first activity today
    IF last_active IS NULL OR last_active < today - INTERVAL '1 day' THEN
        -- Streak is broken, reset to 1
        UPDATE profiles 
        SET streak_count = 1, last_opened_at = NOW()
        WHERE id = NEW.user_id;
    ELSIF last_active = today - INTERVAL '1 day' THEN
        -- Consecutive day, increment streak
        UPDATE profiles 
        SET streak_count = current_streak + 1, last_opened_at = NOW()
        WHERE id = NEW.user_id;
    ELSIF last_active < today THEN
        -- Same day, don't change streak
        UPDATE profiles 
        SET last_opened_at = NOW()
        WHERE id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic streak updates
DROP TRIGGER IF EXISTS update_streak_on_activity ON profiles;
CREATE TRIGGER update_streak_on_activity
    AFTER UPDATE OF last_opened_at
    ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_user_streak();

-- Create function to update app usage
CREATE OR REPLACE FUNCTION update_app_usage()
RETURNS TRIGGER AS $$
BEGIN
    -- Update total session time
    IF OLD.last_session_start IS NOT NULL AND NEW.last_session_start IS NULL THEN
        -- Session ended
        UPDATE profiles 
        SET total_session_time = total_session_time + EXTRACT(EPOCH FROM (NOW() - OLD.last_session_start))::INTEGER
        WHERE id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for app usage tracking
DROP TRIGGER IF EXISTS update_app_usage_trigger ON profiles;
CREATE TRIGGER update_app_usage_trigger
    AFTER UPDATE OF last_session_start
    ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_app_usage();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_streak_count ON profiles(streak_count);
CREATE INDEX IF NOT EXISTS idx_profiles_last_opened_at ON profiles(last_opened_at);
CREATE INDEX IF NOT EXISTS idx_profiles_total_session_time ON profiles(total_session_time);
