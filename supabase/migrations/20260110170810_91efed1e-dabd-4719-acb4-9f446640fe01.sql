-- Fix INSERT RLS policy for chat_participants (was using cp.chat_id = cp.chat_id)

DROP POLICY IF EXISTS "Users can add participants to chats" ON public.chat_participants;

CREATE POLICY "Users can add participants to chats"
ON public.chat_participants
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1
    FROM public.chat_participants cp
    WHERE cp.chat_id = chat_participants.chat_id
      AND cp.user_id = auth.uid()
  )
);
