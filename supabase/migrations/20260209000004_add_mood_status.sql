-- Add mood_status field to profiles table
ALTER TABLE profiles 
ADD COLUMN mood_status TEXT NULL DEFAULT 'online';

-- Add comment for documentation
COMMENT ON COLUMN profiles.mood_status IS 'User current mood/status: online, busy, gaming, chill, working, studying, away, invisible, listening, watching';

-- Update existing records to have default online status
UPDATE profiles 
SET mood_status = 'online' 
WHERE mood_status IS NULL;
