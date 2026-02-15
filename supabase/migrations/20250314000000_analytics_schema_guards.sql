-- ============================================================================
-- ANALYTICS SCHEMA GUARDS — Fail closed.
-- Inserts MUST fail if required fields (path, event_type) are missing or empty.
-- See docs/schema/analytics_schema.md. Idempotent.
-- ============================================================================

-- site_page_views: path is required and must be non-empty
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'site_page_views_path_required'
  ) THEN
    ALTER TABLE public.site_page_views
    ADD CONSTRAINT site_page_views_path_required
    CHECK (path IS NOT NULL AND trim(path) <> '');
  END IF;
END $$;

-- site_events: event_type is required and must be non-empty
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'site_events_event_type_required'
  ) THEN
    ALTER TABLE public.site_events
    ADD CONSTRAINT site_events_event_type_required
    CHECK (event_type IS NOT NULL AND trim(event_type) <> '');
  END IF;
END $$;

COMMENT ON CONSTRAINT site_page_views_path_required ON public.site_page_views IS 'Canonical contract: path required. Analytics inserts must supply non-empty path.';
COMMENT ON CONSTRAINT site_events_event_type_required ON public.site_events IS 'Canonical contract: event_type required. Analytics inserts must supply non-empty event_type.';
