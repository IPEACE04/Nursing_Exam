-- ============================================================
-- Migration: Test Leaderboard (PostTest only — latest attempt)
-- ============================================================

DROP FUNCTION IF EXISTS get_test_leaderboard(integer) CASCADE;
DROP FUNCTION IF EXISTS get_test_user_rank(uuid) CASCADE;

CREATE OR REPLACE FUNCTION get_test_leaderboard(limit_count integer DEFAULT 50)
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
  WITH latest_post AS (
    SELECT DISTINCT ON (ea.user_id)
      ea.user_id,
      ea.score,
      ea.total_questions
    FROM exam_attempts ea
    JOIN exams ex ON ex.id = ea.exam_id AND ex.type = 'pre_post_test'
    ORDER BY ea.user_id, ea.completed_at DESC
  )
  SELECT
    p.id AS user_id,
    p.name,
    p.avatar_url,
    1::bigint AS total_exams,
    ROUND((lp.score::numeric / NULLIF(lp.total_questions, 0) * 100)::numeric, 1) AS avg_score,
    lp.score::bigint AS total_score
  FROM profiles p
  JOIN latest_post lp ON lp.user_id = p.id
  WHERE p.role = 'student'
  ORDER BY avg_score DESC, total_score DESC
  LIMIT limit_count;
END;
$$;

CREATE OR REPLACE FUNCTION get_test_user_rank(target_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rank_val integer;
BEGIN
  WITH latest_post AS (
    SELECT DISTINCT ON (ea.user_id)
      ea.user_id,
      ea.score,
      ea.total_questions
    FROM exam_attempts ea
    JOIN exams ex ON ex.id = ea.exam_id AND ex.type = 'pre_post_test'
    ORDER BY ea.user_id, ea.completed_at DESC
  )
  SELECT rn INTO rank_val
  FROM (
    SELECT
      lp.user_id,
      ROW_NUMBER() OVER (
        ORDER BY
          (lp.score::numeric / NULLIF(lp.total_questions, 0) * 100) DESC,
          lp.score DESC
      ) AS rn
    FROM latest_post lp
    JOIN profiles p ON p.id = lp.user_id
    WHERE p.role = 'student'
  ) ranked
  WHERE ranked.user_id = target_user_id;

  RETURN COALESCE(rank_val, 0);
END;
$$;
