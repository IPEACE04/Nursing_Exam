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

  const { data: attempts } = await supabase
    .from("exam_attempts")
    .select("score, total_questions");

  let avgScore = 0;
  if (attempts && attempts.length > 0) {
    const totalPct = attempts.reduce(
      (sum, a) =>
        sum +
        (a.total_questions > 0
          ? (a.score / a.total_questions) * 100
          : 0),
      0
    );
    avgScore = Math.round(totalPct / attempts.length);
  }

  const { data: wrongAnswers } = await supabase
    .from("user_answers")
    .select("is_correct, questions!inner ( question_text )");

  let itemAnalysis: { question: string; errorRate: number; total: number }[] = [];
  if (wrongAnswers) {
    const grouped: Record<string, { question_text: string; wrong: number; total: number }> = {};
    wrongAnswers.forEach((a) => {
      const q = a.questions as unknown as { question_text: string };
      const text = q?.question_text ?? "Unknown";
      if (!grouped[text]) grouped[text] = { question_text: text, wrong: 0, total: 0 };
      grouped[text].total++;
      if (!a.is_correct) grouped[text].wrong++;
    });
    itemAnalysis = Object.values(grouped)
      .map((g) => ({
        question: g.question_text.length > 40
          ? g.question_text.slice(0, 40) + "..."
          : g.question_text,
        errorRate: Math.round((g.wrong / g.total) * 100),
        total: g.total,
      }))
      .sort((a, b) => b.errorRate - a.errorRate)
      .slice(0, 10);
  }

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
