"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSessionUserId } from "@/lib/auth";
import { getPublicImageUrl, parseOptionImagePaths } from "@/lib/storage";

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

export async function getExamSession(examId: string) {
  const supabase = createSupabaseServerClient();

  const { data: exam } = await supabase
    .from("exams")
    .select("title, description, time_limit_minutes, type")
    .eq("id", examId)
    .eq("is_published", true)
    .single();

  if (!exam) return null;

  const { data: questions } = await supabase
    .from("questions")
    .select("id, exam_id, question_text, options, question_image_path, option_image_paths, sort_order, created_at, updated_at")
    .eq("exam_id", examId)
    .order("sort_order", { ascending: true });

  return {
    exam: exam as { title: string; description: string | null; time_limit_minutes: number; type: string },
    questions: (questions ?? []).map((question) => {
      const row = question as Record<string, unknown>;
      const optionPaths = parseOptionImagePaths(row.option_image_paths);
      return {
        ...question,
        question_image_url: typeof row.question_image_path === "string" ? getPublicImageUrl("exam-media", row.question_image_path) : null,
        option_image_urls: Object.fromEntries(Object.entries(optionPaths).map(([key, path]) => [key, getPublicImageUrl("exam-media", path)])),
      };
    }),
  };
}

export async function getExamResult(attemptId: string) {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const supabase = createSupabaseServerClient();

  const { data: attemptRow } = await supabase
    .from("exam_attempts")
    .select("*, exams ( title )")
    .eq("id", attemptId)
    .single();

  if (!attemptRow) return null;

  const attempt = attemptRow as Record<string, unknown>;
  if (attempt.user_id !== userId) return null;

  const { data: answers } = await supabase
    .from("user_answers")
    .select("*, questions ( question_text, options, correct_option, explanation_text, question_image_path, option_image_paths )")
    .eq("attempt_id", attemptId)
    .order("answered_at", { ascending: true });

  return {
    attempt: attempt as Record<string, unknown>,
    answers: (answers ?? []).map((answer) => {
      const row = answer as Record<string, unknown>;
      const question = row.questions as Record<string, unknown> | null;
      if (!question) return row;
      const optionPaths = parseOptionImagePaths(question.option_image_paths);
      return {
        ...row,
        questions: {
          ...question,
          question_image_url: typeof question.question_image_path === "string" ? getPublicImageUrl("exam-media", question.question_image_path) : null,
          option_image_urls: Object.fromEntries(Object.entries(optionPaths).map(([key, path]) => [key, getPublicImageUrl("exam-media", path)])),
        },
      };
    }),
  };
}

export async function getLeaderboard() {
  const supabase = createSupabaseServerClient();

  const { data } = await supabase.rpc("get_leaderboard", { limit_count: 50 });
  return (data ?? []) as Record<string, unknown>[];
}

export async function getUserRank() {
  const userId = await getSessionUserId();
  if (!userId) return 0;

  const supabase = createSupabaseServerClient();
  const { data } = await supabase.rpc("get_user_rank", { target_user_id: userId });
  return (data as number) ?? 0;
}

export async function getTestLeaderboard() {
  const supabase = createSupabaseServerClient();

  const { data } = await supabase.rpc("get_test_leaderboard", { limit_count: 50 });
  return (data ?? []) as Record<string, unknown>[];
}

export async function getTestUserRank() {
  const userId = await getSessionUserId();
  if (!userId) return 0;

  const supabase = createSupabaseServerClient();
  const { data } = await supabase.rpc("get_test_user_rank", { target_user_id: userId });
  return (data as number) ?? 0;
}

export async function getDashboardData() {
  const userId = await getSessionUserId();
  if (!userId) return { attempts: [], exams: [], rank: 0 };

  const supabase = createSupabaseServerClient();

  const prePostExam = await getPrePostTestExam();

  let attemptQuery = supabase
    .from("exam_attempts")
    .select("*, exams ( title )")
    .eq("user_id", userId)
    .order("completed_at", { ascending: false })
    .limit(50);

  if (prePostExam?.id) {
    attemptQuery = attemptQuery.neq("exam_id", prePostExam.id);
  }

  const { data: attempts } = await attemptQuery;

  const { data: exams } = await supabase
    .from("exams")
    .select("*, questions ( id )")
    .eq("is_published", true)
    .neq("type", "pre_post_test")
    .order("created_at", { ascending: false })
    .limit(3);

  let rank = 0;
  try {
    const { data: rankData } = await supabase.rpc("get_user_rank", { target_user_id: userId });
    rank = (rankData as number) ?? 0;
  } catch {}

  return {
    attempts: (attempts ?? []) as Record<string, unknown>[],
    exams: (exams ?? []) as Record<string, unknown>[],
    rank,
  };
}

export async function getHistory() {
  const userId = await getSessionUserId();
  if (!userId) return [];

  const supabase = createSupabaseServerClient();

  const prePostExam = await getPrePostTestExam();

  let query = supabase
    .from("exam_attempts")
    .select("*, exams ( title, type )")
    .eq("user_id", userId)
    .order("completed_at", { ascending: false })
    .limit(100);

  if (prePostExam?.id) {
    query = query.neq("exam_id", prePostExam.id);
  }

  const { data } = await query;

  return (data ?? []) as Record<string, unknown>[];
}

export async function getPrePostTestExam() {
  const supabase = createSupabaseServerClient();

  const { data } = await supabase
    .from("exams")
    .select("id, title, description, time_limit_minutes")
    .eq("type", "pre_post_test")
    .eq("is_published", true)
    .maybeSingle();

  return data as { id: string; title: string; description: string | null; time_limit_minutes: number } | null;
}

export async function getPrePostTestGate() {
  const userId = await getSessionUserId();
  if (!userId) return {
    preTestCompleted: false,
    postTestUnlocked: false,
    postTestCompleted: false,
    prePostExamId: null,
    remainingExams: [],
  };
  const supabase = createSupabaseServerClient();

  const prePostExam = await getPrePostTestExam();

  const { data: attemptsOnPrePost } = await supabase
    .from("exam_attempts")
    .select("id, completed_at")
    .eq("user_id", userId)
    .eq("exam_id", prePostExam?.id ?? "")
    .order("completed_at", { ascending: true });

  const preTestCompleted = prePostExam?.id ? (attemptsOnPrePost ?? []).length > 0 : false;
  const postTestCompleted = prePostExam?.id ? (attemptsOnPrePost ?? []).length >= 2 : false;

  const { data: normalExams } = await supabase
    .from("exams")
    .select("id, title")
    .eq("is_published", true)
    .eq("type", "normal");

  const { data: normalAttempts } = await supabase
    .from("exam_attempts")
    .select("exam_id")
    .eq("user_id", userId)
    .in("exam_id", (normalExams ?? []).map((e) => e.id));

  const attemptedNormalIds = new Set((normalAttempts ?? []).map((a) => a.exam_id));

  const remainingExams = (normalExams ?? [])
    .filter((e) => !attemptedNormalIds.has(e.id))
    .map((e) => ({ id: e.id, title: e.title }));

  const hasCompletedAllNormal = remainingExams.length === 0;
  const postTestUnlocked = preTestCompleted && hasCompletedAllNormal && !postTestCompleted;

  return {
    preTestCompleted,
    postTestUnlocked,
    postTestCompleted,
    prePostExamId: prePostExam?.id ?? null,
    remainingExams,
  };
}

export async function getProgressComparison() {
  const userId = await getSessionUserId();
  if (!userId) return {
    preTest: null,
    postTest: null,
    improvement: 0,
    hasCompletedAllNormalExams: false,
    hasCompletedPreTest: false,
    hasCompletedPostTest: false,
    remainingExams: [],
    unlockableExams: false,
  };
  const supabase = createSupabaseServerClient();

  const prePostExam = await getPrePostTestExam();
  const gate = await getPrePostTestGate();

  let preTest = null;
  let postTest = null;

  if (prePostExam?.id) {
    const { data: attempts } = await supabase
      .from("exam_attempts")
      .select("score, total_questions, completed_at")
      .eq("user_id", userId)
      .eq("exam_id", prePostExam.id)
      .order("completed_at", { ascending: true });

    if ((attempts ?? []).length > 0) {
      const first = attempts![0];
      preTest = {
        score: first.score,
        total: first.total_questions,
        percentage: first.total_questions > 0 ? Math.round((first.score / first.total_questions) * 100) : 0,
        completed_at: first.completed_at,
      };
    }

    if ((attempts ?? []).length >= 2) {
      const last = attempts![attempts!.length - 1];
      postTest = {
        score: last.score,
        total: last.total_questions,
        percentage: last.total_questions > 0 ? Math.round((last.score / last.total_questions) * 100) : 0,
        completed_at: last.completed_at,
      };
    }
  }

  const improvement = preTest && postTest ? postTest.percentage - preTest.percentage : 0;

  return {
    preTest,
    postTest,
    improvement,
    hasCompletedAllNormalExams: gate.remainingExams.length === 0,
    hasCompletedPreTest: gate.preTestCompleted,
    hasCompletedPostTest: gate.postTestCompleted,
    remainingExams: gate.remainingExams,
    unlockableExams: gate.postTestCompleted,
  };
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
  const rawTimeSpent = parseInt(timeSpentRaw, 10) || 0;

  const { data: examMeta } = await supabase
    .from("exams")
    .select("is_published, time_limit_minutes, type")
    .eq("id", examId)
    .single();

  if (!examMeta || !examMeta.is_published) {
    throw new Error("Exam is not available");
  }

  const timeSpentSeconds = Math.min(
    Math.max(0, rawTimeSpent),
    (examMeta.time_limit_minutes ?? 60) * 60
  );

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

  revalidatePath("/history");
  revalidatePath("/dashboard");
  revalidatePath("/progress");

  if (examMeta.type === "pre_post_test") {
    redirect(`/progress`);
  }

  redirect(`/history`);
}

export async function getPrePostTestHistory() {
  const userId = await getSessionUserId();
  if (!userId) return [];
  const supabase = createSupabaseServerClient();

  const prePostExam = await getPrePostTestExam();
  if (!prePostExam?.id) return [];

  const { data } = await supabase
    .from("exam_attempts")
    .select("score, total_questions, completed_at")
    .eq("user_id", userId)
    .eq("exam_id", prePostExam.id)
    .order("completed_at", { ascending: true });

  return ((data ?? []) as { score: number; total_questions: number; completed_at: string }[]).map((a) => ({
    score: a.score,
    total: a.total_questions,
    percentage: a.total_questions > 0 ? Math.round((a.score / a.total_questions) * 100) : 0,
    completed_at: a.completed_at,
  }));
}
