-- Create a security definer function to check if user is participant
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

-- Drop the existing INSERT policy causing recursion
DROP POLICY IF EXISTS "Users can add participants to chats" ON public.chat_participants;

-- Create new INSERT policy using the security definer function
CREATE POLICY "Users can add participants to chats"
ON public.chat_participants
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  OR public.is_chat_participant(chat_id, auth.uid())
);