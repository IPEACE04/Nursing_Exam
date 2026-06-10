export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          avatar_url: string | null;
          university: string | null;
          role: "student" | "admin";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name?: string;
          avatar_url?: string | null;
          university?: string | null;
          role?: "student" | "admin";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          avatar_url?: string | null;
          university?: string | null;
          role?: "student" | "admin";
          created_at?: string;
          updated_at?: string;
        };
      };
      exams: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          time_limit_minutes: number;
          is_published: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          time_limit_minutes?: number;
          is_published?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          time_limit_minutes?: number;
          is_published?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      questions: {
        Row: {
          id: string;
          exam_id: string;
          question_text: string;
          options: Json;
          correct_option: string;
          explanation_text: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          exam_id: string;
          question_text: string;
          options: Json;
          correct_option: string;
          explanation_text?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          exam_id?: string;
          question_text?: string;
          options?: Json;
          correct_option?: string;
          explanation_text?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      exam_attempts: {
        Row: {
          id: string;
          user_id: string;
          exam_id: string;
          score: number;
          total_questions: number;
          time_spent_seconds: number;
          completed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          exam_id: string;
          score?: number;
          total_questions?: number;
          time_spent_seconds?: number;
          completed_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          exam_id?: string;
          score?: number;
          total_questions?: number;
          time_spent_seconds?: number;
          completed_at?: string;
        };
      };
      user_answers: {
        Row: {
          id: string;
          attempt_id: string;
          question_id: string;
          selected_option: string | null;
          is_correct: boolean;
          answered_at: string;
        };
        Insert: {
          id?: string;
          attempt_id: string;
          question_id: string;
          selected_option?: string | null;
          is_correct?: boolean;
          answered_at?: string;
        };
        Update: {
          id?: string;
          attempt_id?: string;
          question_id?: string;
          selected_option?: string | null;
          is_correct?: boolean;
          answered_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
