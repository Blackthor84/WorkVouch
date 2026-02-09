-- Enable Education and Construction verticals so users can select them in onboarding/sandbox.
UPDATE public.platform_verticals
SET enabled = true
WHERE name IN ('education', 'construction');
