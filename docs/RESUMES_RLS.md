# Resumes table – RLS for GET /api/resumes

The `resumes` table uses RLS. For the user-scoped client (anon key + JWT) to read rows, a SELECT policy must allow `user_id = auth.uid()`.

## Required policy (already in migration `20250230000000_resumes_and_review_trust.sql`)

If GET /api/resumes returns a Supabase error, ensure this policy exists in your database:

```sql
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own resumes" ON public.resumes;
CREATE POLICY "Users can view own resumes"
  ON public.resumes
  FOR SELECT
  USING (auth.uid() = user_id);
```

## Table and columns (for reference)

- **Table:** `public.resumes`
- **Columns used by API:** `id`, `user_id`, `organization_id`, `file_path`, `status`, `parsed_data`, `parsing_error`, `created_at`
- **Filter:** `user_id = auth.uid()` (via `.eq("user_id", user.id)` with authenticated client)

## Common causes of "Failed to fetch resumes"

1. **RLS blocks rows** – Policy missing or not applied; run the SQL above.
2. **Table not created** – Run the full migration `20250230000000_resumes_and_review_trust.sql`.
3. **JWT not sent** – The route uses `supabaseServer()` (cookies); ensure the request includes the session cookie so `auth.uid()` is set.
