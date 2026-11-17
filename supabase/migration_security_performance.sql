-- Security + performance hardening.
-- Requires SUPABASE_SERVICE_ROLE_KEY on every server environment:
-- the app calls RPCs and reads community tables only via service_role.

BEGIN;

-- 1. RPC functions: block anon/authenticated (browser anon key) from /rest/v1/rpc/*
DO $$
DECLARE
  fn text;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'public.get_admin_avg_score()',
    'public.get_leaderboard(integer)',
    'public.get_satisfaction_analysis()',
    'public.get_test_leaderboard(integer)',
    'public.get_test_user_rank(uuid)',
    'public.get_user_rank(uuid)',
    'public.get_worst_questions(integer)',
    'public.handle_updated_at()',
    -- unused by the app, closed for the same reason
    'public.get_comment_count(uuid)',
    'public.get_like_count(uuid)',
    'public.has_liked(uuid)',
    'public.toggle_like(uuid)'
  ] LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn);
    -- bodies use unqualified table names, so search_path must include public
    EXECUTE format('ALTER FUNCTION %s SET search_path = public, pg_temp', fn);
  END LOOP;
END $$;

-- 2. Community tables: no public read through the REST API
DROP POLICY IF EXISTS "Public can view posts" ON public.community_posts;
DROP POLICY IF EXISTS "Public can view comments" ON public.community_comments;
DROP POLICY IF EXISTS "Public can view likes" ON public.community_likes;

-- 3. Duplicate indexes (same column as idx_*_post_id / idx_*_question_id)
DROP INDEX IF EXISTS public.idx_community_comments_post_count;
DROP INDEX IF EXISTS public.idx_community_likes_post_count;
DROP INDEX IF EXISTS public.idx_satisfaction_scores_question;

-- 4. Missing foreign-key indexes
CREATE INDEX IF NOT EXISTS idx_community_comments_user_id ON public.community_comments (user_id);
CREATE INDEX IF NOT EXISTS idx_exams_created_by ON public.exams (created_by);
CREATE INDEX IF NOT EXISTS idx_satisfaction_questions_category_id ON public.satisfaction_questions (category_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_question_id ON public.user_answers (question_id);

COMMIT;
