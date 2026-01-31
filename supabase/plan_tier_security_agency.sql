-- Add security_agency to plan_tier enum (Security Agency Bundle).
-- Idempotent: safe to run if value already exists.

ALTER TYPE plan_tier ADD VALUE IF NOT EXISTS 'security_agency';
