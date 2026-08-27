import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_IMAGE_SIZE_BYTES,
  validateImageFile,
  validateImageFiles,
} from "../src/lib/image-validation.ts";

test("accepts supported image files under the size limit", async () => {
  const file = new File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], "question.png", {
    type: "image/png",
  });

  assert.equal(await validateImageFile(file), null);
});

test("rejects unsupported image types", async () => {
  const file = new File(["not an image"], "question.gif", {
    type: "image/gif",
  });

  assert.equal(await validateImageFile(file), "รองรับเฉพาะไฟล์ JPG, PNG หรือ WebP");
});

test("rejects files larger than 5 MB", async () => {
  const file = new File([new Uint8Array(MAX_IMAGE_SIZE_BYTES + 1)], "large.png", {
    type: "image/png",
  });

  assert.equal(await validateImageFile(file), "ขนาดไฟล์ต้องไม่เกิน 5 MB");
});

test("rejects image collections over the configured limit", async () => {
  const files = Array.from(
    { length: 5 },
    (_, index) =>
      new File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], `image-${index}.png`, {
        type: "image/png",
      }),
  );

  assert.equal(await validateImageFiles(files, 4), "สามารถแนบรูปภาพได้ไม่เกิน 4 รูป");
});

test("rejects a file with a supported MIME type but invalid image bytes", async () => {
  const file = new File(["not an image"], "spoofed.png", { type: "image/png" });

  assert.equal(await validateImageFile(file), "ไฟล์รูปภาพไม่ถูกต้อง");
});
