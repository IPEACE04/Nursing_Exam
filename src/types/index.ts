export interface Profile {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  university: string | null;
  password_hash: string;
  role: "student" | "admin";
  created_at: string;
  updated_at: string;
}

export type ExamType = "normal" | "pre_post_test";

export interface Exam {
  id: string;
  title: string;
  description: string | null;
  time_limit_minutes: number;
  is_published: boolean;
  type: ExamType;
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

// ── Community ─────────────────────────────────────────────────────
export interface CommunityPost {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
}

export interface CommunityComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface CommunityPostWithAuthor extends CommunityPost {
  author_name: string;
  author_avatar_url: string | null;
  like_count: number;
  comment_count: number;
}

export interface CommunityPostDetail extends CommunityPostWithAuthor {
  has_liked: boolean;
}

export interface CommunityCommentWithAuthor extends CommunityComment {
  author_name: string;
  author_avatar_url: string | null;
}

// ── Satisfaction Survey ──────────────────────────────────────────
export interface SatisfactionCategory {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface SatisfactionQuestion {
  id: string;
  question_text: string;
  category_id: string | null;
  category_name?: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface SatisfactionScore {
  question_id: string;
  question_text: string;
  category_name: string | null;
  score: number;
}

export interface SatisfactionResponse {
  id: string;
  user_id: string;
  feedback: string | null;
  created_at: string;
  scores: SatisfactionScore[];
}

export interface SatisfactionAnalysis {
  total_responses: number;
  average_per_question: {
    question_id: string;
    question_text: string;
    category_id: string;
    category_name: string;
    avg_score: number;
    total_scores: number;
  }[];
  categories: {
    category_id: string;
    category_name: string;
    avg_score: number;
    total_scores: number;
    questions: {
      question_id: string;
      question_text: string;
      avg_score: number;
    }[];
  }[];
  feedbacks: {
    user_name: string;
    feedback: string;
    created_at: string;
  }[];
}

export interface ProgressComparison {
  preTest: {
    score: number;
    total: number;
    percentage: number;
    completed_at: string;
  } | null;
  postTest: {
    score: number;
    total: number;
    percentage: number;
    completed_at: string;
  } | null;
  improvement: number;
  hasCompletedAllNormalExams: boolean;
  hasCompletedPreTest: boolean;
  hasCompletedPostTest: boolean;
  remainingExams: { id: string; title: string }[];
  unlockableExams: boolean;
}

export interface PrePostTestGate {
  preTestCompleted: boolean;
  postTestUnlocked: boolean;
  postTestCompleted: boolean;
  prePostExamId: string | null;
  remainingExams: { id: string; title: string }[];
}
