-- Enable Supabase Realtime for coworker_matches (INSERT events for live match updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.coworker_matches;
