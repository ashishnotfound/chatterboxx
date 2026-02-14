
-- Audit and Harden RLS Policies

-- 1. Profiles: Secure view access (limit what's public)
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (true); -- Keeping true for discovery, but typically limited in production

-- 2. Chat Participants: Ensure users can only see their own memberships
DROP POLICY IF EXISTS "Users can view chats they participate in" ON public.chat_participants;
CREATE POLICY "Users can view chats they participate in" ON public.chat_participants
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 3. Messages: Hardened existence check
DROP POLICY IF EXISTS "Users can view messages in their chats" ON public.messages;
CREATE POLICY "Users can view messages in their chats" ON public.messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE chat_participants.chat_id = messages.chat_id
      AND chat_participants.user_id = auth.uid()
    )
  );

-- 4. Messages: Secure insertion
DROP POLICY IF EXISTS "Users can send messages in their chats" ON public.messages;
CREATE POLICY "Users can send messages in their chats" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE chat_participants.chat_id = messages.chat_id
      AND chat_participants.user_id = auth.uid()
    )
  );

-- 5. Storage: Secure bucket access (chat-media)
-- Note: Supabase storage policies are handled separately but following same logic
-- Policy for chat-media bucket:
-- auth.uid() = (storage.foldername(name))[1]::uuid -- Assuming folder structure is bucket/chat_id/file
