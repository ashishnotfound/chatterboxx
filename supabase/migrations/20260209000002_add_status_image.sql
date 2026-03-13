-- Add status_image field to profiles table
ALTER TABLE profiles 
ADD COLUMN status_image_url TEXT NULL;

-- Add comment for documentation
COMMENT ON COLUMN profiles.status_image_url IS 'URL to user uploaded status/profile media image that replaces status text';
