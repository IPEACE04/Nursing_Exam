-- ============================================================
-- Nursing Exam - Row Level Security (RLS) Policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_answers ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES
-- ============================================================
-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Profile is created via trigger on auth.users insert
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- EXAMS
-- ============================================================
-- Anyone authenticated can view published exams
CREATE POLICY "Anyone can view published exams"
  ON public.exams FOR SELECT
  USING (is_published = true);

-- Admins can view all exams (published + drafts)
CREATE POLICY "Admins can view all exams"
  ON public.exams FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- Admins can insert exams
CREATE POLICY "Admins can insert exams"
  ON public.exams FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- Admins can update exams
CREATE POLICY "Admins can update exams"
  ON public.exams FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- Admins can delete exams
CREATE POLICY "Admins can delete exams"
  ON public.exams FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- ============================================================
-- QUESTIONS
-- ============================================================
-- Anyone authenticated can view questions of published exams
CREATE POLICY "Anyone can view questions of published exams"
  ON public.questions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.exams
    WHERE exams.id = questions.exam_id AND exams.is_published = true
  ));

-- Admins can view all questions
CREATE POLICY "Admins can view all questions"
  ON public.questions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- Admins can insert questions
CREATE POLICY "Admins can insert questions"
  ON public.questions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- Admins can update questions
CREATE POLICY "Admins can update questions"
  ON public.questions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- Admins can delete questions
CREATE POLICY "Admins can delete questions"
  ON public.questions FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- ============================================================
-- EXAM ATTEMPTS
-- ============================================================
-- Users can view their own attempts
CREATE POLICY "Users can view own attempts"
  ON public.exam_attempts FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own attempts
CREATE POLICY "Users can insert own attempts"
  ON public.exam_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all attempts (for monitoring)
CREATE POLICY "Admins can view all attempts"
  ON public.exam_attempts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- ============================================================
-- USER ANSWERS
-- ============================================================
-- Users can view their own answers (through attempt)
CREATE POLICY "Users can view own answers"
  ON public.user_answers FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.exam_attempts
    WHERE exam_attempts.id = user_answers.attempt_id
      AND exam_attempts.user_id = auth.uid()
  ));

-- Users can insert their own answers
CREATE POLICY "Users can insert own answers"
  ON public.user_answers FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.exam_attempts
    WHERE exam_attempts.id = user_answers.attempt_id
      AND exam_attempts.user_id = auth.uid()
  ));

-- Admins can view all answers (for monitoring)
CREATE POLICY "Admins can view all answers"
  ON public.user_answers FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));
