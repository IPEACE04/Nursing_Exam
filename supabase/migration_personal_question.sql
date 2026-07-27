-- Migration: Add personal question fields to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS personal_question text,
ADD COLUMN IF NOT EXISTS personal_answer_hash text;
