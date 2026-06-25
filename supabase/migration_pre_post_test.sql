-- ============================================================
-- Migration: PreTest / PostTest — Update Leaderboard Functions
-- ============================================================
-- Exclude pre_post_test exam attempts from leaderboard rankings
-- so only normal exam scores count toward ranking.

-- ── 1. Update get_user_rank ──────────────────────────────────────

DROP FUNCTION IF EXISTS get_user_rank(uuid) CASCADE;

CREATE OR REPLACE FUNCTION get_user_rank(target_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rank_val integer;
BEGIN
  SELECT rn INTO rank_val
  FROM (
    SELECT
      p.id,
      ROW_NUMBER() OVER (
        ORDER BY
          CASE WHEN COUNT(ea.id) > 0
            THEN AVG(CAST(ea.score AS numeric) / NULLIF(ea.total_questions, 0) * 100)
            ELSE 0
          END DESC,
          COALESCE(SUM(ea.score), 0) DESC
      ) AS rn
    FROM profiles p
    LEFT JOIN exam_attempts ea
      INNER JOIN exams ex ON ex.id = ea.exam_id AND ex.type = 'normal'
      ON ea.user_id = p.id
    WHERE p.role = 'student'
    GROUP BY p.id
  ) ranked
  WHERE ranked.id = target_user_id;

  RETURN COALESCE(rank_val, 0);
END;
$$;

-- ── 2. Update get_leaderboard ────────────────────────────────────

DROP FUNCTION IF EXISTS get_leaderboard(integer) CASCADE;

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
    p.id AS user_id,
    p.name,
    p.avatar_url,
    COUNT(ea.id)::bigint AS total_exams,
    CASE WHEN COUNT(ea.id) > 0
      THEN ROUND(AVG(CAST(ea.score AS numeric) / NULLIF(ea.total_questions, 0) * 100)::numeric, 1)
      ELSE 0
    END AS avg_score,
    COALESCE(SUM(ea.score), 0)::bigint AS total_score
  FROM profiles p
  LEFT JOIN exam_attempts ea
    INNER JOIN exams ex ON ex.id = ea.exam_id AND ex.type = 'normal'
    ON ea.user_id = p.id
  WHERE p.role = 'student'
  GROUP BY p.id, p.name, p.avatar_url
  HAVING COUNT(ea.id) > 0
  ORDER BY avg_score DESC, total_score DESC
  LIMIT limit_count;
END;
$$;

-- ── 3. Update get_admin_avg_score ────────────────────────────────

DROP FUNCTION IF EXISTS get_admin_avg_score() CASCADE;

CREATE OR REPLACE FUNCTION get_admin_avg_score()
RETURNS numeric
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    COALESCE(
      ROUND(AVG(CAST(ea.score AS numeric) / NULLIF(ea.total_questions, 0) * 100)::numeric, 1),
      0
    )
  FROM exam_attempts ea
  JOIN exams ex ON ex.id = ea.exam_id AND ex.type = 'normal';
$$;

-- ── 4. Update get_worst_questions ────────────────────────────────

DROP FUNCTION IF EXISTS get_worst_questions(integer) CASCADE;

CREATE OR REPLACE FUNCTION get_worst_questions(limit_count integer DEFAULT 10)
RETURNS TABLE (
  question text,
  error_rate numeric,
  total bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    q.question_text AS question,
    ROUND(
      100.0 * COUNT(ua.id) FILTER (WHERE ua.is_correct = false)
      / NULLIF(COUNT(ua.id), 0)::numeric,
      1
    ) AS error_rate,
    COUNT(ua.id)::bigint AS total
  FROM user_answers ua
  JOIN questions q ON q.id = ua.question_id
  JOIN exams ex ON ex.id = q.exam_id AND ex.type = 'normal'
  GROUP BY q.id, q.question_text
  ORDER BY error_rate DESC
  LIMIT limit_count;
$$;
