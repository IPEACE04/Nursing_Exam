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
  const current = formData.get("current") === "true";

  const { error } = await supabase
    .from("exams")
    .update({ is_published: !current })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/exams");
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
