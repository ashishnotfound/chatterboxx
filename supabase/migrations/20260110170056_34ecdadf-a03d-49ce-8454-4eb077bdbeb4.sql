-- Drop the existing restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view chats they participate in" ON chat_participants;

-- Create a new policy that allows viewing all participants in chats the user belongs to
CREATE POLICY "Users can view participants in their chats"
ON chat_participants
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM chat_participants cp
    WHERE cp.chat_id = chat_participants.chat_id
    AND cp.user_id = auth.uid()
  )
);