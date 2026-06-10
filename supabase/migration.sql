-- ============================================================
-- Nursing Exam - Database Schema Migration
-- Supabase / PostgreSQL
-- ============================================================

-- 0. Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROFILES TABLE
-- Extended user profile linked to Supabase Auth (auth.users)
-- ============================================================
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL DEFAULT '',
  avatar_url  TEXT,
  university  TEXT,
  role        TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 2. EXAMS TABLE
-- Exam sets / ชุดข้อสอบ
-- ============================================================
CREATE TABLE public.exams (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title               TEXT NOT NULL,
  description         TEXT,
  time_limit_minutes  INTEGER NOT NULL DEFAULT 60,
  is_published        BOOLEAN NOT NULL DEFAULT false,
  created_by          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_exams_updated_at
  BEFORE UPDATE ON public.exams
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 3. QUESTIONS TABLE
-- Individual questions within an exam
-- ============================================================
CREATE TABLE public.questions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id           UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  question_text     TEXT NOT NULL,
  options           JSONB NOT NULL,           -- { "A": "option text", "B": "...", "C": "...", "D": "..." }
  correct_option    TEXT NOT NULL,            -- "A", "B", "C", or "D"
  explanation_text  TEXT,
  sort_order        INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_questions_exam_id ON public.questions(exam_id);

CREATE TRIGGER set_questions_updated_at
  BEFORE UPDATE ON public.questions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 4. EXAM ATTEMPTS TABLE
-- Records of each exam attempt by a student
-- ============================================================
CREATE TABLE public.exam_attempts (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id             UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  score               INTEGER NOT NULL DEFAULT 0,        -- correct answers count
  total_questions     INTEGER NOT NULL DEFAULT 0,
  time_spent_seconds  INTEGER NOT NULL DEFAULT 0,
  completed_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_attempts_user_id ON public.exam_attempts(user_id);
CREATE INDEX idx_attempts_exam_id ON public.exam_attempts(exam_id);
CREATE INDEX idx_attempts_completed_at ON public.exam_attempts(completed_at DESC);

-- ============================================================
-- 5. USER ANSWERS TABLE
-- Individual answer per question in an attempt
-- ============================================================
CREATE TABLE public.user_answers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id      UUID NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
  question_id     UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_option TEXT,                                   -- "A", "B", "C", "D", or NULL if not answered
  is_correct      BOOLEAN NOT NULL DEFAULT false,
  answered_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(attempt_id, question_id)
);

CREATE INDEX idx_user_answers_attempt_id ON public.user_answers(attempt_id);

-- ============================================================
-- 6. AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
