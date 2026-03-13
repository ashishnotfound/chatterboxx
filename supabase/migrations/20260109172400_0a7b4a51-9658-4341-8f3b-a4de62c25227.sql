-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can join chats" ON public.chat_participants;

-- Create a more flexible policy that allows:
-- 1. Users to add themselves to a chat
-- 2. Users who are already participants to add others (for creating chats with friends)
CREATE POLICY "Users can add participants to chats"
ON public.chat_participants
FOR INSERT
TO authenticated
WITH CHECK (
  -- User can always add themselves
  auth.uid() = user_id
  OR
  -- User can add others if they are already a participant in the same chat
  -- (This handles the case where both inserts happen in the same transaction)
  EXISTS (
    SELECT 1 FROM public.chat_participants cp
    WHERE cp.chat_id = chat_id AND cp.user_id = auth.uid()
  )
  OR
  -- Allow adding participants to a chat that was just created (no participants yet)
  -- This is needed for the initial chat creation flow
  NOT EXISTS (
    SELECT 1 FROM public.chat_participants cp
    WHERE cp.chat_id = chat_id
  )
);