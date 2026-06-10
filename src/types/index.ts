export interface Profile {
  id: string;
  name: string;
  avatar_url: string | null;
  university: string | null;
  role: "student" | "admin";
  created_at: string;
  updated_at: string;
}

export interface Exam {
  id: string;
  title: string;
  description: string | null;
  time_limit_minutes: number;
  is_published: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  exam_id: string;
  question_text: string;
  options: Record<string, string>; // { "A": "...", "B": "...", "C": "...", "D": "..." }
  correct_option: string; // "A" | "B" | "C" | "D"
  explanation_text: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ExamAttempt {
  id: string;
  user_id: string;
  exam_id: string;
  score: number;
  total_questions: number;
  time_spent_seconds: number;
  completed_at: string;
}

export interface UserAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_option: string | null;
  is_correct: boolean;
  answered_at: string;
}

// Composite types for views / joined queries
export interface ExamWithQuestionCount extends Exam {
  question_count: number;
}

export interface AttemptWithExam extends ExamAttempt {
  exam_title: string;
  percentage: number;
}

export interface QuestionResult extends UserAnswer {
  question_text: string;
  options: Record<string, string>;
  correct_option: string;
  explanation_text: string | null;
}

export type LeaderboardEntry = {
  user_id: string;
  name: string;
  avatar_url: string | null;
  total_exams: number;
  avg_score: number;
  total_score: number;
};
