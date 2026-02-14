-- ============================================================================
-- COMBINED MIGRATION SCRIPT FOR DIVINE CONNECT CHAT APP
-- ============================================================================
-- This script combines all migrations in chronological order.
-- Run this in your Supabase SQL Editor to set up the complete database schema.
-- ============================================================================

-- ============================================================================
-- PART 1: BASE SCHEMA - Enums, Tables, RLS Policies
-- ============================================================================

-- Create enums for the app
CREATE TYPE public.mood_type AS ENUM ('happy', 'cool', 'loved', 'vibing', 'thinking', 'on_fire');
CREATE TYPE public.subscription_tier AS ENUM ('free', 'pro');
CREATE TYPE public.friend_status AS ENUM ('pending', 'accepted', 'declined', 'blocked');
CREATE TYPE public.message_type AS ENUM ('text', 'image', 'voice', 'sticker', 'gif');

-- Profiles table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  avatar_url TEXT,
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  mood mood_type DEFAULT 'happy',
  mood_emoji TEXT DEFAULT '😊',
  spotify_track_title TEXT,
  spotify_track_artist TEXT,
  spotify_is_playing BOOLEAN DEFAULT false,
  streak_count INTEGER DEFAULT 0,
  uptime_minutes INTEGER DEFAULT 0,
  subscription_tier subscription_tier DEFAULT 'free',
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  theme_background TEXT DEFAULT 'purple',
  theme_bubble_color TEXT DEFAULT 'pink',
  theme_avatar_border TEXT DEFAULT 'pink',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Friends table (bidirectional friend relationships)
CREATE TABLE IF NOT EXISTS public.friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status friend_status DEFAULT 'pending',
  streak_count INTEGER DEFAULT 0,
  last_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

-- Enable RLS on friends
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own friendships" ON public.friends;
DROP POLICY IF EXISTS "Users can send friend requests" ON public.friends;
DROP POLICY IF EXISTS "Users can update their friendships" ON public.friends;
DROP POLICY IF EXISTS "Users can delete their friendships" ON public.friends;

-- Friends policies
CREATE POLICY "Users can view their own friendships" ON public.friends
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can send friend requests" ON public.friends
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their friendships" ON public.friends
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete their friendships" ON public.friends
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Chats table (conversations between users)
CREATE TABLE IF NOT EXISTS public.chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_group BOOLEAN DEFAULT false,
  group_name TEXT,
  is_password_protected BOOLEAN DEFAULT false,
  password_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Chat participants table (MUST be created before policies that reference it)
CREATE TABLE IF NOT EXISTS public.chat_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_pinned BOOLEAN DEFAULT false,
  unread_count INTEGER DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(chat_id, user_id)
);

-- Enable RLS on chats
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- Enable RLS on chat_participants
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check if user is participant (needed for policies)
CREATE OR REPLACE FUNCTION public.is_chat_participant(_chat_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.chat_participants
    WHERE chat_id = _chat_id
      AND user_id = _user_id
  )
$$;

-- Drop existing policies if they exist (for chats)
DROP POLICY IF EXISTS "Users can view their chats" ON public.chats;
DROP POLICY IF EXISTS "Users can create chats" ON public.chats;
DROP POLICY IF EXISTS "Users can update their chats" ON public.chats;

-- Chats policies (now safe to reference chat_participants)
CREATE POLICY "Users can view their chats" ON public.chats
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants
      WHERE chat_participants.chat_id = chats.id
      AND chat_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create chats" ON public.chats
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their chats" ON public.chats
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants
      WHERE chat_participants.chat_id = chats.id
      AND chat_participants.user_id = auth.uid()
    )
  );

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view chats they participate in" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can view participants in their chats" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can join chats" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can add participants to chats" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can update their chat participation" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can leave chats" ON public.chat_participants;

-- Chat participants policies
CREATE POLICY "Users can view participants in their chats" ON public.chat_participants
  FOR SELECT TO authenticated
  USING (
    public.is_chat_participant(chat_participants.chat_id, auth.uid())
  );

CREATE POLICY "Users can add participants to chats" ON public.chat_participants
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR public.is_chat_participant(chat_id, auth.uid())
  );

CREATE POLICY "Users can update their chat participation" ON public.chat_participants
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can leave chats" ON public.chat_participants
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type message_type DEFAULT 'text',
  is_ephemeral BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_saved BOOLEAN DEFAULT false,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view messages in their chats" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages in their chats" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;

-- Messages policies
CREATE POLICY "Users can view messages in their chats" ON public.messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants
      WHERE chat_participants.chat_id = messages.chat_id
      AND chat_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages in their chats" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.chat_participants
      WHERE chat_participants.chat_id = messages.chat_id
      AND chat_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own messages" ON public.messages
  FOR UPDATE TO authenticated
  USING (auth.uid() = sender_id);

CREATE POLICY "Users can delete their own messages" ON public.messages
  FOR DELETE TO authenticated
  USING (auth.uid() = sender_id);

-- ============================================================================
-- PART 2: ADDITIONAL COLUMNS AND FEATURES
-- ============================================================================

-- Add stealth mode column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_stealth_mode boolean DEFAULT false;

-- Update mood_type enum to include 'none' for No Mood
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'none' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'mood_type')) THEN
    ALTER TYPE public.mood_type ADD VALUE 'none';
  END IF;
END $$;

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

-- Add bio column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT NULL;

-- Add reply_to_id column to messages table for reply threading
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS reply_to_id uuid REFERENCES public.messages(id) ON DELETE SET NULL;

-- Create index for faster reply lookups
CREATE INDEX IF NOT EXISTS idx_messages_reply_to_id ON public.messages(reply_to_id);

-- Add edited_at column to messages table for tracking edits
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS edited_at timestamp with time zone DEFAULT NULL;

-- ============================================================================
-- PART 3: PRESENCE STATUS
-- ============================================================================

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

-- ============================================================================
-- PART 4: READ RECEIPTS AND MEDIA SUPPORT
-- ============================================================================

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

-- ============================================================================
-- PART 5: MESSAGE REACTIONS
-- ============================================================================

-- Create message_reactions table
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- Enable RLS
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view reactions in their chats" ON public.message_reactions;
DROP POLICY IF EXISTS "Users can add reactions in their chats" ON public.message_reactions;
DROP POLICY IF EXISTS "Users can remove their own reactions" ON public.message_reactions;

-- Users can view reactions for messages in chats they participate in
CREATE POLICY "Users can view reactions in their chats" ON public.message_reactions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.id = message_reactions.message_id
      AND public.is_chat_participant(m.chat_id, auth.uid())
    )
  );

-- Users can add reactions to messages in their chats
CREATE POLICY "Users can add reactions in their chats" ON public.message_reactions
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.id = message_reactions.message_id
      AND public.is_chat_participant(m.chat_id, auth.uid())
    )
  );

-- Users can remove their own reactions
CREATE POLICY "Users can remove their own reactions" ON public.message_reactions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- PART 6: STORAGE BUCKETS AND POLICIES
-- ============================================================================

-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own avatar
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own avatar
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own avatar
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to avatars
DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Create storage bucket for chat media if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for chat-images
DROP POLICY IF EXISTS "Users can upload chat images" ON storage.objects;
CREATE POLICY "Users can upload chat images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can view chat images" ON storage.objects;
CREATE POLICY "Users can view chat images"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-images');

DROP POLICY IF EXISTS "Users can delete their chat images" ON storage.objects;
CREATE POLICY "Users can delete their chat images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'chat-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies for chat-media (videos, files, etc.)
DROP POLICY IF EXISTS "Users can upload chat media" ON storage.objects;
CREATE POLICY "Users can upload chat media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can view chat media" ON storage.objects;
CREATE POLICY "Users can view chat media"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-media');

DROP POLICY IF EXISTS "Users can delete their chat media" ON storage.objects;
CREATE POLICY "Users can delete their chat media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'chat-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================================================
-- PART 7: FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || NEW.id)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_chats_updated_at ON public.chats;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chats_updated_at
  BEFORE UPDATE ON public.chats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- PART 8: REALTIME SUBSCRIPTIONS
-- ============================================================================

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Enable realtime for profiles (online status)
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- Enable realtime for friends
ALTER PUBLICATION supabase_realtime ADD TABLE public.friends;
ALTER TABLE public.friends REPLICA IDENTITY FULL;

-- Enable realtime for chat_participants
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_participants;
ALTER TABLE public.chat_participants REPLICA IDENTITY FULL;

-- Enable realtime for reactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;

-- ============================================================================
-- PART 9: COMMENTS AND DOCUMENTATION
-- ============================================================================

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.is_stealth_mode IS 'When true, user appears offline to others and cannot see others online status';
COMMENT ON COLUMN public.profiles.presence_status IS 'User presence status: online, idle, dnd (do not disturb), or invisible';
COMMENT ON COLUMN public.messages.read_at IS 'Timestamp when the message was read by the recipient';
COMMENT ON COLUMN public.messages.image_url IS 'URL to the image file in storage';
COMMENT ON COLUMN public.messages.image_metadata IS 'Metadata about the image (name, size, type, dimensions)';
COMMENT ON COLUMN public.messages.file_url IS 'URL to the file in storage';
COMMENT ON COLUMN public.messages.file_metadata IS 'Metadata about the file (name, size, type)';
COMMENT ON COLUMN public.messages.video_url IS 'URL to the video file in storage';
COMMENT ON COLUMN public.messages.video_metadata IS 'Metadata about the video (name, size, type, duration, thumbnail)';

-- ============================================================================
-- MIGRATION COMPLETE!
-- ============================================================================
-- Your database is now set up with all required tables, columns, policies,
-- storage buckets, and functions for the Divine Connect chat app.
-- ============================================================================
