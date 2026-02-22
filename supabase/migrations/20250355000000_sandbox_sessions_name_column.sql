-- Ensure sandbox_sessions has name column (generate-company inserts it).
-- Older migration 20250129700000 may have created the table without name; 20250205000000 uses IF NOT EXISTS so column may be missing.
ALTER TABLE public.sandbox_sessions
  ADD COLUMN IF NOT EXISTS name TEXT;
