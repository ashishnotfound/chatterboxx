-- Enhance read receipts: Add read_at timestamp for better tracking
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add index for read_at queries
CREATE INDEX IF NOT EXISTS idx_messages_read_at ON public.messages(read_at) WHERE read_at IS NOT NULL;

-- Add media support columns if they don't exist
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS image_metadata JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS file_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS file_metadata JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS video_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS video_metadata JSONB DEFAULT NULL;

-- Update message_type enum to include more media types
-- Note: This might fail if values already exist, which is fine
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'video' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'message_type')) THEN
    ALTER TYPE public.message_type ADD VALUE 'video';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'file' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'message_type')) THEN
    ALTER TYPE public.message_type ADD VALUE 'file';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'audio' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'message_type')) THEN
    ALTER TYPE public.message_type ADD VALUE 'audio';
  END IF;
END $$;

-- Create storage bucket for chat media if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for chat-images
CREATE POLICY IF NOT EXISTS "Users can upload chat images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY IF NOT EXISTS "Users can view chat images"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-images');

CREATE POLICY IF NOT EXISTS "Users can delete their chat images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'chat-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies for chat-media (videos, files, etc.)
CREATE POLICY IF NOT EXISTS "Users can upload chat media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY IF NOT EXISTS "Users can view chat media"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-media');

CREATE POLICY IF NOT EXISTS "Users can delete their chat media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'chat-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Function to update read_at when is_read changes to true
CREATE OR REPLACE FUNCTION public.update_read_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_read = true AND OLD.is_read = false AND NEW.read_at IS NULL THEN
    NEW.read_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically set read_at
DROP TRIGGER IF EXISTS update_message_read_at ON public.messages;
CREATE TRIGGER update_message_read_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  WHEN (NEW.is_read = true AND OLD.is_read = false)
  EXECUTE FUNCTION public.update_read_at();

-- Add comment for documentation
COMMENT ON COLUMN public.messages.read_at IS 'Timestamp when the message was read by the recipient';
COMMENT ON COLUMN public.messages.image_url IS 'URL to the image file in storage';
COMMENT ON COLUMN public.messages.image_metadata IS 'Metadata about the image (name, size, type, dimensions)';
COMMENT ON COLUMN public.messages.file_url IS 'URL to the file in storage';
COMMENT ON COLUMN public.messages.file_metadata IS 'Metadata about the file (name, size, type)';
COMMENT ON COLUMN public.messages.video_url IS 'URL to the video file in storage';
COMMENT ON COLUMN public.messages.video_metadata IS 'Metadata about the video (name, size, type, duration, thumbnail)';
