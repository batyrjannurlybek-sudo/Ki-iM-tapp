-- ============================================================================
-- Migration: store verification badge + plan expiry (founding stores / subscription).
-- Run once in the Supabase SQL Editor.
-- ============================================================================
alter table stores add column if not exists is_verified boolean not null default false;
alter table stores add column if not exists plan_until timestamptz;

-- is_verified  -> shows a blue check next to the store name.
-- plan_until   -> access/subscription expiry. For the first 20 "founding" stores
--                 admin sets +2 years; for others +1 month (free trial), then renew.
