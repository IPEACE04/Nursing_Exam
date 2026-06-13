-- ============================================================
-- NURSEUP PERFORMANCE OPTIMIZATION
-- Run in Supabase SQL Editor
-- ============================================================

-- ── 1. Missing Indexes ──────────────────────────────────────

-- exams: published + ordered by created_at (HOT PATH)
CREATE INDEX IF NOT EXISTS idx_exams_published_created
  ON public.exams (is_published, created_at DESC);

-- community_posts: category filter + created_at sort
CREATE INDEX IF NOT EXISTS idx_community_posts_category_created
  ON public.community_posts (category, created_at DESC);

-- satisfaction_questions: active filter + sort_order
CREATE INDEX IF NOT EXISTS idx_satisfaction_questions_active_sort
  ON public.satisfaction_questions (is_active, sort_order);

-- exam_attempts: cooldown check (user_id + exam_id + completed_at)
CREATE INDEX IF NOT EXISTS idx_exam_attempts_user_exam_completed
  ON public.exam_attempts (user_id, exam_id, completed_at DESC);

-- exam_attempts: user history (user_id + completed_at)
CREATE INDEX IF NOT EXISTS idx_exam_attempts_user_completed
  ON public.exam_attempts (user_id, completed_at DESC);

-- community_likes: unique constraint already exists, but adding partial index for counts
CREATE INDEX IF NOT EXISTS idx_community_likes_post_count
  ON public.community_likes (post_id);

-- community_comments: count by post
CREATE INDEX IF NOT EXISTS idx_community_comments_post_count
  ON public.community_comments (post_id);

-- satisfaction_scores: group by question for analysis
CREATE INDEX IF NOT EXISTS idx_satisfaction_scores_question
  ON public.satisfaction_scores (question_id);


-- ── 2. Optimized RPC: get_user_rank (no correlated subquery) ─

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
    LEFT JOIN exam_attempts ea ON ea.user_id = p.id
    WHERE p.role = 'student'
    GROUP BY p.id
  ) ranked
  WHERE ranked.id = target_user_id;

  RETURN COALESCE(rank_val, 0);
END;
$$;


-- ── 3. Optimized RPC: get_leaderboard (no correlated subquery) ─

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
  LEFT JOIN exam_attempts ea ON ea.user_id = p.id
  WHERE p.role = 'student'
  GROUP BY p.id, p.name, p.avatar_url
  HAVING COUNT(ea.id) > 0
  ORDER BY avg_score DESC, total_score DESC
  LIMIT limit_count;
END;
$$;


-- ── 4. RPC: get satisfaction analysis in single query ──────

CREATE OR REPLACE FUNCTION get_satisfaction_analysis()
RETURNS TABLE (
  question_id uuid,
  question_text text,
  avg_score numeric,
  total_scores bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    sq.id,
    sq.question_text,
    ROUND(AVG(ss.score)::numeric, 1) AS avg_score,
    COUNT(ss.id)::bigint AS total_scores
  FROM satisfaction_questions sq
  LEFT JOIN satisfaction_scores ss ON ss.question_id = sq.id
  WHERE sq.is_active = true
  GROUP BY sq.id, sq.question_text, sq.sort_order
  ORDER BY sq.sort_order ASC;
$$;

-- ── 5. RPC: admin avg score (single query) ──────────────────

CREATE OR REPLACE FUNCTION get_admin_avg_score()
RETURNS numeric
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT ROUND(AVG(CASE WHEN total_questions > 0
    THEN (score::numeric / total_questions) * 100
    ELSE 0 END))
  FROM exam_attempts;
$$;

-- ── 6. RPC: worst questions for admin dashboard ─────────────

CREATE OR REPLACE FUNCTION get_worst_questions(limit_count integer DEFAULT 10)
RETURNS TABLE (
  question text,
  error_rate integer,
  total bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    CASE WHEN length(q.question_text) > 40
      THEN left(q.question_text, 40) || '...'
      ELSE q.question_text
    END AS question,
    ROUND((COUNT(*) FILTER (WHERE NOT ua.is_correct)::numeric / COUNT(*)) * 100)::integer AS error_rate,
    COUNT(*)::bigint AS total
  FROM user_answers ua
  JOIN questions q ON q.id = ua.question_id
  GROUP BY q.question_text
  ORDER BY error_rate DESC
  LIMIT limit_count;
$$;
