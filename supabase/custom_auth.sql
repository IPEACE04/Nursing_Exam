-- ============================================================
-- Custom Auth Migration
-- Replace Supabase Auth with local users table
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Add columns to profiles (becomes our users table)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- 2. Populate email from auth.users for existing users
UPDATE public.profiles p
SET email = au.email
FROM auth.users au
WHERE au.id = p.id AND p.email IS NULL;

-- 3. Make email NOT NULL after populating
ALTER TABLE public.profiles
  ALTER COLUMN email SET NOT NULL,
  ALTER COLUMN password_hash SET NOT NULL;

-- 4. Drop FK from profiles to auth.users, make id auto-generated
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 5. Drop FKs from other tables pointing to auth.users
ALTER TABLE public.exam_attempts
  DROP CONSTRAINT IF EXISTS exam_attempts_user_id_fkey;

ALTER TABLE public.exams
  DROP CONSTRAINT IF EXISTS exams_created_by_fkey;

-- 6. Add new FKs pointing to public.profiles
ALTER TABLE public.exam_attempts
  ADD CONSTRAINT exam_attempts_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.exams
  ADD CONSTRAINT exams_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 7. Remove the old auth trigger (auto-create profile on signup)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 8. Grant permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO anon;
