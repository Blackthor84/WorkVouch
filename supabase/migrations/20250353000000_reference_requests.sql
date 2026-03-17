-- Reference requests: one user asks a coworker match to provide a reference
CREATE TABLE IF NOT EXISTS public.reference_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  coworker_match_id UUID NOT NULL REFERENCES public.coworker_matches(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reference_requests_receiver ON public.reference_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_reference_requests_requester ON public.reference_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_reference_requests_status ON public.reference_requests(status);

ALTER TABLE public.reference_requests ENABLE ROW LEVEL SECURITY;

-- Requester can insert their own requests and read their own sent requests
CREATE POLICY "Users can insert own reference requests"
  ON public.reference_requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can view reference requests they sent"
  ON public.reference_requests FOR SELECT
  USING (auth.uid() = requester_id);

-- Receiver can view and update (accept/reject) requests sent to them
CREATE POLICY "Receivers can view reference requests sent to them"
  ON public.reference_requests FOR SELECT
  USING (auth.uid() = receiver_id);

CREATE POLICY "Receivers can update reference request status"
  ON public.reference_requests FOR UPDATE
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- Realtime for live incoming-request updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.reference_requests;
