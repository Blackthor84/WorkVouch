-- Enable Supabase realtime for activity_log (INSERT events for live activity feed)
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_log;
