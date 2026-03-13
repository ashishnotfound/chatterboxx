-- Fix infinite recursion in chat_participants SELECT policy by using the security definer function

-- Ensure RLS is enabled (idempotent)
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;

-- Drop the recursive SELECT policy
DROP POLICY IF EXISTS "Users can view participants in their chats" ON public.chat_participants;

-- Recreate SELECT policy without referencing chat_participants inside the policy
CREATE POLICY "Users can view participants in their chats"
ON public.chat_participants
FOR SELECT
TO authenticated
USING (
  public.is_chat_participant(chat_participants.chat_id, auth.uid())
);
