-- Add chat_wallpaper column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS chat_wallpaper TEXT;

-- Add comment for documentation
COMMENT ON COLUMN profiles.chat_wallpaper IS 'URL to custom chat wallpaper image in Supabase Storage';

-- Create index for wallpaper queries (optional, for future use)
CREATE INDEX IF NOT EXISTS idx_profiles_chat_wallpaper ON profiles(chat_wallpaper) WHERE chat_wallpaper IS NOT NULL;
