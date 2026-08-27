import assert from "node:assert/strict";
import test from "node:test";

import { toAdminExamListItem } from "../src/lib/admin-exam.ts";

test("maps a newly created exam into the item displayed by the admin list", () => {
  const item = toAdminExamListItem({
    id: "exam-123",
    title: "Adult Nursing",
    description: null,
    time_limit_minutes: 90,
    is_published: false,
    created_at: "2026-08-27T00:00:00.000Z",
  });

  assert.deepEqual(item, {
    id: "exam-123",
    title: "Adult Nursing",
    description: null,
    time_limit_minutes: 90,
    is_published: false,
    question_count: 0,
    created_at: "2026-08-27T00:00:00.000Z",
  });
});
