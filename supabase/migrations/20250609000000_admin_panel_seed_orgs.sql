-- Optional idempotent seed rows for admin Organizations UI (visible in production admin when mode=production, demo=false)
INSERT INTO public.organizations (name, slug, billing_tier, mode, demo, created_at, updated_at)
SELECT 'Seed Organization Alpha', 'wv-seed-org-alpha', 'starter'::billing_tier_enum, 'production', false, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.organizations WHERE slug = 'wv-seed-org-alpha');

INSERT INTO public.organizations (name, slug, billing_tier, mode, demo, created_at, updated_at)
SELECT 'Seed Organization Beta', 'wv-seed-org-beta', 'starter'::billing_tier_enum, 'production', false, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.organizations WHERE slug = 'wv-seed-org-beta');
