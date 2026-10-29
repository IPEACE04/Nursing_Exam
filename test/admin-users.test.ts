import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const code = ts.transpileModule(
  readFileSync(new URL("../src/actions/admin.ts", import.meta.url), "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
const studentId = "11111111-1111-4111-8111-111111111111";
const otherId = "22222222-2222-4222-8222-222222222222";
const adminId = "33333333-3333-4333-8333-333333333333";
const examId = "44444444-4444-4444-8444-444444444444";
interface Row {
  [column: string]: unknown;
}

function harness(
  options: {
    session?: string | null;
    role?: string;
    failedTable?: string;
  } = {},
) {
  const rows: Record<string, Row[]> = {
    profiles: [
      {
        id: adminId,
        name: "Admin",
        email: "admin@example.test",
        role: options.role ?? "admin",
        student_id: null,
      },
      {
        id: studentId,
        name: "นักศึกษา ก",
        email: "a@example.test",
        role: "student",
        student_id: "001234",
        university: "Test University",
        password_hash: "NEVER-RETURN",
        personal_answer_hash: "NEVER-RETURN",
        personal_question: "NEVER-RETURN",
      },
      {
        id: otherId,
        name: "=not-a-formula",
        email: "b@example.test",
        role: "student",
        student_id: null,
      },
    ],
    exams: [
      {
        id: examId,
        title: "Assessment",
        type: "pre_post_test",
        is_published: false,
      },
    ],
    exam_attempts: [],
  };
  const operations: { table: string; columns: string }[] = [];
  class Query {
    table: string;
    columns = "*";
    filters: ((row: Row) => boolean)[] = [];
    orders: { column: string; ascending: boolean }[] = [];
    start = 0;
    end = 999;
    constructor(table: string) {
      this.table = table;
    }
    select(columns: string) {
      this.columns = columns;
      operations.push({ table: this.table, columns });
      return this;
    }
    eq(column: string, value: unknown) {
      this.filters.push((row) => row[column] === value);
      return this;
    }
    in(column: string, values: unknown[]) {
      this.filters.push((row) => values.includes(row[column]));
      return this;
    }
    order(column: string, settings: { ascending: boolean }) {
      this.orders.push({ column, ...settings });
      return this;
    }
    range(start: number, end: number) {
      this.start = start;
      this.end = end;
      return this;
    }
    limit(count: number) {
      this.end = count - 1;
      return this;
    }
    or(expression: string) {
      const match = expression.match(/ilike\."%(.+?)%"/);
      if (!match) throw new Error("Expected quoted search filters");
      const term = match[1].toLocaleLowerCase();
      this.filters.push((row) =>
        [row.name, row.email, row.student_id].some((value) =>
          String(value ?? "")
            .toLocaleLowerCase()
            .includes(term),
        ),
      );
      return this;
    }
    result() {
      if (options.failedTable === this.table)
        return { data: null, error: { message: "Database failed" }, count: 0 };
      const filtered = rows[this.table].filter((row) =>
        this.filters.every((filter) => filter(row)),
      );
      filtered.sort((a, b) => {
        for (const order of this.orders) {
          if (a[order.column] !== b[order.column])
            return (
              (String(a[order.column]) > String(b[order.column]) ? 1 : -1) *
              (order.ascending ? 1 : -1)
            );
        }
        return 0;
      });
      const data = filtered.slice(this.start, this.end + 1).map((row) => {
        const joined = {
          ...row,
          exams: rows.exams.find((exam) => exam.id === row.exam_id) ?? null,
        };
        if (this.columns === "*" || this.columns.startsWith("*,"))
          return joined;
        return Object.fromEntries(
          Object.entries(joined).filter(
            ([key]) =>
              this.columns.split(",").includes(key) ||
              (key === "exams" && this.columns.includes("exams(")),
          ),
        );
      });
      return { data, error: null, count: filtered.length };
    }
    async single() {
      const result = this.result();
      return { ...result, data: result.data?.[0] ?? null };
    }
    async maybeSingle() {
      const result = this.result();
      if ((result.data?.length ?? 0) > 1)
        return {
          data: null,
          error: { message: "Multiple rows" },
          count: result.count,
        };
      return { ...result, data: result.data?.[0] ?? null };
    }
    then(
      resolve: (value: ReturnType<Query["result"]>) => unknown,
      reject: (error: unknown) => unknown,
    ) {
      return Promise.resolve()
        .then(() => this.result())
        .then(resolve, reject);
    }
  }
  const helpers = require("../src/lib/admin-users.ts");
  const mocks: Record<string, unknown> = {
    "next/cache": { revalidatePath() {} },
    "next/navigation": {},
    "@/lib/auth": {
      getSessionUserId: async () =>
        options.session === undefined ? adminId : options.session,
    },
    "@/lib/supabase-server": {
      createSupabaseServerClient: () => ({
        from: (table: string) => new Query(table),
      }),
    },
    "@/lib/image-validation": {},
    "@/lib/storage": {},
    "@/lib/admin-exam": {},
    "@/lib/admin-users": helpers,
  };
  const exports = {};
  runInNewContext(code, {
    exports,
    Error,
    require: (name: string) => (name in mocks ? mocks[name] : require(name)),
  });
  return {
    actions: exports as typeof import("../src/actions/admin.ts"),
    rows,
    operations,
  };
}

function attempt(
  id: string,
  completedAt: string,
  score = 0,
  userId = studentId,
): Row {
  return {
    id,
    exam_id: examId,
    user_id: userId,
    completed_at: completedAt,
    score,
    total_questions: 20,
    time_spent_seconds: 0,
  };
}

test("all user-management reads and export require an active admin", async () => {
  for (const options of [{ session: null }, { role: "student" }]) {
    const { actions } = harness(options);
    for (const call of [
      () => actions.getAdminUsers(),
      () => actions.getAdminUserDetail(studentId),
      () => actions.getAdminUserAttempts(studentId),
      () => actions.getAdminUserScoreExport([studentId]),
    ]) {
      await assert.rejects(call(), /Unauthorized|Forbidden/);
    }
  }
});

test("user list/detail expose approved fields without password or recovery data", async () => {
  const { actions } = harness();
  const list = await actions.getAdminUsers("001234", 1);
  assert.equal(list.total, 1);
  assert.equal(list.users[0].student_id, "001234");
  const detail = await actions.getAdminUserDetail(studentId);
  assert.equal(detail?.university, "Test University");
  assert.equal(JSON.stringify([list, detail]).includes("NEVER-RETURN"), false);
  assert.equal(await actions.getAdminUserDetail("invalid"), null);
});

test("history includes every exam kind and correctly classifies a PreTest older than the current page", async () => {
  const { actions, rows } = harness();
  rows.exam_attempts.push(attempt("pre", "2026-01-01"));
  for (let index = 0; index < 30; index++)
    rows.exam_attempts.push(attempt(`post-${index}`, "2026-02-01"));
  rows.exams.push({ id: "normal-exam", title: "Practice", type: "normal" });
  rows.exam_attempts.push({
    ...attempt("normal", "2026-03-01"),
    exam_id: "normal-exam",
  });
  rows.exam_attempts.push(attempt("other-user", "2026-04-01", 10, otherId));
  const first = await actions.getAdminUserAttempts(studentId, 1);
  const second = await actions.getAdminUserAttempts(studentId, 2);
  assert.equal(first.total, 32);
  assert.equal(first.attempts.length + second.attempts.length, 32);
  assert.equal(first.attempts[0].exam_type, "normal");
  assert.equal(
    first.attempts.find((row) => row.id.startsWith("post-"))?.test_phase,
    "PostTest",
  );
  assert.equal(
    second.attempts.find((row) => row.id === "pre")?.test_phase,
    "PreTest",
  );
});

test("export preserves selected order and exactly two rows per user, missing and zero results", async () => {
  const { actions, rows } = harness();
  rows.exam_attempts.push(
    attempt("pre", "2026-01-01"),
    attempt("older-post", "2026-02-01", 5),
    { ...attempt("post", "2026-03-01", 18), time_spent_seconds: 3661 },
  );
  const result = await actions.getAdminUserScoreExport([
    otherId,
    studentId,
    studentId,
  ]);
  assert.ok("rows" in result);
  assert.deepEqual(JSON.parse(JSON.stringify(result.rows)), [
    {
      id: otherId,
      name: "=not-a-formula",
      testType: "PreTest",
      score: "ยังไม่ได้สอบ",
      duration: "",
    },
    {
      id: otherId,
      name: "=not-a-formula",
      testType: "PostTest",
      score: "ยังไม่ได้สอบ",
      duration: "",
    },
    {
      id: "001234",
      name: "นักศึกษา ก",
      testType: "PreTest",
      score: "0/20",
      duration: "00:00:00",
    },
    {
      id: "001234",
      name: "นักศึกษา ก",
      testType: "PostTest",
      score: "18/20",
      duration: "01:01:01",
    },
  ]);
});

test("PreTest-only users have a missing PostTest rather than repeating their PreTest score", async () => {
  const { actions, rows } = harness();
  rows.exam_attempts.push(attempt("pre", "2026-01-01", 10));
  const result = await actions.getAdminUserScoreExport([studentId]);
  assert.equal(result.rows?.[0].score, "10/20");
  assert.equal(result.rows?.[1].score, "ยังไม่ได้สอบ");
});

test("export reads beyond the default database page and includes only the selected users", async () => {
  const { actions, rows } = harness();
  for (let index = 0; index < 1005; index++)
    rows.exam_attempts.push(
      attempt(String(index).padStart(5, "0"), "2026-01-01", index % 20),
    );
  rows.exam_attempts.push(attempt("other", "2026-03-01", 20, otherId));
  const result = await actions.getAdminUserScoreExport([studentId]);
  assert.equal(result.rows?.length, 2);
  assert.equal(result.rows?.[1].score, "4/20");
});

test("invalid, empty, and missing-user selections do not produce a partial export", async () => {
  const { actions } = harness();
  for (const ids of [
    [],
    ["bad-id"],
    [studentId, "99999999-9999-4999-8999-999999999999"],
  ]) {
    const result = await actions.getAdminUserScoreExport(ids);
    assert.ok(result.error);
    assert.equal(result.rows, undefined);
  }
});

test("ambiguous or unavailable Pre/Post exam data cannot silently change exported scores", async () => {
  const { actions, rows } = harness();
  rows.exams.push({ id: "second-pre-post", type: "pre_post_test" });
  assert.equal(
    (await actions.getAdminUserScoreExport([studentId])).error,
    "ambiguousExam",
  );
  const failed = harness({ failedTable: "exam_attempts" });
  assert.equal(
    (await failed.actions.getAdminUserScoreExport([studentId])).error,
    "loadFailed",
  );
});

test("export normalizes canonical UUID casing before lookup and deduplication", async () => {
  const { actions, rows } = harness();
  const id = "abcdefab-cdef-4abc-8def-abcdefabcdef";
  rows.profiles.push({
    id,
    name: "Case test",
    role: "student",
    student_id: null,
  });
  const result = await actions.getAdminUserScoreExport([id.toUpperCase(), id]);
  assert.equal(result.rows?.length, 2);
  assert.equal(result.rows?.[0].id, id);
});

test("export batches more than 100 selected users without dropping or reordering any user", async () => {
  const { actions, rows } = harness();
  const ids = Array.from(
    { length: 105 },
    (_, index) =>
      `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
  );
  rows.profiles.push(
    ...ids.map((id) => ({ id, name: id, role: "student", student_id: null })),
  );
  const result = await actions.getAdminUserScoreExport(ids);
  assert.equal(result.rows?.length, 210);
  assert.deepEqual(
    Array.from(result.rows ?? [], (row) => row.id).filter(
      (_, index) => index % 2 === 0,
    ),
    ids,
  );
});
