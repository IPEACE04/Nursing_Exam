"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSessionProfile } from "@/lib/auth";
import { validateImageFiles } from "@/lib/image-validation";
import { deleteImageFiles, getFormFiles, getPublicImageUrl, parseOptionImagePaths, uploadImageFiles } from "@/lib/storage";
import { toAdminExamListItem } from "@/lib/admin-exam";
import { ADMIN_USERS_PAGE_SIZE, buildUserScoreRows } from "@/lib/admin-users";
import type { AdminUserSummary, AdminUserDetail, AdminUserAttempt, ExamAttempt, ExamType } from "@/types";

async function requireAdmin() {
  // Session check and role read happen in the same query.
  const profile = await getSessionProfile<{ id: string; role: string }>("id, role");
  if (!profile) throw new Error("Unauthorized");
  if (profile.role !== "admin") throw new Error("Forbidden");
  return { supabase: createSupabaseServerClient(), userId: profile.id };
}

const OPTION_KEYS = ["A", "B", "C", "D"] as const;

function questionMedia(formData: FormData) {
  const questionImage = getFormFiles(formData, "questionImage")[0] ?? null;
  const optionImages = Object.fromEntries(
    OPTION_KEYS.map((key) => [`${key}`, getFormFiles(formData, `optionImage${key}`)[0] ?? null]),
  ) as Record<string, File | null>;
  return { questionImage, optionImages };
}

async function uploadQuestionMedia(formData: FormData, questionId: string, oldQuestionImage: string | null = null, oldOptionImages: Record<string, string> = {}) {
  const media = questionMedia(formData);
  const files = [media.questionImage, ...Object.values(media.optionImages)].filter((file): file is File => file !== null);
  const validationError = await validateImageFiles(files, 5);
  if (validationError) return { error: validationError } as const;

  const upload = await uploadImageFiles("exam-media", files, `questions/${questionId}`);
  if (upload.error) return { error: upload.error } as const;
  let pathIndex = 0;
  const questionImagePath = media.questionImage
    ? upload.paths[pathIndex++]
    : formData.get("removeQuestionImage") === "true" ? null : oldQuestionImage;
  const optionImagePaths: Record<string, string> = {};
  for (const key of OPTION_KEYS) {
    const file = media.optionImages[key];
    if (file) optionImagePaths[key] = upload.paths[pathIndex++];
    else if (formData.get(`removeOptionImage${key}`) !== "true" && oldOptionImages[key]) optionImagePaths[key] = oldOptionImages[key];
  }
  return { questionImagePath, optionImagePaths, uploadedPaths: upload.paths } as const;
}

function publicQuestionMedia(row: Record<string, unknown>) {
  const optionPaths = parseOptionImagePaths(row.option_image_paths);
  return {
    question_image_url: typeof row.question_image_path === "string" ? getPublicImageUrl("exam-media", row.question_image_path) : null,
    option_image_urls: Object.fromEntries(Object.entries(optionPaths).map(([key, path]) => [key, getPublicImageUrl("exam-media", path)])),
  };
}

export async function createExam(formData: FormData) {
  const { supabase, userId } = await requireAdmin();
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const timeLimit = parseInt(formData.get("timeLimit") as string, 10) || 60;

  const { data: exam, error } = await supabase.from("exams").insert({
    title,
    description,
    time_limit_minutes: timeLimit,
    is_published: false,
    created_by: userId,
  }).select("id, title, description, time_limit_minutes, is_published, created_at").single();

  if (error || !exam) return { error: "ไม่สามารถสร้างชุดข้อสอบได้ กรุณาลองใหม่" };
  revalidatePath("/admin/exams");
  return { success: true, exam: toAdminExamListItem(exam) };
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

  const { data: questionMedia } = await supabase
    .from("questions")
    .select("question_image_path, option_image_paths")
    .eq("exam_id", id);

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
  await deleteImageFiles(
    "exam-media",
    (questionMedia ?? []).flatMap((question) => [
      question.question_image_path ?? "",
      ...Object.values(parseOptionImagePaths(question.option_image_paths)),
    ]),
  );
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

  const { data: question, error } = await supabase.from("questions").insert({
    exam_id: examId,
    question_text: questionText,
    options: { A: optionA, B: optionB, C: optionC, D: optionD },
    correct_option: correctOption,
    explanation_text: explanation || null,
    sort_order: sortOrder,
    question_image_path: null,
    option_image_paths: {},
  }).select("id").single();

  if (error || !question) return { error: "ไม่สามารถสร้างคำถามได้ กรุณาลองใหม่" };
  const media = await uploadQuestionMedia(formData, question.id);
  if ("error" in media) {
    await supabase.from("questions").delete().eq("id", question.id);
    return { error: media.error };
  }
  const { error: mediaError } = await supabase.from("questions").update({
    question_image_path: media.questionImagePath,
    option_image_paths: media.optionImagePaths,
  }).eq("id", question.id);
  if (mediaError) {
    await deleteImageFiles("exam-media", media.uploadedPaths);
    await supabase.from("questions").delete().eq("id", question.id);
    return { error: "ไม่สามารถบันทึกรูปภาพได้ กรุณาลองใหม่" };
  }
  revalidatePath(`/admin/exams/${examId}`);
  return { success: true };
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

  const { data: existing } = await supabase
    .from("questions")
    .select("exam_id, question_image_path, option_image_paths")
    .eq("id", id)
    .eq("exam_id", examId)
    .single();
  if (!existing) return { error: "ไม่พบคำถาม" };
  const oldOptionImages = parseOptionImagePaths(existing.option_image_paths);
  const media = await uploadQuestionMedia(formData, id, existing.question_image_path, oldOptionImages);
  if ("error" in media) return { error: media.error };

  const { error } = await supabase
    .from("questions")
    .update({
      question_text: questionText,
      options: { A: optionA, B: optionB, C: optionC, D: optionD },
      correct_option: correctOption,
      explanation_text: explanation || null,
      question_image_path: media.questionImagePath,
      option_image_paths: media.optionImagePaths,
    })
    .eq("id", id)
    .eq("exam_id", examId);

  if (error) {
    await deleteImageFiles("exam-media", media.uploadedPaths);
    return { error: "ไม่สามารถบันทึกคำถามได้ กรุณาลองใหม่" };
  }
  const replacedPaths = [
    existing.question_image_path && media.questionImagePath !== existing.question_image_path ? [existing.question_image_path] : [],
    ...OPTION_KEYS.map((key) => oldOptionImages[key] && media.optionImagePaths[key] !== oldOptionImages[key] ? [oldOptionImages[key]] : []),
  ].flat();
  await deleteImageFiles("exam-media", replacedPaths);
  revalidatePath(`/admin/exams/${examId}`);
  return { success: true };
}

export async function deleteQuestion(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = formData.get("id") as string;
  const examId = formData.get("examId") as string;

  const { data: question } = await supabase.from("questions").select("question_image_path, option_image_paths").eq("id", id).eq("exam_id", examId).single();
  if (!question) return { error: "ไม่พบคำถาม" };
  const { error } = await supabase.from("questions").delete().eq("id", id).eq("exam_id", examId);
  if (error) return { error: "ไม่สามารถลบคำถามได้ กรุณาลองใหม่" };
  await deleteImageFiles("exam-media", [question.question_image_path ?? "", ...Object.values(parseOptionImagePaths(question.option_image_paths))]);
  revalidatePath(`/admin/exams/${examId}`);
  return { success: true };
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
    questions: (questions ?? []).map((question) => ({ ...question, ...publicQuestionMedia(question as Record<string, unknown>) })),
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
    const { data: exam, error } = await supabase
      .from("exams")
      .update({ title, description, time_limit_minutes: timeLimit })
      .eq("id", existing.id)
      .select("id, title, description, time_limit_minutes, is_published")
      .single();

    if (error || !exam) return { error: "ไม่สามารถบันทึกชุดข้อสอบได้ กรุณาลองใหม่" };
    revalidatePath("/admin/pre-post-test");
    return { success: true, exam };
  }

  const { data: exam, error } = await supabase.from("exams").insert({
    title,
    description,
    time_limit_minutes: timeLimit,
    is_published: false,
    type: "pre_post_test",
    created_by: userId,
  }).select("id, title, description, time_limit_minutes, is_published").single();

  if (error || !exam) return { error: "ไม่สามารถสร้างชุดข้อสอบได้ กรุณาลองใหม่" };
  revalidatePath("/admin/pre-post-test");
  return { success: true, exam };
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
    questions: (questions ?? []).map((question) => ({ ...question, ...publicQuestionMedia(question as Record<string, unknown>) })),
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

  const { data: question, error } = await supabase.from("questions").insert({
    exam_id: examId,
    question_text: questionText,
    options: { A: optionA, B: optionB, C: optionC, D: optionD },
    correct_option: correctOption,
    explanation_text: explanation || null,
    sort_order: sortOrder,
    question_image_path: null,
    option_image_paths: {},
  }).select("id").single();

  if (error || !question) return { error: "ไม่สามารถสร้างคำถามได้ กรุณาลองใหม่" };
  const media = await uploadQuestionMedia(formData, question.id);
  if ("error" in media) {
    await supabase.from("questions").delete().eq("id", question.id);
    return { error: media.error };
  }
  const { error: mediaError } = await supabase.from("questions").update({
    question_image_path: media.questionImagePath,
    option_image_paths: media.optionImagePaths,
  }).eq("id", question.id);
  if (mediaError) {
    await deleteImageFiles("exam-media", media.uploadedPaths);
    await supabase.from("questions").delete().eq("id", question.id);
    return { error: "ไม่สามารถบันทึกรูปภาพได้ กรุณาลองใหม่" };
  }
  revalidatePath("/admin/pre-post-test");
  return { success: true };
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

  const { data: existing } = await supabase
    .from("questions")
    .select("exam_id, question_image_path, option_image_paths")
    .eq("id", id)
    .eq("exam_id", formData.get("examId") as string)
    .single();
  if (!existing) return { error: "ไม่พบคำถาม" };
  const media = await uploadQuestionMedia(formData, id, existing.question_image_path, parseOptionImagePaths(existing.option_image_paths));
  if ("error" in media) return { error: media.error };

  const { error } = await supabase
    .from("questions")
    .update({
      question_text: questionText,
      options: { A: optionA, B: optionB, C: optionC, D: optionD },
      correct_option: correctOption,
      explanation_text: explanation || null,
      question_image_path: media.questionImagePath,
      option_image_paths: media.optionImagePaths,
    })
    .eq("id", id)
    .eq("exam_id", existing.exam_id);

  if (error) {
    await deleteImageFiles("exam-media", media.uploadedPaths);
    return { error: "ไม่สามารถบันทึกคำถามได้ กรุณาลองใหม่" };
  }
  const oldOptionImages = parseOptionImagePaths(existing.option_image_paths);
  const replacedPaths = [
    existing.question_image_path && media.questionImagePath !== existing.question_image_path ? [existing.question_image_path] : [],
    ...OPTION_KEYS.map((key) => oldOptionImages[key] && media.optionImagePaths[key] !== oldOptionImages[key] ? [oldOptionImages[key]] : []),
  ].flat();
  await deleteImageFiles("exam-media", replacedPaths);
  revalidatePath("/admin/pre-post-test");
  return { success: true };
}

export async function deletePrePostQuestion(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = formData.get("id") as string;

  const { data: question } = await supabase.from("questions").select("question_image_path, option_image_paths").eq("id", id).single();
  if (!question) return { error: "ไม่พบคำถาม" };
  const { error } = await supabase.from("questions").delete().eq("id", id);
  if (error) return { error: "ไม่สามารถลบคำถามได้ กรุณาลองใหม่" };
  await deleteImageFiles("exam-media", [question.question_image_path ?? "", ...Object.values(parseOptionImagePaths(question.option_image_paths))]);
  revalidatePath("/admin/pre-post-test");
  return { success: true };
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

const USER_SUMMARY_FIELDS = "id,name,email,student_id,role,created_at";
const USER_DETAIL_FIELDS = `${USER_SUMMARY_FIELDS},avatar_url,university,gender,age,gpa`;
const ATTEMPT_FIELDS = "id,user_id,exam_id,score,total_questions,time_spent_seconds,completed_at";

function validUserId(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function pageStart(page: number) {
  if (!Number.isSafeInteger(page) || page < 1 || page > 1_000_000) throw new Error("Invalid page");
  return (page - 1) * ADMIN_USERS_PAGE_SIZE;
}

export async function getAdminUsers(search = "", page = 1) {
  const { supabase } = await requireAdmin();
  if (typeof search !== "string" || search.length > 100) throw new Error("Invalid search");
  const start = pageStart(page);
  let query = supabase.from("profiles").select(USER_SUMMARY_FIELDS, { count: "exact" })
    .order("created_at", { ascending: false }).order("id", { ascending: true });
  const term = search.trim();
  if (term) {
    const pattern = JSON.stringify(`%${term.replace(/[\\%_]/g, "\\$&")}%`);
    query = query.or(`name.ilike.${pattern},email.ilike.${pattern},student_id.ilike.${pattern}`);
  }
  const { data, error, count } = await query.range(start, start + ADMIN_USERS_PAGE_SIZE - 1);
  if (error) throw new Error("Failed to load users");
  return { users: (data ?? []) as unknown as AdminUserSummary[], total: count ?? 0 };
}

export async function getAdminUserDetail(userId: string): Promise<AdminUserDetail | null> {
  const { supabase } = await requireAdmin();
  if (!validUserId(userId)) return null;
  const { data, error } = await supabase.from("profiles").select(USER_DETAIL_FIELDS).eq("id", userId).maybeSingle();
  if (error) throw new Error("Failed to load user");
  return data as unknown as AdminUserDetail | null;
}

export async function getAdminUserAttempts(userId: string, page = 1) {
  const { supabase } = await requireAdmin();
  const start = pageStart(page);
  if (!validUserId(userId)) return { attempts: [] as AdminUserAttempt[], total: 0 };
  const { data, error, count } = await supabase.from("exam_attempts")
    .select(`${ATTEMPT_FIELDS},exams(title,type)`, { count: "exact" }).eq("user_id", userId)
    .order("completed_at", { ascending: false }).order("id", { ascending: false })
    .range(start, start + ADMIN_USERS_PAGE_SIZE - 1);
  if (error) throw new Error("Failed to load exam history");
  const attempts = (data ?? []) as unknown as (ExamAttempt & { exams: { title: string; type: ExamType } | null })[];
  const prePostIds = [...new Set(attempts.filter((attempt) => attempt.exams?.type === "pre_post_test").map((attempt) => attempt.exam_id))];
  const firstAttempts = new Map(await Promise.all(prePostIds.map(async (examId) => {
    const { data: first, error: firstError } = await supabase.from("exam_attempts").select("id")
      .eq("user_id", userId).eq("exam_id", examId)
      .order("completed_at", { ascending: true }).order("id", { ascending: true }).limit(1).maybeSingle();
    if (firstError || !first) throw new Error("Failed to classify exam history");
    return [examId, first.id as string] as const;
  })));
  return {
    attempts: attempts.map(({ exams, ...attempt }): AdminUserAttempt => ({
      ...attempt,
      exam_title: exams?.title ?? "",
      exam_type: exams?.type ?? "normal",
      test_phase: exams?.type === "pre_post_test" ? (firstAttempts.get(attempt.exam_id) === attempt.id ? "PreTest" : "PostTest") : null,
    })),
    total: count ?? 0,
  };
}

export async function getAdminUserScoreExport(userIds: string[]) {
  const { supabase } = await requireAdmin();
  if (!Array.isArray(userIds) || userIds.length === 0 || !userIds.every(validUserId)) {
    return { error: "invalidSelection" } as const;
  }
  const ids = [...new Set(userIds.map((id) => id.toLowerCase()))];
  const { data: exams, error: examError } = await supabase.from("exams").select("id").eq("type", "pre_post_test").limit(2);
  if (examError) return { error: "loadFailed" } as const;
  if ((exams?.length ?? 0) > 1) return { error: "ambiguousExam" } as const;
  const users = new Map<string, AdminUserSummary>();
  const attempts: ExamAttempt[] = [];
  for (let index = 0; index < ids.length; index += 100) {
    const batch = ids.slice(index, index + 100);
    const { data: profiles, error: profileError } = await supabase.from("profiles").select(USER_SUMMARY_FIELDS).in("id", batch).range(0, 99);
    if (profileError) return { error: "loadFailed" } as const;
    if (profiles?.length !== batch.length) return { error: "missingUsers" } as const;
    for (const user of profiles as unknown as AdminUserSummary[]) users.set(user.id, user);
    if (!exams?.[0]) continue;
    for (let offset = 0; ; offset += 1000) {
      const { data: page, error: attemptError } = await supabase.from("exam_attempts").select(ATTEMPT_FIELDS)
        .eq("exam_id", exams[0].id).in("user_id", batch)
        .order("completed_at", { ascending: true }).order("id", { ascending: true }).range(offset, offset + 999);
      if (attemptError) return { error: "loadFailed" } as const;
      attempts.push(...((page ?? []) as unknown as ExamAttempt[]));
      if ((page?.length ?? 0) < 1000) break;
    }
  }
  return { rows: buildUserScoreRows(ids.map((id) => users.get(id)!), attempts) };
}
