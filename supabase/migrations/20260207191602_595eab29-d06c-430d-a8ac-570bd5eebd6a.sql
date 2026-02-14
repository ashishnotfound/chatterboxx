-- Add edited_at column to messages table for tracking edits
ALTER TABLE public.messages 
ADD COLUMN edited_at timestamp with time zone DEFAULT NULL;