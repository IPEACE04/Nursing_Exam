-- ============================================================
-- Migration: Revocable sessions
-- Every session JWT carries the user's session_version.
-- Changing it (logout, password change/reset) invalidates all
-- existing tokens for that user. Existing tokens have no version,
-- so every user is logged out once after this migration.
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS session_version uuid NOT NULL DEFAULT gen_random_uuid();
