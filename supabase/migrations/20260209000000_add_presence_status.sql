-- Create presence_status enum
CREATE TYPE public.presence_status AS ENUM ('online', 'idle', 'dnd', 'invisible');

-- Add presence_status column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS presence_status public.presence_status DEFAULT 'online';

-- Migrate existing data: 
-- - If is_online = true and is_stealth_mode = false, set to 'online'
-- - If is_stealth_mode = true, set to 'invisible'
-- - If is_online = false and is_stealth_mode = false, set to 'offline' (but we'll use 'idle' as default for offline users)
UPDATE public.profiles 
SET presence_status = CASE 
  WHEN is_stealth_mode = true THEN 'invisible'::public.presence_status
  WHEN is_online = true THEN 'online'::public.presence_status
  ELSE 'idle'::public.presence_status
END
WHERE presence_status IS NULL;

-- Set NOT NULL constraint after migration
ALTER TABLE public.profiles 
ALTER COLUMN presence_status SET NOT NULL;

-- Add index for presence_status queries
CREATE INDEX IF NOT EXISTS idx_profiles_presence_status ON public.profiles(presence_status);

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.presence_status IS 'User presence status: online, idle, dnd (do not disturb), or invisible';
