-- ============================================================
-- Custom Auth Migration
-- ============================================================

-- 1. Add columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- 2. Populate email from auth.users for existing users
UPDATE public.profiles p
SET email = au.email
FROM auth.users au
WHERE au.id = p.id AND p.email IS NULL;

-- 3. Drop FKs to auth.users
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.exam_attempts DROP CONSTRAINT IF EXISTS exam_attempts_user_id_fkey;
ALTER TABLE public.exams DROP CONSTRAINT IF EXISTS exams_created_by_fkey;

-- 4. Add new FKs to public.profiles
ALTER TABLE public.exam_attempts
  ADD CONSTRAINT exam_attempts_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.exams
  ADD CONSTRAINT exams_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 5. Remove old auth trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
