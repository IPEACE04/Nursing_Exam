import assert from "node:assert/strict";
import test from "node:test";

import { getTimerInitialSeconds } from "../src/hooks/use-timer.ts";

test("waits for the loaded exam duration before starting a timer", () => {
  assert.equal(getTimerInitialSeconds(null, null), 0);
  assert.equal(getTimerInitialSeconds(40, null), 40 * 60);
});

test("resumes a saved timer without exceeding the current exam duration", () => {
  assert.equal(getTimerInitialSeconds(40, "2150"), 2150);
  assert.equal(getTimerInitialSeconds(40, "3599"), 40 * 60);
});
