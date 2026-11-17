import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const actionCode = ts.transpileModule(readFileSync(new URL("../src/actions/exam.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

interface Row { [column: string]: unknown }

function harness(options: { userId?: string | null; attemptReadError?: boolean; firstAttemptReadError?: boolean } = {}) {
  const rows: Record<string, Row[]> = {
    exams: [
      { id: "pre-post", title: "Pre/Post Test", type: "pre_post_test", is_published: true, time_limit_minutes: 60 },
      { id: "normal", title: "Practice", type: "normal", is_published: true, time_limit_minutes: 60 },
    ],
    questions: [
      { id: "question-1", exam_id: "pre-post", question_text: "Question", options: { A: "Correct", B: "Wrong" }, correct_option: "A", explanation_text: "Explanation" },
      { id: "question-2", exam_id: "normal", correct_option: "A" },
    ],
    exam_attempts: [],
    user_answers: [],
  };
  const revalidated: string[] = [];

  // Keep persisted state, filtering, and ordering at the database boundary.
  class Query {
    table: string;
    filters: ((row: Row) => boolean)[] = [];
    orders: { column: string; ascending: boolean }[] = [];
    maxRows = Infinity;
    inserted: Row[] | null = null;
    constructor(table: string) { this.table = table; }
    select() { return this; }
    eq(column: string, value: unknown) { this.filters.push((row) => row[column] === value); return this; }
    neq(column: string, value: unknown) { this.filters.push((row) => row[column] !== value); return this; }
    gte(column: string, value: string) { this.filters.push((row) => String(row[column]) >= value); return this; }
    order(column: string, settings: { ascending: boolean }) { this.orders.push({ column, ...settings }); return this; }
    limit(value: number) { this.maxRows = value; return this; }
    insert(value: Row | Row[]) { this.inserted = Array.isArray(value) ? value : [value]; return this; }
    result(): { data: Row[] | null; error: { message: string } | null } {
      if (this.table === "exam_attempts" && !this.inserted &&
        (options.attemptReadError || (options.firstAttemptReadError && this.maxRows === 1))) {
        return { data: null, error: { message: "Database unavailable" } };
      }
      if (this.inserted) {
        const inserted = this.inserted.map((row, index) => ({
          id: `saved-${rows[this.table].length + index + 1}`,
          completed_at: new Date().toISOString(),
          ...row,
        }));
        rows[this.table].push(...inserted);
        return { data: inserted, error: null };
      }
      const data = rows[this.table].filter((row) => this.filters.every((filter) => filter(row)));
      data.sort((left, right) => {
        for (const { column, ascending } of this.orders) {
          const a = String(left[column]);
          const b = String(right[column]);
          if (a !== b) return (a > b ? 1 : -1) * (ascending ? 1 : -1);
        }
        return 0;
      });
      return {
        data: data.slice(0, this.maxRows).map((row) => ({
          ...row,
          ...(this.table === "exam_attempts" ? { exams: rows.exams.find((exam) => exam.id === row.exam_id) } : {}),
          ...(this.table === "user_answers" ? { questions: rows.questions.find((question) => question.id === row.question_id) } : {}),
        })),
        error: null,
      };
    }
    async single() { const result = this.result(); return { ...result, data: result.data?.[0] ?? null }; }
    async maybeSingle() { return this.single(); }
    then(resolve: (value: ReturnType<Query["result"]>) => unknown, reject: (error: unknown) => unknown) {
      return Promise.resolve().then(() => this.result()).then(resolve, reject);
    }
  }

  const exports = {};
  const mocks: Record<string, unknown> = {
    "next/cache": { revalidatePath: (path: string) => revalidated.push(path) },
    "next/navigation": { redirect: (path: string) => { throw new Error(`REDIRECT:${path}`); } },
    "@/lib/auth": { getSessionUserId: async () => options.userId === undefined ? "student" : options.userId },
    "@/lib/supabase-server": { createSupabaseServerClient: () => ({ from: (table: string) => new Query(table) }) },
    "@/lib/storage": { getPublicImageUrl: () => null, parseOptionImagePaths: () => ({}) },
  };
  runInNewContext(actionCode, { exports, Error, Date, require: (name: string) => name in mocks ? mocks[name] : require(name) });
  return { actions: exports as typeof import("../src/actions/exam.ts"), rows, revalidated };
}

function attempt(id: string, examId = "pre-post", completedAt = "2026-01-01T00:00:00.000Z", userId = "student"): Row {
  return { id, exam_id: examId, user_id: userId, completed_at: completedAt, score: 1, total_questions: 1, time_spent_seconds: 10 };
}

function submission(examId = "pre-post") {
  const data = new FormData();
  data.set("examId", examId);
  data.set("answers", JSON.stringify({ "question-1": "A", "question-2": "A" }));
  data.set("timeSpentSeconds", "10");
  return data;
}

test("PostTest submission leads to history and its saved answers can be reviewed", async () => {
  const { actions, rows, revalidated } = harness();
  rows.exam_attempts.push(attempt("pre"));
  await assert.rejects(actions.submitExam(submission()), { message: "REDIRECT:/history" });
  assert.deepEqual(Array.from(await actions.getHistory(), (row) => row.id), ["saved-2"]);
  const result = await actions.getExamResult("saved-2");
  assert.equal(result?.attempt.score, 1);
  assert.equal(result?.answers[0].selected_option, "A");
  assert.equal((result?.answers[0].questions as Row).correct_option, "A");
  assert.equal((result?.answers[0].questions as Row).explanation_text, "Explanation");
  assert.deepEqual(revalidated, ["/history", "/dashboard", "/progress"]);
});

test("PreTest submission still leads to progress and stays out of history", async () => {
  const { actions } = harness();
  await assert.rejects(actions.submitExam(submission()), { message: "REDIRECT:/progress" });
  assert.equal((await actions.getHistory()).length, 0);
});

test("history includes normal and PostTest attempts, excluding PreTest and other students", async () => {
  const { actions, rows } = harness();
  rows.exam_attempts.push(attempt("other-pre", "pre-post", "2025-01-01", "other-student"), attempt("pre"), attempt("post", "pre-post", "2026-02-01"), attempt("normal-attempt", "normal", "2026-03-01"));
  assert.deepEqual(Array.from(await actions.getHistory(), (row) => row.id), ["normal-attempt", "post"]);
  assert.equal(await actions.getExamResult("other-pre"), null);
});

test("a duplicate PostTest submission returns to history without saving another attempt", async () => {
  const { actions, rows } = harness();
  rows.exam_attempts.push(attempt("pre"), attempt("post", "pre-post", new Date().toISOString()));
  await assert.rejects(actions.submitExam(submission()), { message: "REDIRECT:/history" });
  assert.equal(rows.exam_attempts.length, 2);
});

test("a duplicate PreTest submission stays on the original progress flow", async () => {
  const { actions, rows } = harness();
  rows.exam_attempts.push(attempt("pre", "pre-post", new Date().toISOString()));
  await assert.rejects(actions.submitExam(submission()), { message: "REDIRECT:/progress" });
  assert.equal(rows.exam_attempts.length, 1);
});

test("normal submission and cooldown routing remain unchanged", async () => {
  const { actions, rows } = harness();
  await assert.rejects(actions.submitExam(submission("normal")), { message: "REDIRECT:/history" });
  await assert.rejects(actions.submitExam(submission("normal")), { message: "REDIRECT:/exam/normal/result/saved-1" });
  assert.equal(rows.exam_attempts.length, 1);
});

test("missing sessions cannot read history or results or submit an exam", async () => {
  const { actions, rows } = harness({ userId: null });
  assert.equal((await actions.getHistory()).length, 0);
  assert.equal(await actions.getExamResult("post"), null);
  await assert.rejects(actions.submitExam(submission()), { message: "Unauthorized" });
  assert.equal(rows.exam_attempts.length, 0);
});

test("attempt read failures cannot misclassify a PostTest or persist another attempt", async () => {
  for (const options of [{ attemptReadError: true }, { firstAttemptReadError: true }]) {
    const { actions, rows } = harness(options);
    rows.exam_attempts.push(attempt("pre"));
    await assert.rejects(actions.submitExam(submission()), /Failed to load exam attempts/);
    assert.equal(rows.exam_attempts.length, 1);
  }
});

test("history keeps PreTest hidden if its classification query fails", async () => {
  const { actions, rows } = harness({ firstAttemptReadError: true });
  rows.exam_attempts.push(attempt("pre"), attempt("post", "pre-post", "2026-02-01"), attempt("practice", "normal"));
  assert.deepEqual(Array.from(await actions.getHistory(), (row) => row.id), ["practice"]);
});

test("history applies its 100-result limit after excluding the first PreTest", async () => {
  const { actions, rows } = harness();
  rows.exam_attempts.push(attempt("pre"), attempt("post", "pre-post", "2026-02-01"));
  for (let index = 0; index < 99; index++) rows.exam_attempts.push(attempt(`practice-${index}`, "normal", "2026-03-01"));
  const history = await actions.getHistory();
  assert.equal(history.length, 100);
  assert.equal(history.at(-1)?.id, "post");
  assert.equal(history.some((row) => row.id === "pre"), false);
});

test("Pre/Post gate unlocks PostTest only after PreTest and every normal exam, from one parallel load", async () => {
  const { actions, rows } = harness();
  let gate = await actions.getPrePostTestGate();
  assert.equal(gate.preTestCompleted, false);
  assert.deepEqual(Array.from(gate.remainingExams, (exam) => exam.id), ["normal"]);

  rows.exam_attempts.push(attempt("pre", "pre-post", "2026-01-01T00:00:00.000Z"));
  rows.exam_attempts.push(attempt("someone-else", "normal", "2026-01-01T00:00:00.000Z", "other"));
  gate = await actions.getPrePostTestGate();
  assert.equal(gate.preTestCompleted, true);
  assert.equal(gate.postTestUnlocked, false);

  rows.exam_attempts.push(attempt("normal-1", "normal", "2026-01-02T00:00:00.000Z"));
  gate = await actions.getPrePostTestGate();
  assert.equal(gate.postTestUnlocked, true);

  rows.exam_attempts.push({ ...attempt("post", "pre-post", "2026-01-03T00:00:00.000Z"), score: 0 });
  const progress = await actions.getProgressComparison();
  assert.equal(progress.hasCompletedPostTest, true);
  assert.equal(progress.preTest?.percentage, 100);
  assert.equal(progress.postTest?.percentage, 0);
  assert.equal(progress.improvement, -100);
});
