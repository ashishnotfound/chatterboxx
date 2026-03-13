-- Ensure presence_status enum exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'presence_status') THEN
    CREATE TYPE public.presence_status AS ENUM ('online', 'idle', 'dnd', 'invisible');
  END IF;
END $$;

-- Add presence_status column to profiles table if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS presence_status public.presence_status DEFAULT 'online';

-- Migrate existing data if presence_status is NULL
UPDATE public.profiles 
SET presence_status = CASE 
  WHEN is_stealth_mode = true THEN 'invisible'::public.presence_status
  WHEN is_online = true THEN 'online'::public.presence_status
  ELSE 'idle'::public.presence_status
END
WHERE presence_status IS NULL;

-- Set default if still NULL (safety check)
UPDATE public.profiles 
SET presence_status = 'online'::public.presence_status
WHERE presence_status IS NULL;

-- Try to set NOT NULL constraint (only if all rows have values)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'presence_status' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.profiles 
    ALTER COLUMN presence_status SET NOT NULL;
  END IF;
END $$;

-- Add index for presence_status queries if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_profiles_presence_status ON public.profiles(presence_status);

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.presence_status IS 'User presence status: online, idle, dnd (do not disturb), or invisible';
