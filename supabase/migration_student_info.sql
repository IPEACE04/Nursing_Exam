-- ============================================================
-- Migration: Add student info fields to profiles
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS age integer;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS student_id text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gpa numeric(3,2);
