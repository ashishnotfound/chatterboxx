-- Add settings columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS notifications_messages boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notifications_friend_requests boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notifications_reactions boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notifications_mentions boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notifications_sounds boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS app_language text DEFAULT 'en',
ADD COLUMN IF NOT EXISTS reduced_motion boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS compact_mode boolean DEFAULT false;