-- Create message_requests table
CREATE TABLE IF NOT EXISTS message_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(sender_id, receiver_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_message_requests_sender_id ON message_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_message_requests_receiver_id ON message_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_message_requests_created_at ON message_requests(created_at);

-- Add comments
COMMENT ON TABLE message_requests IS 'Message requests between users who are not yet connected';
COMMENT ON COLUMN message_requests.message IS 'The initial message sent with the request';

-- Enable RLS
ALTER TABLE message_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own requests" ON message_requests
FOR SELECT USING (
  auth.uid() = sender_id OR 
  auth.uid() = receiver_id
);

CREATE POLICY "Users can create requests" ON message_requests
FOR INSERT WITH CHECK (
  auth.uid() = sender_id
);

CREATE POLICY "Users can delete their sent requests" ON message_requests
FOR DELETE USING (
  auth.uid() = sender_id
);

CREATE POLICY "Users can delete requests sent to them" ON message_requests
FOR DELETE USING (
  auth.uid() = receiver_id
);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_message_requests_updated_at 
BEFORE UPDATE ON message_requests 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
