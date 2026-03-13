-- Tighten overly-permissive chats INSERT policy

ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create chats" ON public.chats;

CREATE POLICY "Users can create chats"
ON public.chats
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);
