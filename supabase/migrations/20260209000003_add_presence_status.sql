-- Add presence_status field to profiles table
ALTER TABLE profiles 
ADD COLUMN presence_status TEXT NULL DEFAULT 'online';

-- Add comment for documentation
COMMENT ON COLUMN profiles.presence_status IS 'User presence status: online, idle, dnd, invisible';

-- Update existing records to have default online status
UPDATE profiles 
SET presence_status = 'online' 
WHERE presence_status IS NULL;
