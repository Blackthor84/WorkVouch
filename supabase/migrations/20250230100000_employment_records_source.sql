-- Add source to employment_records: 'resume' | 'manual' for audit and pipeline.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'employment_records' AND column_name = 'source') THEN
    ALTER TABLE public.employment_records ADD COLUMN source TEXT DEFAULT 'manual';
  END IF;
END $$;
COMMENT ON COLUMN public.employment_records.source IS 'resume = from resume parsing; manual = user or API.';
