-- Drop all existing wallpaper storage policies
DROP POLICY IF EXISTS "Users can upload to their own wallpaper folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own wallpaper" ON storage.objects;
DROP POLICY IF EXISTS "Chat wallpapers are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own wallpaper" ON storage.objects;

-- Create storage bucket for chat wallpapers if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-wallpapers',
  'chat-wallpapers',
  true,
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/png']
) ON CONFLICT (id) DO NOTHING;

-- Row Level Security Policies for chat-wallpapers bucket

-- Users can upload to their own folder (FIXED: proper type casting)
CREATE POLICY "Users can upload to their own wallpaper folder" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'chat-wallpapers' AND
  auth.role() = 'authenticated' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);

-- Users can update their own wallpaper (FIXED: proper type casting)
CREATE POLICY "Users can update their own wallpaper" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'chat-wallpapers' AND
  auth.role() = 'authenticated' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);

-- Everyone can read wallpapers (they're public URLs)
CREATE POLICY "Chat wallpapers are publicly readable" ON storage.objects
FOR SELECT USING (
  bucket_id = 'chat-wallpapers'
);

-- Users can delete their own wallpaper (FIXED: proper type casting)
CREATE POLICY "Users can delete their own wallpaper" ON storage.objects
FOR DELETE USING (
  bucket_id = 'chat-wallpapers' AND
  auth.role() = 'authenticated' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);

-- Grant necessary permissions
GRANT ALL ON storage.buckets TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
