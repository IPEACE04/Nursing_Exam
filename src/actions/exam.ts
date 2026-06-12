"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSessionUserId } from "@/lib/auth";

const SUBMIT_COOLDOWN_MS = 30_000;

export async function getPublishedExams() {
  const supabase = createSupabaseServerClient();

  const { data } = await supabase
    .from("exams")
    .select("*, questions ( id )")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (!data) return [];

  return data
    .filter((e) => {
      const qs = e.questions as unknown as { id: string }[] | null;
      return (qs?.length ?? 0) > 0;
    })
    .map((e) => ({
      ...e,
      question_count: (e.questions as unknown as { id: string }[]).length,
    }));
}

export async function submitExam(formData: FormData) {
  const userId = await getSessionUserId();
  if (!userId) throw new Error("Unauthorized");

  const supabase = createSupabaseServerClient();

  const examId = formData.get("examId") as string;
  const answersRaw = formData.get("answers") as string;
  const timeSpentRaw = formData.get("timeSpentSeconds") as string;

  if (!examId || !answersRaw) throw new Error("Missing data");

  const { data: recentAttempt } = await supabase
    .from("exam_attempts")
    .select("id")
    .eq("user_id", userId)
    .eq("exam_id", examId)
    .gte("completed_at", new Date(Date.now() - SUBMIT_COOLDOWN_MS).toISOString())
    .maybeSingle();

  if (recentAttempt) {
    redirect(`/exam/${examId}/result/${recentAttempt.id}`);
  }

  let answers: Record<string, string>;
  try {
    answers = JSON.parse(answersRaw);
  } catch {
    throw new Error("Invalid answers data");
  }
  const timeSpentSeconds = parseInt(timeSpentRaw, 10) || 0;

  const { data: questions, error: qError } = await supabase
    .from("questions")
    .select("id, correct_option")
    .eq("exam_id", examId);

  if (qError || !questions) throw new Error("Failed to load questions");

  const totalQuestions = questions.length;
  let score = 0;
  const userAnswers = questions.map((q: { id: string; correct_option: string }) => {
    const selected = answers[q.id] || null;
    const isCorrect = selected === q.correct_option;
    if (isCorrect) score++;
    return {
      question_id: q.id,
      selected_option: selected,
      is_correct: isCorrect,
    };
  });

  const { data: attempt, error: aError } = await supabase
    .from("exam_attempts")
    .insert({
      user_id: userId,
      exam_id: examId,
      score,
      total_questions: totalQuestions,
      time_spent_seconds: timeSpentSeconds,
    })
    .select("id")
    .single();

  if (aError || !attempt) throw new Error("Failed to create attempt");

  const { error: uaError } = await supabase.from("user_answers").insert(
    userAnswers.map((ua: Record<string, unknown>) => ({
      attempt_id: attempt.id,
      ...ua,
    }))
  );

  if (uaError) throw new Error("Failed to save answers");

  redirect(`/exam/${examId}/result/${attempt.id}`);
}
