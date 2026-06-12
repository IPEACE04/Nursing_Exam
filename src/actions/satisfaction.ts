"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSessionUserId } from "@/lib/auth";
import type {
  SatisfactionQuestion,
  SatisfactionAnalysis,
} from "@/types";

export async function getQuestions() {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("satisfaction_questions")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return (data ?? []) as SatisfactionQuestion[];
}

export async function hasSubmitted() {
  const userId = await getSessionUserId();
  if (!userId) return false;

  const supabase = await createSupabaseServerClient();

  const { count } = await supabase
    .from("satisfaction_responses")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  return (count ?? 0) > 0;
}

export async function submitSurvey(formData: FormData) {
  const userId = await getSessionUserId();
  if (!userId) return { error: "กรุณาเข้าสู่ระบบ" };

  const feedback = (formData.get("feedback") as string) || null;
  const scoresRaw = formData.get("scores") as string;

  if (!scoresRaw) return { error: "กรุณาตอบคำถามให้ครบทุกข้อ" };

  let scores: Record<string, number>;
  try {
    scores = JSON.parse(scoresRaw);
  } catch {
    return { error: "ข้อมูลไม่ถูกต้อง" };
  }

  const supabase = await createSupabaseServerClient();

  // Check already submitted
  const { count: existing } = await supabase
    .from("satisfaction_responses")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if ((existing ?? 0) > 0) {
    return { error: "คุณได้ทำแบบประเมินไปแล้ว" };
  }

  const { data: response, error: rError } = await supabase
    .from("satisfaction_responses")
    .insert({ user_id: userId, feedback })
    .select("id")
    .single();

  if (rError || !response) return { error: "เกิดข้อผิดพลาด กรุณาลองใหม่" };

  const scoresToInsert = Object.entries(scores).map(([questionId, score]) => ({
    response_id: response.id,
    question_id: questionId,
    score,
  }));

  const { error: sError } = await supabase
    .from("satisfaction_scores")
    .insert(scoresToInsert);

  if (sError) return { error: "เกิดข้อผิดพลาด กรุณาลองใหม่" };

  revalidatePath("/satisfaction");
  return { success: true };
}

// ── Admin Actions ─────────────────────────────────────────────────
export async function getAdminQuestions() {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("satisfaction_questions")
    .select("*")
    .order("sort_order", { ascending: true });

  return (data ?? []) as SatisfactionQuestion[];
}

export async function addQuestion(formData: FormData) {
  const questionText = formData.get("question_text") as string;
  if (!questionText) return { error: "กรุณากรอกคำถาม" };

  const supabase = await createSupabaseServerClient();

  const { count } = await supabase
    .from("satisfaction_questions")
    .select("*", { count: "exact", head: true });

  const { error } = await supabase.from("satisfaction_questions").insert({
    question_text: questionText,
    sort_order: (count ?? 0) + 1,
  });

  if (error) return { error: "เกิดข้อผิดพลาด" };
  revalidatePath("/admin/satisfaction");
  return { success: true };
}

export async function updateQuestion(id: string, formData: FormData) {
  const questionText = formData.get("question_text") as string;
  const isActive = formData.get("is_active") === "true";

  if (!questionText) return { error: "กรุณากรอกคำถาม" };

  const supabase = await createSupabaseServerClient();

  await supabase
    .from("satisfaction_questions")
    .update({ question_text: questionText, is_active: isActive })
    .eq("id", id);

  revalidatePath("/admin/satisfaction");
  return { success: true };
}

export async function deleteQuestion(id: string) {
  const supabase = await createSupabaseServerClient();
  await supabase.from("satisfaction_questions").delete().eq("id", id);
  revalidatePath("/admin/satisfaction");
  return { success: true };
}

export async function getAnalysis(): Promise<SatisfactionAnalysis> {
  const supabase = await createSupabaseServerClient();

  const { count: totalResponses } = await supabase
    .from("satisfaction_responses")
    .select("*", { count: "exact", head: true });

  const { data: questions } = await supabase
    .from("satisfaction_questions")
    .select("*")
    .order("sort_order", { ascending: true });

  const { data: responses } = await supabase
    .from("satisfaction_responses")
    .select(
      `
      *,
      profiles:user_id ( name )
    `
    )
    .order("created_at", { ascending: false });

  const averagePerQuestion = await Promise.all(
    (questions ?? []).map(async (q) => {
      const { data: scores } = await supabase
        .from("satisfaction_scores")
        .select("score")
        .eq("question_id", q.id);

      const totalScores = (scores ?? []).reduce((sum, s) => sum + s.score, 0);
      const count = (scores ?? []).length;

      return {
        question_id: q.id,
        question_text: q.question_text,
        avg_score: count > 0 ? Math.round((totalScores / count) * 10) / 10 : 0,
        total_scores: count,
      };
    })
  );

  const feedbacks = (responses ?? [])
    .filter((r) => r.feedback)
    .map((r) => {
      const p = r.profiles as unknown as { name: string } | null;
      return {
        user_name: p?.name ?? "ไม่ระบุ",
        feedback: r.feedback ?? "",
        created_at: r.created_at,
      };
    });

  return {
    total_responses: totalResponses ?? 0,
    average_per_question: averagePerQuestion,
    feedbacks,
  };
}
