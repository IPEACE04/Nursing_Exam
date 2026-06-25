-- ============================================================
-- Migration: Satisfaction Categories (new table approach)
-- ============================================================
-- Safe to re-run. Checks column existence before migrating.

-- 1. Create categories table
CREATE TABLE IF NOT EXISTS satisfaction_categories (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT satisfaction_categories_pkey PRIMARY KEY (id)
);

-- 2. Ensure default category exists
INSERT INTO satisfaction_categories (name, sort_order)
SELECT 'ทั่วไป', 0
WHERE NOT EXISTS (SELECT 1 FROM satisfaction_categories WHERE name = 'ทั่วไป');

-- 3. Add category_id column (if not exists)
ALTER TABLE satisfaction_questions ADD COLUMN IF NOT EXISTS category_id uuid
  REFERENCES satisfaction_categories(id);

-- 4. Migrate existing text categories → only if old column still exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'satisfaction_questions' AND column_name = 'category'
  ) THEN
    -- Insert distinct categories from old text field
    INSERT INTO satisfaction_categories (name)
    SELECT DISTINCT sq.category
    FROM satisfaction_questions sq
    WHERE sq.category IS NOT NULL
      AND sq.category != ''
      AND NOT EXISTS (SELECT 1 FROM satisfaction_categories sc WHERE sc.name = sq.category);

    -- Link questions to new categories by name
    UPDATE satisfaction_questions sq
    SET category_id = sc.id
    FROM satisfaction_categories sc
    WHERE sq.category = sc.name
      AND sq.category_id IS NULL;

    -- Drop old text column
    ALTER TABLE satisfaction_questions DROP COLUMN category;
  END IF;
END $$;

-- 5. Assign remaining NULLs to default
UPDATE satisfaction_questions
SET category_id = (SELECT id FROM satisfaction_categories WHERE name = 'ทั่วไป')
WHERE category_id IS NULL;

-- 6. Update RPC
DROP FUNCTION IF EXISTS get_satisfaction_analysis() CASCADE;

CREATE OR REPLACE FUNCTION get_satisfaction_analysis()
RETURNS TABLE (
  question_id uuid,
  question_text text,
  category_id uuid,
  category_name text,
  avg_score numeric,
  total_scores bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    sq.id,
    sq.question_text,
    sc.id AS category_id,
    COALESCE(sc.name, 'ทั่วไป') AS category_name,
    ROUND(AVG(ss.score)::numeric, 1) AS avg_score,
    COUNT(ss.id)::bigint AS total_scores
  FROM satisfaction_questions sq
  LEFT JOIN satisfaction_categories sc ON sc.id = sq.category_id
  LEFT JOIN satisfaction_scores ss ON ss.question_id = sq.id
  GROUP BY sq.id, sq.question_text, sc.id, sc.name
  ORDER BY sc.sort_order, sc.name, sq.sort_order;
$$;
