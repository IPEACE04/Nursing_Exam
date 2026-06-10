-- ============================================================
-- Leaderboard RPC Functions
-- Run this in Supabase SQL Editor after migration + RLS
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_leaderboard(limit_count INT DEFAULT 50)
RETURNS TABLE (
  user_id UUID,
  name TEXT,
  avatar_url TEXT,
  university TEXT,
  total_exams BIGINT,
  avg_score NUMERIC,
  total_score BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    p.id AS user_id,
    p.name,
    p.avatar_url,
    p.university,
    COUNT(ea.id) AS total_exams,
    CASE
      WHEN SUM(ea.total_questions) > 0
      THEN ROUND((SUM(ea.score)::numeric / SUM(ea.total_questions)::numeric) * 100)
      ELSE 0
    END AS avg_score,
    SUM(ea.score)::bigint AS total_score
  FROM public.profiles p
  INNER JOIN public.exam_attempts ea ON ea.user_id = p.id
  WHERE p.role = 'student'
  GROUP BY p.id, p.name, p.avatar_url, p.university
  HAVING COUNT(ea.id) > 0
  ORDER BY avg_score DESC, total_exams DESC, total_score DESC
  LIMIT limit_count;
$$;

CREATE OR REPLACE FUNCTION public.get_user_rank(target_user_id UUID DEFAULT auth.uid())
RETURNS INT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  WITH ranked AS (
    SELECT
      p.id AS user_id,
      ROW_NUMBER() OVER (
        ORDER BY
          CASE
            WHEN SUM(ea.total_questions) > 0
            THEN (SUM(ea.score)::numeric / SUM(ea.total_questions)::numeric) * 100
            ELSE 0
          END DESC,
          COUNT(ea.id) DESC,
          SUM(ea.score) DESC
      ) AS rank
    FROM public.profiles p
    INNER JOIN public.exam_attempts ea ON ea.user_id = p.id
    WHERE p.role = 'student'
    GROUP BY p.id
    HAVING COUNT(ea.id) > 0
  )
  SELECT rank::int FROM ranked WHERE user_id = target_user_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_leaderboard(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_rank(UUID) TO authenticated;
