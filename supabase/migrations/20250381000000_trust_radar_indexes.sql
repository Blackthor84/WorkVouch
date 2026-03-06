-- Optional: explicit index on source_profile_id for trust graph depth / radar queries
CREATE INDEX IF NOT EXISTS idx_trust_relationships_source ON public.trust_relationships(source_profile_id);
