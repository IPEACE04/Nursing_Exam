import assert from "node:assert/strict";
import test from "node:test";

import { restoreScrollPosition, scheduleScrollPositionRestore } from "../src/lib/scroll-position.ts";

test("restores the page scroll position immediately", () => {
  let receivedTop = -1;
  restoreScrollPosition({
    scrollTo: ({ top }: { top: number; left?: number; behavior?: "auto" | "smooth" }) => {
      receivedTop = top;
    },
  }, 420);

  assert.equal(receivedTop, 420);
});

test("restores scroll only after the refreshed layout has rendered", () => {
  const scheduled: Array<() => void> = [];
  let receivedTop = -1;

  scheduleScrollPositionRestore(
    { scrollTo: ({ top }: { top: number }) => { receivedTop = top; } },
    420,
    (callback) => scheduled.push(callback),
  );

  assert.equal(receivedTop, -1);
  scheduled.shift()?.();
  assert.equal(receivedTop, -1);
  scheduled.shift()?.();
  assert.equal(receivedTop, 420);
});
