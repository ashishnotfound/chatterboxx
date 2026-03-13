-- Add stealth mode column to profiles
ALTER TABLE public.profiles 
ADD COLUMN is_stealth_mode boolean DEFAULT false;

-- Update mood_type enum to include 'none' for No Mood
ALTER TYPE public.mood_type ADD VALUE IF NOT EXISTS 'none';

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.is_stealth_mode IS 'When true, user appears offline to others and cannot see others online status';