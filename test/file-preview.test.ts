import assert from "node:assert/strict";
import test from "node:test";

import { createFilePreviewUrls, revokeFilePreviewUrls } from "../src/lib/file-preview.ts";

test("creates and releases object URLs for selected image previews", () => {
  const previewUrls = createFilePreviewUrls([
    new File(["preview"], "preview.png", { type: "image/png" }),
  ]);

  assert.equal(previewUrls.length, 1);
  assert.match(previewUrls[0], /^blob:/);
  revokeFilePreviewUrls(previewUrls);
});
