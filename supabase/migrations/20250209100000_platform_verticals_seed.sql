-- Seed remaining platform_verticals for admin toggle (Education, Construction already exist).
INSERT INTO public.platform_verticals (name, enabled) VALUES
  ('security', true),
  ('healthcare', true),
  ('law_enforcement', true),
  ('retail', true),
  ('hospitality', true),
  ('warehouse_and_logistics', true)
ON CONFLICT (name) DO NOTHING;
