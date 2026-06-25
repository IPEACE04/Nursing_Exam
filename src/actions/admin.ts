"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSessionUserId } from "@/lib/auth";

async function requireAdmin() {
  const userId = await getSessionUserId();
  if (!userId) throw new Error("Unauthorized");

  const supabase = createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (profile?.role !== "admin") throw new Error("Forbidden");
  return { supabase, userId };
}

export async function createExam(formData: FormData) {
  const { supabase, userId } = await requireAdmin();
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const timeLimit = parseInt(formData.get("timeLimit") as string, 10) || 60;

  const { error } = await supabase.from("exams").insert({
    title,
    description,
    time_limit_minutes: timeLimit,
    is_published: false,
    created_by: userId,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/exams");
  redirect("/admin/exams");
}

export async function updateExam(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = formData.get("id") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const timeLimit = parseInt(formData.get("timeLimit") as string, 10) || 60;

  const { error } = await supabase
    .from("exams")
    .update({ title, description, time_limit_minutes: timeLimit })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/exams");
  redirect("/admin/exams");
}

export async function deleteExam(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = formData.get("id") as string;

  const { data: attempts } = await supabase
    .from("exam_attempts")
    .select("id")
    .eq("exam_id", id);

  if (attempts && attempts.length > 0) {
    const attemptIds = attempts.map((a) => a.id);
    await supabase.from("user_answers").delete().in("attempt_id", attemptIds);
    await supabase.from("exam_attempts").delete().eq("exam_id", id);
  }

  await supabase.from("questions").delete().eq("exam_id", id);

  const { error } = await supabase.from("exams").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/exams");
}

export async function togglePublish(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = formData.get("id") as string;
  const is_published = formData.get("is_published") === "true";

  const { error } = await supabase
    .from("exams")
    .update({ is_published: !is_published })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/exams");
  revalidatePath("/exam");
}

export async function createQuestion(formData: FormData) {
  const { supabase } = await requireAdmin();
  const examId = formData.get("examId") as string;
  const questionText = formData.get("questionText") as string;
  const optionA = formData.get("optionA") as string;
  const optionB = formData.get("optionB") as string;
  const optionC = formData.get("optionC") as string;
  const optionD = formData.get("optionD") as string;
  const correctOption = formData.get("correctOption") as string;
  const explanation = formData.get("explanation") as string;

  const { count } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true })
    .eq("exam_id", examId);

  const sortOrder = (count ?? 0) + 1;

  const { error } = await supabase.from("questions").insert({
    exam_id: examId,
    question_text: questionText,
    options: { A: optionA, B: optionB, C: optionC, D: optionD },
    correct_option: correctOption,
    explanation_text: explanation || null,
    sort_order: sortOrder,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/exams/${examId}`);
}

export async function updateQuestion(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = formData.get("id") as string;
  const examId = formData.get("examId") as string;
  const questionText = formData.get("questionText") as string;
  const optionA = formData.get("optionA") as string;
  const optionB = formData.get("optionB") as string;
  const optionC = formData.get("optionC") as string;
  const optionD = formData.get("optionD") as string;
  const correctOption = formData.get("correctOption") as string;
  const explanation = formData.get("explanation") as string;

  const { error } = await supabase
    .from("questions")
    .update({
      question_text: questionText,
      options: { A: optionA, B: optionB, C: optionC, D: optionD },
      correct_option: correctOption,
      explanation_text: explanation || null,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/exams/${examId}`);
}

export async function deleteQuestion(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = formData.get("id") as string;
  const examId = formData.get("examId") as string;

  const { error } = await supabase.from("questions").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/exams/${examId}`);
}

export async function getAdminExams() {
  await requireAdmin();
  const supabase = createSupabaseServerClient();

  const { data } = await supabase
    .from("exams")
    .select("*, questions ( id )")
    .neq("type", "pre_post_test")
    .order("created_at", { ascending: false });

  if (!data) return [];

  return data.map((e: Record<string, unknown>) => ({
    id: e.id as string,
    title: e.title as string,
    description: e.description as string | null,
    time_limit_minutes: e.time_limit_minutes as number,
    is_published: e.is_published as boolean,
    question_count: ((e.questions as { id: string }[] | null)?.length ?? 0),
    created_at: e.created_at as string,
  }));
}

export async function getAdminStats() {
  await requireAdmin();
  const supabase = createSupabaseServerClient();

  const [{ count: totalUsers }, { count: totalAttempts }, { count: totalExams }] =
    await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("exam_attempts").select("*", { count: "exact", head: true }),
      supabase.from("exams").select("*", { count: "exact", head: true }),
    ]);

  const { data: avgResult } = await supabase.rpc("get_admin_avg_score");
  const avgScore = Math.round(Number((avgResult as unknown as number) ?? 0));

  const { data: itemRows } = await supabase.rpc("get_worst_questions", { limit_count: 10 });
  const itemAnalysis = ((itemRows ?? []) as Record<string, unknown>[]).map((r) => ({
    question: String(r.question ?? ""),
    errorRate: Number(r.error_rate ?? 0),
    total: Number(r.total ?? 0),
  }));

  return {
    totalUsers: totalUsers ?? 0,
    totalAttempts: totalAttempts ?? 0,
    avgScore,
    totalExams: totalExams ?? 0,
    itemAnalysis,
  };
}

export async function getExamWithQuestions(examId: string) {
  await requireAdmin();
  const supabase = createSupabaseServerClient();

  const { data: exam } = await supabase
    .from("exams")
    .select("title, description, time_limit_minutes")
    .eq("id", examId)
    .single();

  if (!exam) return null;

  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .eq("exam_id", examId)
    .order("sort_order", { ascending: true });

  return {
    exam: exam as { title: string; description: string | null; time_limit_minutes: number },
    questions: (questions ?? []) as Record<string, unknown>[],
  };
}

export async function createPrePostExam(formData: FormData) {
  const { supabase, userId } = await requireAdmin();
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const timeLimit = parseInt(formData.get("timeLimit") as string, 10) || 60;

  const { data: existing } = await supabase
    .from("exams")
    .select("id")
    .eq("type", "pre_post_test")
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("exams")
      .update({ title, description, time_limit_minutes: timeLimit })
      .eq("id", existing.id);

    if (error) throw new Error(error.message);
    revalidatePath("/admin/pre-post-test");
    redirect("/admin/pre-post-test");
  }

  const { error } = await supabase.from("exams").insert({
    title,
    description,
    time_limit_minutes: timeLimit,
    is_published: false,
    type: "pre_post_test",
    created_by: userId,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/pre-post-test");
  redirect("/admin/pre-post-test");
}

export async function getPrePostExam() {
  await requireAdmin();
  const supabase = createSupabaseServerClient();

  const { data: exam } = await supabase
    .from("exams")
    .select("*")
    .eq("type", "pre_post_test")
    .maybeSingle();

  if (!exam) return null;

  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .eq("exam_id", exam.id)
    .order("sort_order", { ascending: true });

  return {
    exam: exam as { id: string; title: string; description: string | null; time_limit_minutes: number; is_published: boolean },
    questions: (questions ?? []) as unknown as Record<string, unknown>[],
  };
}

export async function createPrePostQuestion(formData: FormData) {
  const { supabase } = await requireAdmin();
  const examId = formData.get("examId") as string;
  const questionText = formData.get("questionText") as string;
  const optionA = formData.get("optionA") as string;
  const optionB = formData.get("optionB") as string;
  const optionC = formData.get("optionC") as string;
  const optionD = formData.get("optionD") as string;
  const correctOption = formData.get("correctOption") as string;
  const explanation = formData.get("explanation") as string;

  const { count } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true })
    .eq("exam_id", examId);

  const sortOrder = (count ?? 0) + 1;

  const { error } = await supabase.from("questions").insert({
    exam_id: examId,
    question_text: questionText,
    options: { A: optionA, B: optionB, C: optionC, D: optionD },
    correct_option: correctOption,
    explanation_text: explanation || null,
    sort_order: sortOrder,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/pre-post-test");
}

export async function updatePrePostQuestion(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = formData.get("id") as string;
  const questionText = formData.get("questionText") as string;
  const optionA = formData.get("optionA") as string;
  const optionB = formData.get("optionB") as string;
  const optionC = formData.get("optionC") as string;
  const optionD = formData.get("optionD") as string;
  const correctOption = formData.get("correctOption") as string;
  const explanation = formData.get("explanation") as string;

  const { error } = await supabase
    .from("questions")
    .update({
      question_text: questionText,
      options: { A: optionA, B: optionB, C: optionC, D: optionD },
      correct_option: correctOption,
      explanation_text: explanation || null,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/pre-post-test");
}

export async function deletePrePostQuestion(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = formData.get("id") as string;

  const { error } = await supabase.from("questions").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/pre-post-test");
}

export async function togglePrePostPublish(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = formData.get("id") as string;
  const is_published = formData.get("is_published") === "true";

  const { error } = await supabase
    .from("exams")
    .update({ is_published: !is_published })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/pre-post-test");
  revalidatePath("/exam");
}
