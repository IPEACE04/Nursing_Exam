import assert from "node:assert/strict";
import test from "node:test";

import { appendQuestionMediaToFormData } from "../src/lib/question-media-form.ts";

test("preserves question and option images selected in React state when building FormData", () => {
  const formData = new FormData();
  const questionImage = new File(["question"], "question.png", { type: "image/png" });
  const optionBImage = new File(["option-b"], "option-b.jpg", { type: "image/jpeg" });

  appendQuestionMediaToFormData(formData, [questionImage], {
    A: [],
    B: [optionBImage],
    C: [],
    D: [],
  });

  assert.equal(formData.get("questionImage"), questionImage);
  assert.equal(formData.get("optionImageA"), null);
  assert.equal(formData.get("optionImageB"), optionBImage);
  assert.equal(formData.get("optionImageC"), null);
  assert.equal(formData.get("optionImageD"), null);
});
