-- Saved hiring impact calculator runs (per authenticated user / profile id)
CREATE TABLE IF NOT EXISTS public.hiring_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  salary INTEGER NOT NULL CHECK (salary > 0 AND salary <= 100000000),
  training_weeks INTEGER NOT NULL CHECK (training_weeks >= 0 AND training_weeks <= 520),
  replacement_weeks INTEGER NOT NULL CHECK (replacement_weeks >= 0 AND replacement_weeks <= 520),
  total_cost INTEGER NOT NULL CHECK (total_cost >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hiring_calculations_user_created
  ON public.hiring_calculations(user_id, created_at DESC);

ALTER TABLE public.hiring_calculations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own hiring calculations" ON public.hiring_calculations;
CREATE POLICY "Users manage own hiring calculations"
  ON public.hiring_calculations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.hiring_calculations IS 'User-saved hiring impact calculator inputs and computed total cost.';
