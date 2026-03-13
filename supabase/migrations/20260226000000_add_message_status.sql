-- Add status and seen_at to messages table
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS status text DEFAULT 'sent' CHECK (status IN ('sending', 'sent', 'seen'));
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS seen_at timestamp with time zone;

-- Update existing messages to 'seen' if is_read is true, otherwise 'sent'
UPDATE public.messages SET status = 'seen', seen_at = read_at WHERE is_read = true;
UPDATE public.messages SET status = 'sent' WHERE is_read = false;

-- Function to handle unread count increment on new message
CREATE OR REPLACE FUNCTION public.handle_new_message_unread_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment unread_count for all participants except the sender
  UPDATE public.chat_participants
  SET unread_count = unread_count + 1
  WHERE chat_id = NEW.chat_id
    AND user_id != NEW.sender_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_message_inserted_unread_count ON public.messages;
CREATE TRIGGER on_message_inserted_unread_count
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_message_unread_count();

-- Sync is_read with status and handle unread count reset
CREATE OR REPLACE FUNCTION public.sync_message_status_on_read()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'seen' AND OLD.status != 'seen' THEN
    NEW.seen_at = now();
    NEW.is_read = true;
    
    -- When a message is marked as seen, we can't easily decrement unread_count 
    -- because we don't know which user performed the action here.
    -- Unread count reset is better handled by a direct update to chat_participants.
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_status_on_read_trigger ON public.messages;
CREATE TRIGGER sync_status_on_read_trigger
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_message_status_on_read();
