-- ============================================================
-- NURSING EXAM SCHEMA - CORRECTED
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Profiles ────────────────────────────────────────────────
CREATE TABLE public.profiles (
  id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL DEFAULT ''::text,
  avatar_url text,
  university text,
  role text NOT NULL DEFAULT 'student'::text CHECK (role = ANY (ARRAY['student'::text, 'admin'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  email text UNIQUE NOT NULL,
  password_hash text,
  personal_question text,
  personal_answer_hash text
);

-- ── Exams ────────────────────────────────────────────────────
CREATE TABLE public.exams (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  time_limit_minutes integer NOT NULL DEFAULT 60,
  is_published boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT exams_pkey PRIMARY KEY (id),
  CONSTRAINT exams_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- ── Questions ────────────────────────────────────────────────
CREATE TABLE public.questions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  exam_id uuid NOT NULL,
  question_text text NOT NULL,
  options jsonb NOT NULL,
  correct_option text NOT NULL,
  explanation_text text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT questions_pkey PRIMARY KEY (id),
  CONSTRAINT questions_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exams(id) ON DELETE CASCADE
);

-- ── Exam Attempts ────────────────────────────────────────────
CREATE TABLE public.exam_attempts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  exam_id uuid NOT NULL,
  score integer NOT NULL DEFAULT 0,
  total_questions integer NOT NULL DEFAULT 0,
  time_spent_seconds integer NOT NULL DEFAULT 0,
  completed_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT exam_attempts_pkey PRIMARY KEY (id),
  CONSTRAINT exam_attempts_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exams(id) ON DELETE CASCADE,
  CONSTRAINT exam_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- ── User Answers ─────────────────────────────────────────────
CREATE TABLE public.user_answers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  attempt_id uuid NOT NULL,
  question_id uuid NOT NULL,
  selected_option text,
  is_correct boolean NOT NULL DEFAULT false,
  answered_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_answers_pkey PRIMARY KEY (id),
  CONSTRAINT user_answers_attempt_id_fkey FOREIGN KEY (attempt_id) REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
  CONSTRAINT user_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE
);

-- ── Community Posts ─────────────────────────────────────────
CREATE TABLE public.community_posts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL DEFAULT 'แชร์ความรู้'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT community_posts_pkey PRIMARY KEY (id),
  CONSTRAINT community_posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- ── Community Comments ───────────────────────────────────────
CREATE TABLE public.community_comments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT community_comments_pkey PRIMARY KEY (id),
  CONSTRAINT community_comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.community_posts(id) ON DELETE CASCADE,
  CONSTRAINT community_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- ── Community Likes ──────────────────────────────────────────
CREATE TABLE public.community_likes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT community_likes_pkey PRIMARY KEY (id),
  CONSTRAINT community_likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.community_posts(id) ON DELETE CASCADE,
  CONSTRAINT community_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT community_likes_unique UNIQUE (post_id, user_id)
);

-- ── Satisfaction Questions ───────────────────────────────────
CREATE TABLE public.satisfaction_questions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  question_text text NOT NULL,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT satisfaction_questions_pkey PRIMARY KEY (id)
);

-- ── Satisfaction Responses ───────────────────────────────────
CREATE TABLE public.satisfaction_responses (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE,
  feedback text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT satisfaction_responses_pkey PRIMARY KEY (id),
  CONSTRAINT satisfaction_responses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- ── Satisfaction Scores ─────────────────────────────────────
CREATE TABLE public.satisfaction_scores (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  response_id uuid NOT NULL,
  question_id uuid NOT NULL,
  score integer NOT NULL CHECK (score >= 1 AND score <= 5),
  CONSTRAINT satisfaction_scores_pkey PRIMARY KEY (id),
  CONSTRAINT satisfaction_scores_response_id_fkey FOREIGN KEY (response_id) REFERENCES public.satisfaction_responses(id) ON DELETE CASCADE,
  CONSTRAINT satisfaction_scores_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.satisfaction_questions(id) ON DELETE CASCADE
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_questions_exam_id ON public.questions(exam_id);
CREATE INDEX idx_exam_attempts_user_id ON public.exam_attempts(user_id);
CREATE INDEX idx_exam_attempts_exam_id ON public.exam_attempts(exam_id);
CREATE INDEX idx_user_answers_attempt_id ON public.user_answers(attempt_id);
CREATE INDEX idx_community_posts_user_id ON public.community_posts(user_id);
CREATE INDEX idx_community_comments_post_id ON public.community_comments(post_id);
CREATE INDEX idx_community_likes_post_id ON public.community_likes(post_id);
CREATE INDEX idx_community_likes_user_id ON public.community_likes(user_id);
CREATE INDEX idx_satisfaction_scores_response_id ON public.satisfaction_scores(response_id);
CREATE INDEX idx_satisfaction_scores_question_id ON public.satisfaction_scores(question_id);

-- ============================================================
-- RPC FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION get_leaderboard(limit_count integer DEFAULT 50)
RETURNS TABLE (
  user_id uuid,
  name text,
  avatar_url text,
  total_exams bigint,
  avg_score numeric,
  total_score bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id as user_id,
    p.name,
    p.avatar_url,
    COUNT(ea.id)::bigint as total_exams,
    CASE WHEN COUNT(ea.id) > 0
      THEN ROUND((SUM(CAST(ea.score AS numeric) / CAST(ea.total_questions AS numeric) * 100) / COUNT(ea.id))::numeric, 1)
      ELSE 0
    END as avg_score,
    SUM(ea.score)::bigint as total_score
  FROM profiles p
  LEFT JOIN exam_attempts ea ON ea.user_id = p.id
  WHERE p.role = 'student'
  GROUP BY p.id, p.name, p.avatar_url
  HAVING COUNT(ea.id) > 0
  ORDER BY avg_score DESC, total_score DESC
  LIMIT limit_count;
END;
$$;

CREATE OR REPLACE FUNCTION get_user_rank(target_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_avg numeric;
  user_count bigint;
  rank_val integer;
BEGIN
  SELECT AVG(CAST(score AS numeric) / NULLIF(total_questions, 0) * 100)
  INTO user_avg
  FROM exam_attempts
  WHERE user_id = target_user_id;

  SELECT COUNT(DISTINCT p.id)::bigint
  INTO user_count
  FROM profiles p
  JOIN exam_attempts ea ON ea.user_id = p.id
  WHERE p.role = 'student'
    AND p.id != target_user_id
    AND (
      SELECT AVG(CAST(score AS numeric) / NULLIF(total_questions, 0) * 100)
      FROM exam_attempts
      WHERE user_id = p.id
    ) > user_avg;

  RETURN (user_count + 1)::integer;
END;
$$;