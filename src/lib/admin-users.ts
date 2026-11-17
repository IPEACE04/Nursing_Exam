import type {
  AdminScoreExportRow,
  AdminUserSummary,
  ExamAttempt,
} from "../types/index.ts";

export const ADMIN_USERS_PAGE_SIZE = 25;

export function formatExamDuration(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  return [Math.floor(total / 3600), Math.floor((total % 3600) / 60), total % 60]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

// Fixed Bangkok time zone: export runs on the server, which may be UTC.
const examDateFormat = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Bangkok",
  dateStyle: "short",
  timeStyle: "short",
});

export function formatExamDate(isoDate: string): string {
  return examDateFormat.format(new Date(isoDate));
}

export function buildUserScoreRows(
  users: AdminUserSummary[],
  attempts: ExamAttempt[],
): AdminScoreExportRow[] {
  const byUser = new Map<string, ExamAttempt[]>();
  for (const attempt of attempts) {
    const existing = byUser.get(attempt.user_id) ?? [];
    existing.push(attempt);
    byUser.set(attempt.user_id, existing);
  }
  return users.flatMap((user) => {
    const history = (byUser.get(user.id) ?? []).sort(
      (a, b) =>
        a.completed_at.localeCompare(b.completed_at) ||
        a.id.localeCompare(b.id),
    );
    const preTest = history[0];
    const postTest =
      history.length > 1 ? history[history.length - 1] : undefined;
    return (["PreTest", "PostTest"] as const).map((testType) => {
      const attempt = testType === "PreTest" ? preTest : postTest;
      return {
        id: user.student_id?.trim() || user.id,
        name: user.name,
        testType,
        score: attempt
          ? `${attempt.score}/${attempt.total_questions}`
          : "ยังไม่ได้สอบ",
        duration: attempt ? formatExamDuration(attempt.time_spent_seconds) : "",
        completedAt: attempt ? formatExamDate(attempt.completed_at) : "",
      };
    });
  });
}
