-- Extend plan_tier enum for Stripe tiers: starter, team, security_bundle.
-- Run in Supabase SQL editor once if employer_accounts.plan_tier uses enum plan_tier.
-- (pro may already exist.) If a value already exists, that line will error; skip it.

ALTER TYPE plan_tier ADD VALUE IF NOT EXISTS 'starter';
ALTER TYPE plan_tier ADD VALUE IF NOT EXISTS 'team';
ALTER TYPE plan_tier ADD VALUE IF NOT EXISTS 'security_bundle';
