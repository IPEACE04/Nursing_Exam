import assert from "node:assert/strict";
import test from "node:test";

import { openHiddenFileInput, releaseFileInputFocus } from "../src/lib/file-input-focus.ts";

test("opens the hidden file input from the upload button", () => {
  let clickCalls = 0;

  openHiddenFileInput({ click: () => { clickCalls += 1; } });

  assert.equal(clickCalls, 1);
});

test("releases focus from the file input after picking a file", () => {
  let blurCalls = 0;
  releaseFileInputFocus({ blur: () => { blurCalls += 1; } });
  assert.equal(blurCalls, 1);
});
