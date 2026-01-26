-- ============================================================================
-- Messages Table for Coworker Messaging
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS messages_sender_id_idx 
  ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_recipient_id_idx 
  ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx 
  ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS messages_conversation_idx 
  ON public.messages(sender_id, recipient_id, created_at);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own messages" ON public.messages
  FOR SELECT USING (
    sender_id = auth.uid() OR recipient_id = auth.uid()
  );

CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update own sent messages" ON public.messages
  FOR UPDATE USING (sender_id = auth.uid());

CREATE POLICY "Recipients can mark messages as read" ON public.messages
  FOR UPDATE USING (recipient_id = auth.uid());
