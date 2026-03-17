-- Enable Supabase Realtime for notifications (so NotificationBell can update live)
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
