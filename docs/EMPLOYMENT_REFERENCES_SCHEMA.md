# employment_references – schema and mismatch fix

## Correct table name

**`public.employment_references`** is the correct table for employment / peer references. It is created in:

- `supabase/migrations/20250129000002_references_fraud_trust.sql`

If you see `relation "public.employment_references" does not exist`, the database is missing this table (e.g. migration `20250129000002` was not run).

## Fix: ensure table exists

1. **Run migrations in order** so `20250129000002_references_fraud_trust.sql` runs (it creates `employment_references`).
2. **Or** run the idempotent fix migration:
   - `supabase/migrations/20250230100001_ensure_employment_references.sql`
   - This does `CREATE TABLE IF NOT EXISTS public.employment_references (...)` and adds `sentiment` / `trust_weight` if missing.
   - Requires `employment_matches` and `profiles` to already exist (from `20250129000001` and base schema).

## Corrected ALTER TABLE (when table exists)

To add `sentiment` and `trust_weight` only when the table already exists:

```sql
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employment_references') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'employment_references' AND column_name = 'sentiment') THEN
      ALTER TABLE public.employment_references ADD COLUMN sentiment NUMERIC(3,2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'employment_references' AND column_name = 'trust_weight') THEN
      ALTER TABLE public.employment_references ADD COLUMN trust_weight NUMERIC(5,2) DEFAULT 1.0;
    END IF;
  END IF;
END $$;
```

This is already applied in `20250230000000_resumes_and_review_trust.sql` (ALTER block is now conditional on the table existing).

## Other tables (not the same)

| Table | Purpose |
|-------|--------|
| `public.references` | Older job-based references (schema.sql). |
| `public.workforce_peer_references` | Workforce environment peer refs (20250218000000). |
| `public.employment_references` | **Canonical** peer references for confirmed employment matches. |

API and app code correctly use **employment_references**; no renames were required.

## Files that reference employment_references

- **Migrations:** 20250129000002, 20250129000010, 20250129500000, 20250203000000, 20250203200000, 20250204000000, 20250222000000, 20250230000000, 20250230100001
- **API routes:** app/api/employment-references, app/api/employer/*, app/api/admin/* (peer-reviews, export, bulk, simulation-lab, enterprise-load-simulation, etc.)
- **Lib:** lib/team-fit-engine.ts, lib/trustScore.ts, lib/core/reviews.ts, lib/network-density.ts, lib/risk-model.ts, lib/intelligence/*, lib/core/intelligence/adapters/production.ts, lib/admin/runAnomalyChecks.ts
- **Types:** types/database.ts

No code changes were needed; the table name was already correct. The fix was making migrations safe when the table is missing and adding an ensure migration.
