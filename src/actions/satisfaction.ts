"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSessionUserId } from "@/lib/auth";
import type {
  SatisfactionQuestion,
  SatisfactionCategory,
  SatisfactionAnalysis,
} from "@/types";

async function requireAdmin() {
  const userId = await getSessionUserId();
  if (!userId) return null;
  const supabase = createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  if (profile?.role !== "admin") return null;
  return { supabase, userId };
}

export async function getQuestions() {
  const supabase = createSupabaseServerClient();

  const { data } = await supabase
    .from("satisfaction_questions")
    .select("*, satisfaction_categories!inner(name)")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
    id: r.id as string,
    question_text: r.question_text as string,
    category_id: r.category_id as string | null,
    category_name: (r.satisfaction_categories as { name: string } | null)?.name ?? null,
    sort_order: r.sort_order as number,
    is_active: r.is_active as boolean,
    created_at: r.created_at as string,
  })) as SatisfactionQuestion[];
}

export async function hasSubmitted() {
  const userId = await getSessionUserId();
  if (!userId) return false;

  const supabase = createSupabaseServerClient();

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

  const supabase = createSupabaseServerClient();

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

// ── Category CRUD ──────────────────────────────────────────────────

export async function getCategories() {
  const auth = await requireAdmin();
  if (!auth) return [];
  const { supabase } = auth;

  const { data } = await supabase
    .from("satisfaction_categories")
    .select("*")
    .order("sort_order", { ascending: true });

  return (data ?? []) as SatisfactionCategory[];
}

export async function addCategory(formData: FormData) {
  const auth = await requireAdmin();
  if (!auth) return { error: "ไม่มีสิทธิ์เข้าถึง" };

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "กรุณากรอกชื่อหมวดหมู่" };

  const { supabase } = auth;

  const { count } = await supabase
    .from("satisfaction_categories")
    .select("*", { count: "exact", head: true });

  const { error } = await supabase.from("satisfaction_categories").insert({
    name,
    sort_order: (count ?? 0) + 1,
  });

  if (error) return { error: "เกิดข้อผิดพลาด" };
  revalidatePath("/admin/satisfaction");
  return { success: true };
}

export async function updateCategory(id: string, formData: FormData) {
  const auth = await requireAdmin();
  if (!auth) return { error: "ไม่มีสิทธิ์เข้าถึง" };

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "กรุณากรอกชื่อหมวดหมู่" };

  const { supabase } = auth;

  await supabase
    .from("satisfaction_categories")
    .update({ name })
    .eq("id", id);

  revalidatePath("/admin/satisfaction");
  return { success: true };
}

export async function deleteCategory(id: string) {
  const auth = await requireAdmin();
  if (!auth) return { error: "ไม่มีสิทธิ์เข้าถึง" };

  const { supabase } = auth;

  await supabase
    .from("satisfaction_questions")
    .update({ category_id: null })
    .eq("category_id", id);

  await supabase.from("satisfaction_categories").delete().eq("id", id);

  revalidatePath("/admin/satisfaction");
  return { success: true };
}

// ── Admin Question CRUD ────────────────────────────────────────────

export async function getAdminQuestions() {
  const auth = await requireAdmin();
  if (!auth) return [];
  const { supabase } = auth;

  const { data } = await supabase
    .from("satisfaction_questions")
    .select("*, satisfaction_categories(name)")
    .order("sort_order", { ascending: true });

  return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
    id: r.id as string,
    question_text: r.question_text as string,
    category_id: r.category_id as string | null,
    category_name: (r.satisfaction_categories as { name: string } | null)?.name ?? null,
    sort_order: r.sort_order as number,
    is_active: r.is_active as boolean,
    created_at: r.created_at as string,
  })) as SatisfactionQuestion[];
}

export async function addQuestion(formData: FormData) {
  const auth = await requireAdmin();
  if (!auth) return { error: "ไม่มีสิทธิ์เข้าถึง" };

  const questionText = formData.get("question_text") as string;
  const categoryId = (formData.get("category_id") as string) || null;
  if (!questionText) return { error: "กรุณากรอกคำถาม" };

  const { supabase } = auth;

  let countQuery = supabase
    .from("satisfaction_questions")
    .select("*", { count: "exact", head: true });

  if (categoryId) {
    countQuery = countQuery.eq("category_id", categoryId);
  } else {
    countQuery = countQuery.is("category_id", null);
  }

  const { count } = await countQuery;

  const { error } = await supabase.from("satisfaction_questions").insert({
    question_text: questionText,
    category_id: categoryId || null,
    sort_order: (count ?? 0) + 1,
  });

  if (error) return { error: "เกิดข้อผิดพลาด" };
  revalidatePath("/admin/satisfaction");
  return { success: true };
}

export async function updateQuestion(id: string, formData: FormData) {
  const auth = await requireAdmin();
  if (!auth) return { error: "ไม่มีสิทธิ์เข้าถึง" };

  const questionText = formData.get("question_text") as string;
  const categoryId = (formData.get("category_id") as string) || null;
  const isActive = formData.get("is_active") === "true";

  if (!questionText) return { error: "กรุณากรอกคำถาม" };

  const { supabase } = auth;

  await supabase
    .from("satisfaction_questions")
    .update({ question_text: questionText, category_id: categoryId, is_active: isActive })
    .eq("id", id);

  revalidatePath("/admin/satisfaction");
  return { success: true };
}

export async function deleteQuestion(id: string) {
  const auth = await requireAdmin();
  if (!auth) return { error: "ไม่มีสิทธิ์เข้าถึง" };

  const { supabase } = auth;
  await supabase.from("satisfaction_questions").delete().eq("id", id);
  revalidatePath("/admin/satisfaction");
  return { success: true };
}

export async function getAnalysis(): Promise<SatisfactionAnalysis | null> {
  const auth = await requireAdmin();
  if (!auth) return null;
  const { supabase } = auth;

  const { count: totalResponses } = await supabase
    .from("satisfaction_responses")
    .select("*", { count: "exact", head: true });

  const { data: responses } = await supabase
    .from("satisfaction_responses")
    .select(
      `
      *,
      profiles:user_id ( name )
    `
    )
    .order("created_at", { ascending: false });

  const { data: avgRows } = await supabase.rpc("get_satisfaction_analysis");

  const averagePerQuestion = ((avgRows ?? []) as Record<string, unknown>[]).map((r) => ({
    question_id: r.question_id as string,
    question_text: r.question_text as string,
    category_id: (r.category_id as string) ?? "",
    category_name: (r.category_name as string) ?? "ทั่วไป",
    avg_score: Number(r.avg_score ?? 0),
    total_scores: Number(r.total_scores ?? 0),
  }));

  const categoryMap = new Map<
    string,
    { id: string; avg_scores: number[]; total_scores: number; questions: { question_id: string; question_text: string; avg_score: number }[] }
  >();

  averagePerQuestion.forEach((q) => {
    const key = q.category_name;
    if (!categoryMap.has(key)) {
      categoryMap.set(key, { id: q.category_id, avg_scores: [], total_scores: 0, questions: [] });
    }
    const entry = categoryMap.get(key)!;
    entry.avg_scores.push(q.avg_score);
    entry.total_scores += q.total_scores;
    entry.questions.push({
      question_id: q.question_id,
      question_text: q.question_text,
      avg_score: q.avg_score,
    });
  });

  const categories = Array.from(categoryMap.entries()).map(([category_name, data]) => ({
    category_id: data.id,
    category_name,
    avg_score: data.avg_scores.length > 0
      ? Math.round((data.avg_scores.reduce((a, b) => a + b, 0) / data.avg_scores.length) * 10) / 10
      : 0,
    total_scores: data.total_scores,
    questions: data.questions,
  }));

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
    categories,
    feedbacks,
  };
}
